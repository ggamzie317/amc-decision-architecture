import type {
  OperationsSummary,
  ResearchSummary,
  SubmissionRecord,
  UsageEventRecord,
} from "./founderOpsTypes";

function increment(
  target: Record<string, number>,
  key: string | null | undefined
) {
  const normalized = key?.trim() || "Unknown";
  target[normalized] = (target[normalized] || 0) + 1;
}

function rate(numerator: number, denominator: number) {
  return denominator > 0
    ? Math.round((numerator / denominator) * 1000) / 10
    : 0;
}

export function buildOperationsSummary(
  submissions: SubmissionRecord[],
  events: UsageEventRecord[]
): OperationsSummary {
  const eventCount = (eventType: string) =>
    events.filter(event => event.eventType === eventType).length;
  const previewStarts = eventCount("preview_started");
  const previewCompletions = eventCount("preview_completed");
  const fullIntakeStarts = eventCount("full_intake_started");
  const fullIntakeCompletions = eventCount("full_intake_completed");
  const reportsGenerated = eventCount("dashboard_generated");
  const evidenceRequested = eventCount("external_evidence_requested");
  const evidenceLive = eventCount("external_evidence_live");
  const researchConsents = submissions.filter(
    item => item.researchUseConsent
  ).length;
  const languageDistribution: Record<string, number> = {};
  const caseTypeDistribution: Record<string, number> = {};
  const evidenceDistribution: Record<string, number> = {};
  submissions.forEach(item => {
    increment(languageDistribution, item.language.toUpperCase());
    increment(caseTypeDistribution, item.caseType);
    increment(evidenceDistribution, item.externalEvidenceMode);
  });

  return {
    backendAvailable: true,
    totals: {
      submissions: submissions.length,
      previewStarts,
      previewCompletions,
      fullIntakeStarts,
      fullIntakeCompletions,
      reportsGenerated,
      detailedReportsOpened: eventCount("detailed_report_opened"),
      printSaveClicks: eventCount("print_save_clicked"),
    },
    rates: {
      previewToFullIntake: rate(fullIntakeStarts, previewCompletions),
      fullIntakeCompletion: rate(fullIntakeCompletions, fullIntakeStarts),
      reportGeneration: rate(reportsGenerated, fullIntakeCompletions),
      externalEvidenceLive: rate(evidenceLive, evidenceRequested),
      researchConsent: rate(researchConsents, submissions.length),
    },
    languageDistribution,
    caseTypeDistribution,
    evidenceDistribution,
  };
}

export function buildResearchSummary(
  submissions: SubmissionRecord[],
  events: UsageEventRecord[]
): ResearchSummary {
  const consented = submissions.filter(item => item.researchUseConsent);
  const consentedIds = new Set(consented.map(item => item.submissionId));
  const summary = buildOperationsSummary(
    consented,
    events.filter(event => consentedIds.has(event.submissionId))
  );
  const safetyMarginDistribution: Record<string, number> = {};
  const frameworkSignalDistributions: Record<
    string,
    Record<string, number>
  > = {};
  const alternativePathSurfaced = { surfaced: 0, restrained: 0 };

  consented.forEach(item => {
    const safety = item.safetyMarginStructuredData;
    increment(
      safetyMarginDistribution,
      typeof safety.band === "string" ? safety.band : null
    );
    const signals = Array.isArray(item.existingFifwmStructuredData.signals)
      ? item.existingFifwmStructuredData.signals
      : [];
    signals.forEach(signal => {
      if (!signal || typeof signal !== "object") return;
      const record = signal as Record<string, unknown>;
      if (typeof record.label !== "string" || typeof record.value !== "string")
        return;
      frameworkSignalDistributions[record.label] ||= {};
      increment(frameworkSignalDistributions[record.label], record.value);
    });
    if (item.alternativePath?.trim()) alternativePathSurfaced.surfaced += 1;
    else alternativePathSurfaced.restrained += 1;
  });

  return {
    ...summary,
    safetyMarginDistribution,
    frameworkSignalDistributions,
    alternativePathSurfaced,
  };
}
