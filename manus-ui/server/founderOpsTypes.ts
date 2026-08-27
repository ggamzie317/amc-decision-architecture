export const AMC_PRODUCT_VERSION = "AMC-LAUNCH-V2";
export const AMC_FRAMEWORK_VERSION = "FIFWM-SM-V1";

export const usageEventTypes = [
  "preview_started",
  "preview_completed",
  "full_intake_started",
  "full_intake_completed",
  "external_evidence_requested",
  "external_evidence_live",
  "external_evidence_fallback",
  "dashboard_generated",
  "detailed_report_opened",
  "print_save_clicked",
  "language_changed",
] as const;

export type UsageEventType = (typeof usageEventTypes)[number];
export type AmcLanguage = "en" | "ko";
export type EvidenceMode = "live" | "fallback" | "mock" | null;

export type SubmissionPatch = {
  language?: AmcLanguage;
  caseType?: string;
  currentStage?: string;
  previewStartedAt?: string;
  previewCompletedAt?: string;
  fullIntakeStartedAt?: string;
  fullIntakeCompletedAt?: string;
  reportGeneratedAt?: string;
  printSaveClickedAt?: string;
  externalEvidenceMode?: EvidenceMode;
  externalEvidenceConfidence?: string | null;
  serviceStorageConsent?: boolean;
  researchUseConsent?: boolean;
  answersJson?: Record<string, string>;
  structuralOutputJson?: Record<string, unknown>;
  externalEvidenceJson?: Record<string, unknown>;
  missingPoint?: string;
  alternativePath?: string;
  decisionConditionsJson?: string[];
  safetyMarginStructuredData?: Record<string, unknown>;
  existingFifwmStructuredData?: Record<string, unknown>;
};

export type SubmissionRecord = {
  submissionId: string;
  createdAt: string;
  updatedAt: string;
  productVersion: string;
  frameworkVersion: string;
  language: AmcLanguage;
  caseType: string | null;
  currentStage: string;
  previewStartedAt: string | null;
  previewCompletedAt: string | null;
  fullIntakeStartedAt: string | null;
  fullIntakeCompletedAt: string | null;
  reportGeneratedAt: string | null;
  printSaveClickedAt: string | null;
  externalEvidenceMode: EvidenceMode;
  externalEvidenceConfidence: string | null;
  serviceStorageConsent: boolean;
  researchUseConsent: boolean;
  answersJson: Record<string, string>;
  structuralOutputJson: Record<string, unknown>;
  externalEvidenceJson: Record<string, unknown>;
  missingPoint: string | null;
  alternativePath: string | null;
  decisionConditionsJson: string[];
  safetyMarginStructuredData: Record<string, unknown>;
  existingFifwmStructuredData: Record<string, unknown>;
};

export type UsageEventRecord = {
  eventId: string;
  submissionId: string;
  eventType: UsageEventType;
  createdAt: string;
  metadataJson: Record<string, unknown>;
};

export type SubmissionFilters = {
  windowDays?: 7 | 30 | null;
  language?: AmcLanguage;
  caseType?: string;
  completion?: "complete" | "incomplete";
  researchConsent?: "yes" | "no";
  evidenceMode?: "live" | "fallback" | "mock";
};

export type OperationsSummary = {
  backendAvailable: boolean;
  totals: Record<string, number>;
  rates: Record<string, number>;
  languageDistribution: Record<string, number>;
  caseTypeDistribution: Record<string, number>;
  evidenceDistribution: Record<string, number>;
};

export type ResearchSummary = OperationsSummary & {
  safetyMarginDistribution: Record<string, number>;
  frameworkSignalDistributions: Record<string, Record<string, number>>;
  alternativePathSurfaced: Record<string, number>;
};

export type FounderOpsStore = {
  readonly available: boolean;
  createSubmission(
    language: AmcLanguage,
    serviceStorageConsent: boolean
  ): Promise<SubmissionRecord>;
  updateSubmission(
    submissionId: string,
    patch: SubmissionPatch
  ): Promise<boolean>;
  addEvent(
    submissionId: string,
    eventType: UsageEventType,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  listSubmissions(
    filters?: SubmissionFilters,
    limit?: number
  ): Promise<SubmissionRecord[]>;
  getSubmission(
    submissionId: string
  ): Promise<{
    submission: SubmissionRecord;
    events: UsageEventRecord[];
  } | null>;
};
