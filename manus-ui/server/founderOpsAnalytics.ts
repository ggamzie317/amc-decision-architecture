import { buildSimulatorAnalytics } from "./simulatorAnalytics.js";
import type {
  OperationsSummary,
  ResearchSummary,
  SubmissionRecord,
  UsageEventRecord,
} from "./founderOpsTypes.js";

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
  const researchConsents = submissions.filter(
    item => item.researchUseConsent
  ).length;
  const languageDistribution: Record<string, number> = {};
  const caseTypeDistribution: Record<string, number> = {};
  const evidenceDistribution: Record<string, number> = {};
  const experienceDistribution: Record<string, number> = {};
  const experienceFunnels: Record<string, Record<string, number>> = {};
  const experienceById = new Map(
    submissions.map(item => [
      item.submissionId,
      item.structuralOutputJson.experienceVersion === "interactive-v2"
        ? "interactive-v2"
        : item.structuralOutputJson.experienceVersion === "interactive-v1"
          ? "interactive-v1"
          : "legacy",
    ])
  );
  for (const experience of ["legacy", "interactive-v1", "interactive-v2"])
    experienceFunnels[experience] = {
      preview_started: 0,
      full_intake_started: 0,
      full_intake_completed: 0,
      dashboard_generated: 0,
      detailed_report_opened: 0,
      print_save_clicked: 0,
    };
  // Rates are per journey: journeys that reached both stages over journeys
  // that reached the earlier one, so none can exceed 100%. V2 has no separate
  // preview step (no preview_completed); its preview gate is preview_started.
  const journeysWith = (eventType: string) =>
    new Set(
      events
        .filter(event => event.eventType === eventType)
        .map(event => event.submissionId)
    );
  const both = (from: Set<string>, to: Set<string>) =>
    rate(Array.from(from).filter(id => to.has(id)).length, from.size);
  const isV2 = (id: string) => experienceById.get(id) === "interactive-v2";
  const previewGate = new Set([
    ...Array.from(journeysWith("preview_completed")).filter(id => !isV2(id)),
    ...Array.from(journeysWith("preview_started")).filter(isV2),
  ]);
  const fullStarted = journeysWith("full_intake_started");
  const fullCompleted = journeysWith("full_intake_completed");
  const evidenceRequestedJourneys = journeysWith("external_evidence_requested");
  const seen = new Set<string>();
  for (const event of events) {
    const experience = experienceById.get(event.submissionId);
    if (!experience || !(event.eventType in experienceFunnels[experience]))
      continue;
    const marker = `${event.submissionId}:${event.eventType}`;
    if (seen.has(marker)) continue;
    seen.add(marker);
    experienceFunnels[experience][event.eventType]++;
  }
  submissions.forEach(item => {
    increment(languageDistribution, item.language.toUpperCase());
    increment(caseTypeDistribution, item.caseType);
    increment(evidenceDistribution, item.externalEvidenceMode);
    increment(experienceDistribution, experienceById.get(item.submissionId));
  });

  return {
    backendAvailable: true,
    simulator: buildSimulatorAnalytics(submissions, events),
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
      previewToFullIntake: both(previewGate, fullStarted),
      fullIntakeCompletion: both(fullStarted, fullCompleted),
      reportGeneration: both(fullCompleted, journeysWith("dashboard_generated")),
      externalEvidenceLive: both(
        evidenceRequestedJourneys,
        journeysWith("external_evidence_live")
      ),
      researchConsent: rate(researchConsents, submissions.length),
    },
    languageDistribution,
    caseTypeDistribution,
    evidenceDistribution,
    experienceDistribution,
    experienceFunnels,
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
