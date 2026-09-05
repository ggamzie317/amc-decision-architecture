import {
  buildOperationsSummary,
  buildResearchSummary,
} from "./founderOpsAnalytics.js";
import {
  usageEventTypes,
  type AmcLanguage,
  type FounderOpsStore,
  type SubmissionFilters,
  type SubmissionPatch,
  type UsageEventType,
} from "./founderOpsTypes.js";

type TrackBody = {
  submissionId?: unknown;
  newSubmission?: unknown;
  language?: unknown;
  serviceStorageConsent?: unknown;
  eventType?: unknown;
  metadata?: unknown;
  patch?: unknown;
};

const stringLimits: Partial<Record<keyof SubmissionPatch, number>> = {
  caseType: 120,
  currentStage: 80,
  externalEvidenceConfidence: 40,
  missingPoint: 4000,
  alternativePath: 4000,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedObject(value: unknown, maxBytes: number) {
  if (!isRecord(value)) return undefined;
  return JSON.stringify(value).length <= maxBytes ? value : undefined;
}

function sanitizePatch(value: unknown): SubmissionPatch {
  if (!isRecord(value)) return {};
  const patch: SubmissionPatch = {};
  const booleanKeys = ["serviceStorageConsent", "researchUseConsent"] as const;
  booleanKeys.forEach(key => {
    if (typeof value[key] === "boolean") patch[key] = value[key];
  });
  if (value.language === "en" || value.language === "ko")
    patch.language = value.language;
  if (
    value.externalEvidenceMode === "live" ||
    value.externalEvidenceMode === "fallback" ||
    value.externalEvidenceMode === "mock" ||
    value.externalEvidenceMode === null
  ) {
    patch.externalEvidenceMode = value.externalEvidenceMode;
  }
  Object.entries(stringLimits).forEach(([rawKey, maxLength]) => {
    const key = rawKey as keyof typeof stringLimits;
    const input = value[key];
    if (
      (typeof input === "string" && input.length <= (maxLength || 0)) ||
      input === null
    ) {
      (patch as Record<string, unknown>)[key] = input;
    }
  });
  const timestampKeys = [
    "previewStartedAt",
    "previewCompletedAt",
    "fullIntakeStartedAt",
    "fullIntakeCompletedAt",
    "reportGeneratedAt",
    "printSaveClickedAt",
  ] as const;
  timestampKeys.forEach(key => {
    const input = value[key];
    if (typeof input === "string" && !Number.isNaN(Date.parse(input)))
      patch[key] = new Date(input).toISOString();
  });
  const answers = boundedObject(value.answersJson, 80_000);
  if (answers)
    patch.answersJson = Object.fromEntries(
      Object.entries(answers)
        .slice(0, 29)
        .map(([key, answer]) => [
          key.slice(0, 8),
          String(answer).slice(0, 4000),
        ])
    );
  const objectFields = [
    "structuralOutputJson",
    "externalEvidenceJson",
    "safetyMarginStructuredData",
    "existingFifwmStructuredData",
  ] as const;
  objectFields.forEach(key => {
    const object = boundedObject(value[key], 100_000);
    if (object) patch[key] = object;
  });
  if (Array.isArray(value.decisionConditionsJson)) {
    patch.decisionConditionsJson = value.decisionConditionsJson
      .filter((item): item is string => typeof item === "string")
      .slice(0, 20)
      .map(item => item.slice(0, 2000));
  }
  return patch;
}

export async function trackFounderOps(body: TrackBody, store: FounderOpsStore) {
  if (body.serviceStorageConsent !== true)
    return { ok: true, stored: false, reason: "consent_required" };
  if (!store.available)
    return { ok: true, stored: false, reason: "backend_unavailable" };
  const language: AmcLanguage = body.language === "ko" ? "ko" : "en";
  const eventType = usageEventTypes.includes(body.eventType as UsageEventType)
    ? (body.eventType as UsageEventType)
    : null;
  if (!eventType) return { ok: false, stored: false, reason: "invalid_event" };
  const startsNewJourney =
    eventType === "preview_started" && body.newSubmission === true;
  let submissionId =
    typeof body.submissionId === "string" &&
    /^AMC-\d{8}-[A-F0-9]{8}$/.test(body.submissionId)
      ? body.submissionId
      : "";
  if (startsNewJourney) {
    const submission = await store.createSubmission(language, true);
    submissionId = submission.submissionId;
  } else if (submissionId && !(await store.getSubmission(submissionId))) {
    submissionId = "";
  }
  if (!startsNewJourney && !submissionId) {
    const submission = await store.createSubmission(language, true);
    submissionId = submission.submissionId;
  }
  const patch = sanitizePatch(body.patch);
  if (Object.keys(patch).length > 0)
    await store.updateSubmission(submissionId, patch);
  const metadata = boundedObject(body.metadata, 4000) || {};
  await store.addEvent(submissionId, eventType, metadata);
  return { ok: true, stored: true, submissionId };
}

export async function founderSummary(
  store: FounderOpsStore,
  windowDays: 7 | 30 | null,
  researchOnly: boolean
) {
  if (!store.available) return { backendAvailable: false };
  const submissions = await store.listSubmissions({ windowDays }, 10_000);
  const eventGroups = await Promise.all(
    submissions.map(item => store.getSubmission(item.submissionId))
  );
  const events = eventGroups.flatMap(group => group?.events || []);
  return researchOnly
    ? buildResearchSummary(submissions, events)
    : buildOperationsSummary(submissions, events);
}

export function parseSubmissionFilters(
  query: Record<string, unknown>
): SubmissionFilters {
  return {
    windowDays: query.window === "7" ? 7 : query.window === "30" ? 30 : null,
    language:
      query.language === "en" || query.language === "ko"
        ? query.language
        : undefined,
    caseType:
      typeof query.caseType === "string"
        ? query.caseType.slice(0, 120)
        : undefined,
    completion:
      query.completion === "complete" || query.completion === "incomplete"
        ? query.completion
        : undefined,
    researchConsent:
      query.researchConsent === "yes" || query.researchConsent === "no"
        ? query.researchConsent
        : undefined,
    evidenceMode:
      query.evidenceMode === "live" ||
      query.evidenceMode === "fallback" ||
      query.evidenceMode === "mock"
        ? query.evidenceMode
        : undefined,
  };
}

function csvCell(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildSubmissionsCsv(
  rows: Awaited<ReturnType<FounderOpsStore["listSubmissions"]>>,
  full: boolean
) {
  const headers = [
    "submission_id",
    "created_at",
    "product_version",
    "framework_version",
    "language",
    "case_type",
    "current_stage",
    "full_intake_completed",
    "evidence_mode",
    "evidence_confidence",
    "report_generated",
    "print_save_clicked",
    "service_storage_consent",
    "research_use_consent",
    "missing_point",
    "alternative_path",
    "decision_conditions",
    "safety_margin",
    "framework_structured_data",
    ...(full ? ["answers", "structural_output", "external_evidence"] : []),
  ];
  const lines = rows.map(item =>
    [
      item.submissionId,
      item.createdAt,
      item.productVersion,
      item.frameworkVersion,
      item.language,
      item.caseType,
      item.currentStage,
      Boolean(item.fullIntakeCompletedAt),
      item.externalEvidenceMode,
      item.externalEvidenceConfidence,
      Boolean(item.reportGeneratedAt),
      Boolean(item.printSaveClickedAt),
      item.serviceStorageConsent,
      item.researchUseConsent,
      item.missingPoint,
      item.alternativePath,
      item.decisionConditionsJson,
      item.safetyMarginStructuredData,
      item.existingFifwmStructuredData,
      ...(full
        ? [
            item.answersJson,
            item.structuralOutputJson,
            item.externalEvidenceJson,
          ]
        : []),
    ]
      .map(csvCell)
      .join(",")
  );
  return `\uFEFF${headers.map(csvCell).join(",")}\r\n${lines.join("\r\n")}\r\n`;
}
