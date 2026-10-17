import { completedInteractive, v2Identity } from "../shared/interactivePrivacy.js";
import { expectedIntakeAnswers, buildSimulatorAnalytics } from "./simulatorAnalytics.js";
import { isTestRecord } from "./testRecords.js";
import type { SubmissionRecord, UsageEventRecord } from "./founderOpsTypes.js";

export const funnelStages = [
  ["preview_started", "Preview Started"],
  ["preview_completed", "Preview Completed"],
  ["full_intake_started", "Full Intake Started"],
  ["full_intake_completed", "Full Intake Completed"],
  ["dashboard_generated", "Dashboard Generated"],
  ["detailed_report_opened", "Detailed Report Opened"],
  ["print_save_clicked", "Print / Save"],
] as const;
/**
 * V2 has no separate preview step: it records preview_started and
 * full_intake_started together and never emits preview_completed. Its funnel
 * therefore skips that stage instead of counting every V2 journey as missing it.
 */
export const v2FunnelStages = funnelStages.filter(
  ([key]) => key !== "preview_completed"
);
type Stage = readonly [string, string];
/** "v2" for interactive-v2 journeys; "legacy" for the retired MVP and V1. */
export const journeyExperience = (row: Pick<SubmissionRecord, "structuralOutputJson">) =>
  record(row.structuralOutputJson).experienceVersion ===
  v2Identity.experienceVersion
    ? ("v2" as const)
    : ("legacy" as const);
/**
 * V2 lifecycle prerequisites (first occurrence of each event). The detailed
 * report may open before dashboard_generated (that event waits for every
 * evidence topic), but printing is blocked until it is recorded.
 */
const v2Prerequisites: Record<string, string> = {
  full_intake_started: "preview_started",
  full_intake_completed: "full_intake_started",
  dashboard_generated: "full_intake_completed",
  detailed_report_opened: "full_intake_completed",
  print_save_clicked: "dashboard_generated",
};
const cases = [
  "Corporate Stay vs Exit",
  "MBA / EMBA / PhD Decision",
  "Overseas Relocation",
  "Entrepreneurship",
  "Industry Transition",
  "Role Upgrade / Downgrade",
  "Burnout-driven Decision",
  "Family Constraint-heavy Decision",
  "General Career Reconfiguration",
];
const postureLabels: Record<string, string> = {
  "Stronger Transition Case": "Stronger Transition Case",
  "더 강해진 전환 근거": "Stronger Transition Case",
  "Protect and Reconfigure": "Protect and Reconfigure",
  "기반을 보호하며 재구성": "Protect and Reconfigure",
  "Preserve and Validate": "Preserve and Validate",
  "보존하며 검증": "Preserve and Validate",
};
const familyLabels: Record<string, string> = {
  "parallel-validation": "Parallel Validation",
  "role-scope": "Role / Scope",
  timing: "Timing",
  resource: "Resource",
  pathway: "Pathway",
};
const safetyLabels: Record<string, string> = {
  strong: "Strong",
  developing: "Developing",
  weak: "Constrained",
  unknown: "Not Yet Established",
};
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const time = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value))
    ? Date.parse(value)
    : null;
const rate = (n: number, d: number) =>
  d ? Math.round((n / d) * 1000) / 10 : null;
const increment = (distribution: Record<string, number>, key: string) => {
  distribution[key] = (distribution[key] || 0) + 1;
};
const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
const latest = (values: Array<string | null | undefined>) =>
  values
    .filter((v): v is string => time(v) !== null)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

export function buildLaunchOpsSummary(
  allSubmissions: SubmissionRecord[],
  allEvents: UsageEventRecord[],
  windowDays: 7 | 30 | null,
  now = new Date()
) {
  const end = now.getTime();
  const cutoff = windowDays ? end - windowDays * 86_400_000 : 0;
  const within = (value: string) => {
    const t = time(value);
    return t !== null && t >= cutoff && t <= end;
  };
  // Cohort definition: submissions CREATED within the selected period, followed through now.
  // No anonymous site visitor estimate. Repeated actions count once per journey in the funnel.
  const submissions = allSubmissions.filter(
    row => row.serviceStorageConsent && within(row.createdAt)
  );
  const ids = new Set(submissions.map(row => row.submissionId));
  const allIds = new Set(allSubmissions.map(row => row.submissionId));
  const events = allEvents.filter(
    event =>
      ids.has(event.submissionId) &&
      time(event.createdAt) !== null &&
      Date.parse(event.createdAt) <= end
  );
  const byId = new Map<string, UsageEventRecord[]>();
  for (const event of events) {
    const list = byId.get(event.submissionId) ?? [];
    list.push(event);
    byId.set(event.submissionId, list);
  }
  byId.forEach(list =>
    list.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  );
  const reachedBy = new Map(
    funnelStages.map(([key]) => [
      key as string,
      new Set(
        events
          .filter(event => event.eventType === key)
          .map(event => event.submissionId)
      ),
    ])
  );
  const reached = (key: (typeof funnelStages)[number][0]) => reachedBy.get(key)!;
  const intersection = (a: Set<string>, b: Set<string>) =>
    Array.from(a).filter(id => b.has(id)).length;
  // Every rate is "journeys present in both stages / journeys in the earlier
  // stage", so no conversion can exceed 100%.
  const conversion = (
    from: (typeof funnelStages)[number][0],
    to: (typeof funnelStages)[number][0]
  ) => rate(intersection(reached(from), reached(to)), reached(from).size);
  const experienceIds = {
    v2: new Set(
      submissions
        .filter(row => journeyExperience(row) === "v2")
        .map(row => row.submissionId)
    ),
    legacy: new Set(
      submissions
        .filter(row => journeyExperience(row) === "legacy")
        .map(row => row.submissionId)
    ),
  };
  const buildFunnel = (stages: readonly Stage[], members: Set<string>) => {
    const sets = stages.map(
      ([key]) =>
        new Set(Array.from(reachedBy.get(key)!).filter(id => members.has(id)))
    );
    const step = (from: number, to: number) =>
      rate(intersection(sets[from], sets[to]), sets[from].size);
    return stages.map(([key, label], index) => ({
      key,
      label,
      count: sets[index].size,
      previousRate: index ? step(index - 1, index) : null,
      startRate: step(0, index),
    }));
  };
  // Primary funnel: V2 journeys. Legacy MVP / V1 rows keep their own funnel
  // (with Preview Completed) as a secondary, historical view.
  const funnel = buildFunnel(v2FunnelStages, experienceIds.v2);
  const legacyFunnel = buildFunnel(funnelStages, experienceIds.legacy);
  const completed = submissions.filter(
    row =>
      row.fullIntakeCompletedAt ||
      reached("full_intake_completed").has(row.submissionId)
  );
  const distributions = {
    caseType: {} as Record<string, number>,
    posture: {} as Record<string, number>,
    safetyMargin: Object.fromEntries(
      Object.values(safetyLabels).map(key => [key, 0])
    ),
    changingCount: { "0": 0, "1": 0, "2": 0, "3": 0, Unknown: 0 } as Record<
      string,
      number
    >,
    changingFamily: Object.fromEntries(
      Object.values(familyLabels).map(key => [key, 0])
    ),
    language: { EN: 0, KR: 0, Unknown: 0 },
  };
  const safeCase = (row: SubmissionRecord) =>
    row.caseType && cases.includes(row.caseType) ? row.caseType : "Unknown";
  const safePosture = (row: SubmissionRecord) =>
    postureLabels[
      String(
        record(record(row.structuralOutputJson).currentStructuralPosture).label
      )
    ] ?? "Unknown";
  const safety = (row: SubmissionRecord) =>
    safetyLabels[String(record(row.safetyMarginStructuredData).band)] ??
    "Not Yet Established";
  const plays = (row: SubmissionRecord): Record<string, unknown>[] | null => {
    const value = record(row.structuralOutputJson).changingPlays;
    return Array.isArray(value) &&
      value.length <= 3 &&
      value.every(
        item =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          familyLabels[String(item.family)]
      )
      ? value
      : null;
  };
  for (const row of submissions)
    increment(
      distributions.language,
      row.language === "en" ? "EN" : row.language === "ko" ? "KR" : "Unknown"
    );
  for (const row of completed) {
    increment(distributions.caseType, safeCase(row));
    increment(distributions.posture, safePosture(row));
    increment(distributions.safetyMargin, safety(row));
    const changing = plays(row);
    increment(
      distributions.changingCount,
      changing ? String(changing.length) : "Unknown"
    );
    // Family frequency is journeys containing the family, not number of repeated plays.
    for (const family of Array.from(
      new Set(changing?.map(play => familyLabels[String(play.family)]) ?? [])
    ))
      increment(distributions.changingFamily, family);
  }
  const durations: number[] = [];
  let incomplete = 0;
  let inactiveIncomplete = 0;
  const integrity = {
    suspiciousLifecycle: 0,
    completedAnswerCountMismatch: 0,
    completedMissingStructuralOutput: 0,
    liveMissingDerivedSync: 0,
    reportPrintMissingOrStaleDerived: 0,
    malformedJson: 0,
    finalChangingUnavailable: 0,
    v2DashboardWithoutIntakeCompleted: 0,
    v2CompletedMissingStructuralOutput: 0,
    v2PrintBeforeDashboard: 0,
    orphanEvents: allEvents.filter(
      event => !allIds.has(event.submissionId) && within(event.createdAt)
    ).length,
  };
  for (const row of submissions) {
    const journey = byId.get(row.submissionId) ?? [];
    const first = (key: string) =>
      journey.find(event => event.eventType === key);
    const started = first("full_intake_started");
    const finished = first("full_intake_completed");
    if (
      started &&
      finished &&
      Date.parse(finished.createdAt) >= Date.parse(started.createdAt)
    )
      durations.push(
        Date.parse(finished.createdAt) - Date.parse(started.createdAt)
      );
    const isV2 = journeyExperience(row) === "v2";
    if (
      reached("preview_started").has(row.submissionId) &&
      !reached("full_intake_completed").has(row.submissionId) &&
      !row.fullIntakeCompletedAt
    ) {
      incomplete++;
      const lastActivity = latest([
        row.updatedAt,
        ...journey.map(event => event.createdAt),
      ]);
      if (lastActivity && end - Date.parse(lastActivity) >= 86_400_000)
        inactiveIncomplete++;
    }
    const stages = funnelStages.map(([key]) => first(key));
    const ordered = stages.filter(
      (event): event is UsageEventRecord => !!event
    );
    const duplicateStart =
      journey.filter(event => event.eventType === "preview_started").length > 1;
    const v2LifecycleBroken = () =>
      Object.entries(v2Prerequisites).some(([key, prior]) => {
        const event = first(key);
        if (!event) return false;
        const before = first(prior);
        return (
          !before || Date.parse(event.createdAt) < Date.parse(before.createdAt)
        );
      });
    if (
      duplicateStart ||
      (isV2
        ? v2LifecycleBroken()
        : ordered.some(
            (event, index) =>
              index > 0 &&
              Date.parse(event.createdAt) <
                Date.parse(ordered[index - 1].createdAt)
          ) ||
          stages.some((event, index) => event && index > 0 && !stages[index - 1]))
    )
      integrity.suspiciousLifecycle++;
    const full =
      !!row.fullIntakeCompletedAt ||
      reached("full_intake_completed").has(row.submissionId);
    const output = record(row.structuralOutputJson);
    const outputValid =
      Object.keys(output).length > 0 &&
      !!record(output.currentStructuralPosture).label &&
      Array.isArray(output.changingPlays);
    const answers = record(row.answersJson);
    if (
      full &&
      ((expectedIntakeAnswers(row) === 0 && !completedInteractive(output)) || (row.storedAnswerCount ?? Object.keys(answers).length) !== expectedIntakeAnswers(row) ||
        Array.from({ length: expectedIntakeAnswers(row) }, (_, i) => String(i + 1)).some(
          key =>
            typeof answers[key] !== "string" || !String(answers[key]).trim()
        ))
    )
      integrity.completedAnswerCountMismatch++;
    const dashboard = reached("dashboard_generated").has(row.submissionId);
    if (dashboard && !outputValid)
      integrity.completedMissingStructuralOutput++;
    if (isV2) {
      if (dashboard && !reached("full_intake_completed").has(row.submissionId))
        integrity.v2DashboardWithoutIntakeCompleted++;
      // The allowlisted projection a completed V2 journey must carry.
      if (
        (full || dashboard) &&
        !(
          completedInteractive(output) &&
          !!record(output.currentStructuralPosture).label &&
          Array.isArray(output.changingPlays)
        )
      )
        integrity.v2CompletedMissingStructuralOutput++;
      const print = first("print_save_clicked");
      const generated = first("dashboard_generated");
      if (
        print &&
        (!generated ||
          Date.parse(print.createdAt) < Date.parse(generated.createdAt))
      )
        integrity.v2PrintBeforeDashboard++;
    }
    const syncs = journey.filter(
      event =>
        ["external_evidence_live", "external_evidence_fallback"].includes(
          event.eventType
        ) && record(event.metadataJson).derivedAnalysisSynced === true
    );
    const lastRequest = journey
      .filter(event => event.eventType === "external_evidence_requested")
      .at(-1);
    const lastSync = syncs.at(-1);
    // derivedAnalysisSynced was a legacy-route marker; V2 never sends it.
    if (
      !isV2 &&
      row.externalEvidenceMode === "live" &&
      (!lastSync ||
        lastSync.eventType !== "external_evidence_live" ||
        (lastRequest &&
          Date.parse(lastSync.createdAt) < Date.parse(lastRequest.createdAt)))
    )
      integrity.liveMissingDerivedSync++;
    const reportEvents = journey.filter(event =>
      ["detailed_report_opened", "print_save_clicked"].includes(event.eventType)
    );
    if (
      !isV2 &&
      reportEvents.length &&
      (!outputValid ||
        reportEvents.some(event => {
          const priorRequest = journey
            .filter(
              item =>
                item.eventType === "external_evidence_requested" &&
                Date.parse(item.createdAt) <= Date.parse(event.createdAt)
            )
            .at(-1);
          return (
            priorRequest &&
            !syncs.some(
              sync =>
                Date.parse(sync.createdAt) >=
                  Date.parse(priorRequest.createdAt) &&
                Date.parse(sync.createdAt) <= Date.parse(event.createdAt)
            )
          );
        }))
    )
      integrity.reportPrintMissingOrStaleDerived++;
    if (
      row.jsonShapeErrors?.length ||
      [
        row.answersJson,
        row.structuralOutputJson,
        row.externalEvidenceJson,
        row.safetyMarginStructuredData,
        row.existingFifwmStructuredData,
      ].some(
        value => !value || typeof value !== "object" || Array.isArray(value)
      ) ||
      !Array.isArray(row.decisionConditionsJson)
    )
      integrity.malformedJson++;
    if ((full || dashboard) && plays(row) === null)
      integrity.finalChangingUnavailable++;
  }
  durations.sort((a, b) => a - b);
  const isV2Journey = (id: string) => experienceIds.v2.has(id);
  // Provider diagnostics exist only for the retired legacy route; V2 does not
  // persist provider observations (privacy, by design).
  const requests = events.filter(
    event =>
      event.eventType === "external_evidence_requested" &&
      !isV2Journey(event.submissionId)
  );
  const observations = requests
    .map(event => record(record(event.metadataJson).providerObservation))
    .filter(
      value =>
        value.provider === "perplexity" &&
        value.apiGeneration === "agent-api" &&
        ["live", "fallback"].includes(String(value.status))
    );
  const liveRuns = observations.filter(value => value.status === "live");
  const fallbackRuns = observations.filter(
    value => value.status === "fallback"
  );
  const latencies = observations
    .map(value => value.latencyMs)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value >= 0
    );
  const latestObservation = [...observations].sort(
    (a, b) => (time(b.completedAt) ?? 0) - (time(a.completedAt) ?? 0)
  )[0];
  const legacyRows = submissions.filter(row => !isV2Journey(row.submissionId));
  const liveJourneys = legacyRows.filter(
    row => row.externalEvidenceMode === "live"
  ).length;
  const fallbackJourneys = legacyRows.filter(
    row => row.externalEvidenceMode === "fallback"
  ).length;
  // V2 evidence health comes from journey events only.
  const v2Events = (type: string) =>
    events.filter(
      event => event.eventType === type && isV2Journey(event.submissionId)
    );
  const v2Requested = v2Events("external_evidence_requested");
  const v2Live = v2Events("external_evidence_live");
  const v2Fallback = v2Events("external_evidence_fallback");
  const v2LiveJourneyIds = new Set(v2Live.map(event => event.submissionId));
  const v2ResultJourneyIds = new Set(
    [...v2Live, ...v2Fallback].map(event => event.submissionId)
  );
  const v2Evidence = {
    requests: v2Requested.length,
    requestJourneys: new Set(v2Requested.map(event => event.submissionId)).size,
    liveResults: v2Live.length,
    fallbackResults: v2Fallback.length,
    livePercent: rate(v2Live.length, v2Live.length + v2Fallback.length),
    liveJourneys: v2LiveJourneyIds.size,
    fallbackOnlyJourneys: v2ResultJourneyIds.size - v2LiveJourneyIds.size,
    liveJourneyPercent: rate(v2LiveJourneyIds.size, v2ResultJourneyIds.size),
    recentLiveEvent: latest(v2Live.map(event => event.createdAt)),
    recentFallbackEvent: latest(v2Fallback.map(event => event.createdAt)),
    diagnosticsRecorded: false as const,
  };
  const researchConsented = completed.filter(
    row => row.researchUseConsent
  ).length;
  return {
    backendAvailable: true as const,
    generatedAt: now.toISOString(),
    simulator: buildSimulatorAnalytics(submissions, events),
    windowDays,
    cohortSize: submissions.length,
    cohortDescription:
      "Journeys created in this period, followed through now. Funnel counts unique journeys; repeat clicks do not inflate conversion. Site visitors are not measured.",
    funnel,
    legacyFunnel,
    experienceCounts: {
      v2: experienceIds.v2.size,
      legacy: experienceIds.legacy.size,
    },
    quality: {
      intakeCompletionRate: conversion(
        "full_intake_started",
        "full_intake_completed"
      ),
      dashboardReportRate: conversion(
        "dashboard_generated",
        "detailed_report_opened"
      ),
      reportPrintRate: conversion(
        "detailed_report_opened",
        "print_save_clicked"
      ),
      incomplete,
      inactiveIncomplete,
      completionTimeSamples: durations.length,
      averageCompletionMs: average(durations),
      medianCompletionMs: durations.length
        ? Math.round(
            (durations[Math.floor((durations.length - 1) / 2)] +
              durations[Math.floor(durations.length / 2)]) /
              2
          )
        : null,
    },
    patterns: { completedCount: completed.length, ...distributions },
    research: {
      consented: researchConsented,
      completed: completed.length,
      percent: rate(researchConsented, completed.length),
    },
    evidence: {
      v2: v2Evidence,
      // Fields below: legacy MVP route only (provider observations).
      requests: requests.length,
      liveRuns: liveRuns.length,
      fallbackRuns: fallbackRuns.length,
      unknownRuns: requests.length - observations.length,
      liveJourneys,
      fallbackJourneys,
      livePercent: rate(liveJourneys, liveJourneys + fallbackJourneys),
      fallbackPercent: rate(fallbackJourneys, liveJourneys + fallbackJourneys),
      providerFailures: observations.filter(
        value => value.reasonCode === "provider_failure"
      ).length,
      invalidResponses: observations.filter(
        value => value.reasonCode === "invalid_provider_response"
      ).length,
      missingConfiguration: observations.filter(
        value => value.reasonCode === "provider_not_configured"
      ).length,
      timeouts: observations.filter(value => value.timedOut === true).length,
      averageLatencyMs: average(latencies),
      recentLatencyMs:
        typeof latestObservation?.latencyMs === "number"
          ? latestObservation.latencyMs
          : null,
      recentLiveSuccess: latest(
        liveRuns.map(value =>
          typeof value.completedAt === "string" ? value.completedAt : null
        )
      ),
    },
    integrity,
    lastPersistenceAt: latest([
      ...submissions.map(row => row.updatedAt),
      ...events.map(event => event.createdAt),
    ]),
    recent: [...submissions]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 12)
      .map(row => ({
        submissionId: row.submissionId,
        createdAt: row.createdAt,
        experience: journeyExperience(row) === "v2" ? "V2" : "Legacy",
        isTest: isTestRecord(row),
        caseType: safeCase(row),
        language:
          row.language === "ko"
            ? "KR"
            : row.language === "en"
              ? "EN"
              : "Unknown",
        stage:
          [...funnelStages]
            .reverse()
            .find(([key]) =>
              (byId.get(row.submissionId) ?? []).some(
                event => event.eventType === key
              )
            )?.[1] ?? "Unknown",
        evidence: row.externalEvidenceMode ?? "unknown",
        safetyMargin: safety(row),
        changingCount: plays(row)?.length ?? null,
        reportOpened: reached("detailed_report_opened").has(row.submissionId),
        printed: reached("print_save_clicked").has(row.submissionId),
        researchConsent: row.researchUseConsent,
      })),
  };
}

export type LaunchOpsSummary = ReturnType<typeof buildLaunchOpsSummary> & {
  testRecords?: import("./testRecords.js").TestRecordCount;
  configuration?: {
    /** V2 search preset (PERPLEXITY_V2_AGENT_PRESET, default medium). */
    preset: string;
    presetLabel?: string;
    provider: string;
    launchMode: string;
    productionSha?: string;
  };
};
