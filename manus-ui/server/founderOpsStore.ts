import { randomBytes, randomUUID } from "node:crypto";
import postgres, { type JSONValue, type Sql } from "postgres";

import {
  AMC_FRAMEWORK_VERSION,
  AMC_PRODUCT_VERSION,
  type AmcLanguage,
  type FounderOpsStore,
  type SubmissionFilters,
  type SubmissionPatch,
  type SubmissionRecord,
  type UsageEventRecord,
  type UsageEventType,
} from "./founderOpsTypes.js";

const jsonFields = new Set([
  "answers_json",
  "structural_output_json",
  "external_evidence_json",
  "decision_conditions_json",
  "safety_margin_structured_data",
  "existing_fifwm_structured_data",
]);

const patchColumns: Record<keyof SubmissionPatch, string> = {
  language: "language",
  caseType: "case_type",
  currentStage: "current_stage",
  previewStartedAt: "preview_started_at",
  previewCompletedAt: "preview_completed_at",
  fullIntakeStartedAt: "full_intake_started_at",
  fullIntakeCompletedAt: "full_intake_completed_at",
  reportGeneratedAt: "report_generated_at",
  printSaveClickedAt: "print_save_clicked_at",
  externalEvidenceMode: "external_evidence_mode",
  externalEvidenceConfidence: "external_evidence_confidence",
  serviceStorageConsent: "service_storage_consent",
  researchUseConsent: "research_use_consent",
  answersJson: "answers_json",
  structuralOutputJson: "structural_output_json",
  externalEvidenceJson: "external_evidence_json",
  missingPoint: "missing_point",
  alternativePath: "alternative_path",
  decisionConditionsJson: "decision_conditions_json",
  safetyMarginStructuredData: "safety_margin_structured_data",
  existingFifwmStructuredData: "existing_fifwm_structured_data",
};

export class DataBackendUnavailableError extends Error {
  constructor() {
    super("Data backend not configured");
  }
}

export function generateSubmissionId(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `AMC-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringRecord(value: unknown): Record<string, string> {
  const object = asObject(value);
  return Object.fromEntries(
    Object.entries(object).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(String(value)).toISOString();
}

function mapSubmission(row: Record<string, unknown>): SubmissionRecord {
  return {
    submissionId: String(row.submission_id),
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    updatedAt: toIso(row.updated_at) || new Date().toISOString(),
    productVersion: String(row.product_version),
    frameworkVersion: String(row.framework_version),
    language: row.language === "ko" ? "ko" : "en",
    caseType: typeof row.case_type === "string" ? row.case_type : null,
    currentStage: String(row.current_stage || "preview_started"),
    previewStartedAt: toIso(row.preview_started_at),
    previewCompletedAt: toIso(row.preview_completed_at),
    fullIntakeStartedAt: toIso(row.full_intake_started_at),
    fullIntakeCompletedAt: toIso(row.full_intake_completed_at),
    reportGeneratedAt: toIso(row.report_generated_at),
    printSaveClickedAt: toIso(row.print_save_clicked_at),
    externalEvidenceMode:
      row.external_evidence_mode === "live" ||
      row.external_evidence_mode === "fallback" ||
      row.external_evidence_mode === "mock"
        ? row.external_evidence_mode
        : null,
    externalEvidenceConfidence:
      typeof row.external_evidence_confidence === "string"
        ? row.external_evidence_confidence
        : null,
    serviceStorageConsent: row.service_storage_consent === true,
    researchUseConsent: row.research_use_consent === true,
    answersJson: asStringRecord(row.answers_json),
    structuralOutputJson: asObject(row.structural_output_json),
    externalEvidenceJson: asObject(row.external_evidence_json),
    missingPoint:
      typeof row.missing_point === "string" ? row.missing_point : null,
    alternativePath:
      typeof row.alternative_path === "string" ? row.alternative_path : null,
    decisionConditionsJson: Array.isArray(row.decision_conditions_json)
      ? row.decision_conditions_json.filter(
          (item): item is string => typeof item === "string"
        )
      : [],
    safetyMarginStructuredData: asObject(row.safety_margin_structured_data),
    existingFifwmStructuredData: asObject(row.existing_fifwm_structured_data),
  };
}

function mapEvent(row: Record<string, unknown>): UsageEventRecord {
  return {
    eventId: String(row.event_id),
    submissionId: String(row.submission_id),
    eventType: String(row.event_type) as UsageEventType,
    createdAt: toIso(row.created_at) || new Date().toISOString(),
    metadataJson: asObject(row.metadata_json),
  };
}

export class PostgresFounderOpsStore implements FounderOpsStore {
  readonly available = true;

  constructor(private readonly sql: Sql) {}

  async createSubmission(
    language: AmcLanguage,
    serviceStorageConsent: boolean
  ) {
    const submissionId = generateSubmissionId();
    const rows = await this.sql`
      INSERT INTO submissions (
        submission_id, product_version, framework_version, language, current_stage,
        preview_started_at, service_storage_consent, research_use_consent
      ) VALUES (
        ${submissionId}, ${AMC_PRODUCT_VERSION}, ${AMC_FRAMEWORK_VERSION}, ${language},
        'preview_started', NOW(), ${serviceStorageConsent}, FALSE
      )
      RETURNING *
    `;
    return mapSubmission(rows[0] as Record<string, unknown>);
  }

  async updateSubmission(submissionId: string, patch: SubmissionPatch) {
    const entries = Object.entries(patch).filter(
      ([, value]) => value !== undefined
    );
    if (entries.length === 0) return true;
    const values: NonNullable<Parameters<Sql["unsafe"]>[1]> = [];
    const assignments = entries.map(([key, value], index) => {
      const column = patchColumns[key as keyof SubmissionPatch];
      values.push(
        jsonFields.has(column)
          ? this.sql.json(value as JSONValue)
          : typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ||
              value === null
            ? value
            : String(value)
      );
      return `${column} = $${index + 1}${jsonFields.has(column) ? "::jsonb" : ""}`;
    });
    values.push(submissionId);
    const rows = await this.sql.unsafe(
      `UPDATE submissions SET ${assignments.join(", ")}, updated_at = NOW() WHERE submission_id = $${values.length} RETURNING submission_id`,
      values
    );
    return rows.length === 1;
  }

  async addEvent(
    submissionId: string,
    eventType: UsageEventType,
    metadata: Record<string, unknown> = {}
  ) {
    await this.sql`
      INSERT INTO usage_events (event_id, submission_id, event_type, metadata_json)
      VALUES (${randomUUID()}, ${submissionId}, ${eventType}, ${this.sql.json(metadata as JSONValue)})
    `;
  }

  async listSubmissions(filters: SubmissionFilters = {}, limit = 500) {
    const rows = await this
      .sql`SELECT * FROM submissions ORDER BY created_at DESC LIMIT ${Math.min(limit, 10_000)}`;
    const cutoff = filters.windowDays
      ? Date.now() - filters.windowDays * 86_400_000
      : 0;
    return rows
      .map(row => mapSubmission(row as Record<string, unknown>))
      .filter(item => !cutoff || new Date(item.createdAt).getTime() >= cutoff)
      .filter(item => !filters.language || item.language === filters.language)
      .filter(item => !filters.caseType || item.caseType === filters.caseType)
      .filter(
        item =>
          !filters.completion ||
          (filters.completion === "complete") ===
            Boolean(item.fullIntakeCompletedAt)
      )
      .filter(
        item =>
          !filters.researchConsent ||
          (filters.researchConsent === "yes") === item.researchUseConsent
      )
      .filter(
        item =>
          !filters.evidenceMode ||
          item.externalEvidenceMode === filters.evidenceMode
      );
  }

  async getSubmission(submissionId: string) {
    const rows = await this
      .sql`SELECT * FROM submissions WHERE submission_id = ${submissionId} LIMIT 1`;
    if (!rows[0]) return null;
    const eventRows = await this
      .sql`SELECT * FROM usage_events WHERE submission_id = ${submissionId} ORDER BY created_at ASC`;
    return {
      submission: mapSubmission(rows[0] as Record<string, unknown>),
      events: eventRows.map(row => mapEvent(row as Record<string, unknown>)),
    };
  }
}

export class MemoryFounderOpsStore implements FounderOpsStore {
  readonly available = true;
  readonly submissions = new Map<string, SubmissionRecord>();
  readonly events: UsageEventRecord[] = [];

  async createSubmission(
    language: AmcLanguage,
    serviceStorageConsent: boolean
  ) {
    const now = new Date().toISOString();
    const submission: SubmissionRecord = {
      submissionId: generateSubmissionId(),
      createdAt: now,
      updatedAt: now,
      productVersion: AMC_PRODUCT_VERSION,
      frameworkVersion: AMC_FRAMEWORK_VERSION,
      language,
      caseType: null,
      currentStage: "preview_started",
      previewStartedAt: now,
      previewCompletedAt: null,
      fullIntakeStartedAt: null,
      fullIntakeCompletedAt: null,
      reportGeneratedAt: null,
      printSaveClickedAt: null,
      externalEvidenceMode: null,
      externalEvidenceConfidence: null,
      serviceStorageConsent,
      researchUseConsent: false,
      answersJson: {},
      structuralOutputJson: {},
      externalEvidenceJson: {},
      missingPoint: null,
      alternativePath: null,
      decisionConditionsJson: [],
      safetyMarginStructuredData: {},
      existingFifwmStructuredData: {},
    };
    this.submissions.set(submission.submissionId, submission);
    return structuredClone(submission);
  }

  async updateSubmission(submissionId: string, patch: SubmissionPatch) {
    const existing = this.submissions.get(submissionId);
    if (!existing) return false;
    this.submissions.set(submissionId, {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  async addEvent(
    submissionId: string,
    eventType: UsageEventType,
    metadata: Record<string, unknown> = {}
  ) {
    if (!this.submissions.has(submissionId)) return;
    this.events.push({
      eventId: randomUUID(),
      submissionId,
      eventType,
      createdAt: new Date().toISOString(),
      metadataJson: metadata,
    });
  }

  async listSubmissions(filters: SubmissionFilters = {}, limit = 500) {
    const cutoff = filters.windowDays
      ? Date.now() - filters.windowDays * 86_400_000
      : 0;
    return Array.from(this.submissions.values())
      .filter(item => !cutoff || new Date(item.createdAt).getTime() >= cutoff)
      .filter(item => !filters.language || item.language === filters.language)
      .filter(item => !filters.caseType || item.caseType === filters.caseType)
      .filter(
        item =>
          !filters.completion ||
          (filters.completion === "complete") ===
            Boolean(item.fullIntakeCompletedAt)
      )
      .filter(
        item =>
          !filters.researchConsent ||
          (filters.researchConsent === "yes") === item.researchUseConsent
      )
      .filter(
        item =>
          !filters.evidenceMode ||
          item.externalEvidenceMode === filters.evidenceMode
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(item => structuredClone(item));
  }

  async getSubmission(submissionId: string) {
    const submission = this.submissions.get(submissionId);
    if (!submission) return null;
    return {
      submission: structuredClone(submission),
      events: structuredClone(
        this.events.filter(event => event.submissionId === submissionId)
      ),
    };
  }
}

let sqlClient: Sql | null = null;

export function getFounderOpsStore(): FounderOpsStore {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    return {
      available: false,
      createSubmission: async () => {
        throw new DataBackendUnavailableError();
      },
      updateSubmission: async () => false,
      addEvent: async () => undefined,
      listSubmissions: async () => {
        throw new DataBackendUnavailableError();
      },
      getSubmission: async () => {
        throw new DataBackendUnavailableError();
      },
    };
  }
  sqlClient ||= postgres(connectionString, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 8,
  });
  return new PostgresFounderOpsStore(sqlClient);
}
