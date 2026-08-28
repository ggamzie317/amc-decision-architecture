import postgres from "postgres";

import { adminAuthConfigured } from "./founderAdminAuth";
import type { FounderOpsStore, SubmissionRecord } from "./founderOpsTypes";

export const REQUIRED_SCHEMA: Record<string, readonly string[]> = {
  submissions: [
    "submission_id",
    "created_at",
    "updated_at",
    "product_version",
    "framework_version",
    "language",
    "case_type",
    "current_stage",
    "full_intake_completed_at",
    "external_evidence_mode",
    "external_evidence_confidence",
    "service_storage_consent",
    "research_use_consent",
    "answers_json",
    "structural_output_json",
    "external_evidence_json",
    "missing_point",
    "alternative_path",
    "decision_conditions_json",
    "safety_margin_structured_data",
    "existing_fifwm_structured_data",
  ],
  usage_events: [
    "event_id",
    "submission_id",
    "event_type",
    "created_at",
    "metadata_json",
  ],
};

export type DatabaseInspection = {
  database: "connected" | "not_configured" | "error";
  schema: "ready" | "missing_migration";
  submissionStorage: "ready" | "unavailable";
  usageEvents: "ready" | "unavailable";
  missing: string[];
};

export type DataQuality = {
  totalSubmissions: number;
  productVersionPresent: number;
  frameworkVersionPresent: number;
  completeFullIntake: number;
  structuralOutputSaved: number;
  safetyMarginSaved: number;
  externalEvidenceSaved: number;
  missingPointSaved: number;
  alternativePathStateSaved: number;
  decisionConditionsSaved: number;
  researchConsentRate: number;
};

function configured(name: string) {
  return Boolean(String(process.env[name] || "").trim());
}

export function emailNotificationConfigured() {
  return (
    String(
      process.env.AMC_FOUNDER_NOTIFICATIONS_ENABLED || ""
    ).toLowerCase() === "true" &&
    [
      "AMC_EMAIL_FROM",
      "AMC_SMTP_HOST",
      "AMC_SMTP_PORT",
      "AMC_SMTP_USER",
      "AMC_SMTP_PASS",
    ].every(configured)
  );
}

export function externalEvidenceConfigured() {
  return configured("PERPLEXITY_API_KEY") || configured("PPLX_API_KEY");
}

export async function inspectFounderOpsDatabase(
  connectionString = String(process.env.DATABASE_URL || "").trim()
): Promise<DatabaseInspection> {
  if (!connectionString) {
    return {
      database: "not_configured",
      schema: "missing_migration",
      submissionStorage: "unavailable",
      usageEvents: "unavailable",
      missing: Object.keys(REQUIRED_SCHEMA),
    };
  }

  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 8,
    idle_timeout: 2,
  });
  try {
    const rows = await sql<Array<{ table_name: string; column_name: string }>>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('submissions', 'usage_events')
    `;
    const found = new Map<string, Set<string>>();
    rows.forEach(row => {
      if (!found.has(row.table_name)) found.set(row.table_name, new Set());
      found.get(row.table_name)?.add(row.column_name);
    });
    const missing = Object.entries(REQUIRED_SCHEMA).flatMap(
      ([table, columns]) => {
        const present = found.get(table);
        if (!present) return [table];
        return columns
          .filter(column => !present.has(column))
          .map(column => `${table}.${column}`);
      }
    );
    const submissionsReady = !missing.some(item =>
      item.startsWith("submissions")
    );
    const usageReady = !missing.some(item => item.startsWith("usage_events"));
    return {
      database: "connected",
      schema: missing.length ? "missing_migration" : "ready",
      submissionStorage: submissionsReady ? "ready" : "unavailable",
      usageEvents: usageReady ? "ready" : "unavailable",
      missing,
    };
  } catch {
    return {
      database: "error",
      schema: "missing_migration",
      submissionStorage: "unavailable",
      usageEvents: "unavailable",
      missing: [],
    };
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined);
  }
}

function hasObjectData(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

export function buildDataQuality(submissions: SubmissionRecord[]): DataQuality {
  const count = (predicate: (submission: SubmissionRecord) => boolean) =>
    submissions.filter(predicate).length;
  const totalSubmissions = submissions.length;
  const researchConsents = count(item => item.researchUseConsent);
  return {
    totalSubmissions,
    productVersionPresent: count(item => Boolean(item.productVersion.trim())),
    frameworkVersionPresent: count(item =>
      Boolean(item.frameworkVersion.trim())
    ),
    completeFullIntake: count(
      item =>
        Boolean(item.fullIntakeCompletedAt) &&
        Object.values(item.answersJson).filter(answer => answer.trim())
          .length === 29
    ),
    structuralOutputSaved: count(item =>
      hasObjectData(item.structuralOutputJson)
    ),
    safetyMarginSaved: count(item =>
      hasObjectData(item.safetyMarginStructuredData)
    ),
    externalEvidenceSaved: count(item =>
      hasObjectData(item.externalEvidenceJson)
    ),
    missingPointSaved: count(item => Boolean(item.missingPoint?.trim())),
    alternativePathStateSaved: count(item => item.alternativePath !== null),
    decisionConditionsSaved: count(
      item => item.decisionConditionsJson.length > 0
    ),
    researchConsentRate:
      totalSubmissions > 0
        ? Math.round((researchConsents / totalSubmissions) * 1000) / 10
        : 0,
  };
}

export async function founderHealth(
  store: FounderOpsStore,
  inspection?: DatabaseInspection
) {
  const database = inspection || (await inspectFounderOpsDatabase());
  let dataQuality: DataQuality | null = null;
  if (database.schema === "ready" && store.available) {
    try {
      dataQuality = buildDataQuality(await store.listSubmissions({}, 10_000));
    } catch {
      // A health response remains safe and useful when the data query fails.
    }
  }
  return {
    ...database,
    adminSession: adminAuthConfigured() ? "ready" : "not_configured",
    emailNotification: emailNotificationConfigured()
      ? "configured"
      : "not_configured",
    externalEvidence: externalEvidenceConfigured()
      ? "configured"
      : "not_configured",
    dataQuality,
  };
}
