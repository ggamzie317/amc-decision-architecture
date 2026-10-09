import type { SubmissionRecord, UsageEventRecord } from "./founderOpsTypes.js";
export const simulatorEvents = [
  "simulator_opened",
  "scenario_variable_changed",
  "scenario_evaluated",
  "scenario_reset",
  "jev_assessment_requested",
  "jev_assessment_completed",
  "jev_assessment_unavailable",
];
const variables = [
  "financialRoom",
  "reversibility",
  "downsideExposure",
  "internalReadiness",
  "optionBSupport",
  "constraintLoad",
  "externalValidation",
];
const bands = [
  "strong",
  "developing",
  "weak",
  "unknown",
  "low",
  "moderate",
  "high",
  "light",
  "material",
  "heavy",
];
/** Strict allowlist: no raw text, provider data, scenario object or derived patch. */
export function sanitizeSimulatorMetadata(value: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  if (variables.includes(String(value.variable)))
    result.variable = value.variable;
  for (const key of ["baselineBand", "newBand"])
    if (bands.includes(String(value[key]))) result[key] = value[key];
  if (value.mode === "single" || value.mode === "multi")
    result.mode = value.mode;
  for (const key of ["postureChanged", "safetyChanged", "changingChanged"])
    if (typeof value[key] === "boolean") result[key] = value[key];
  for (const key of [
    "scenarioPlausibility",
    "evidenceSupport",
    "scenarioSensitivity",
  ])
    if (["low", "medium", "high"].includes(String(value[key])))
      result[key] = value[key];
  return result;
}
export function expectedIntakeAnswers(
  row: Pick<SubmissionRecord, "structuralOutputJson">
) {
  return row.structuralOutputJson.intakeSchemaVersion === "AMC-INTAKE-V4-15"
    ? 15
    : 29;
}
export function buildSimulatorAnalytics(
  submissions: SubmissionRecord[],
  events: UsageEventRecord[],
  researchOnly = false
) {
  const cohort = submissions.filter(
    s => !researchOnly || s.researchUseConsent === true
  );
  const ids = new Set(cohort.map(s => s.submissionId));
  const scoped = events.filter(e => ids.has(e.submissionId));
  const count = (type: string) =>
    scoped.filter(e => e.eventType === type).length;
  const interactiveIds = new Set(
    scoped
      .filter(
        e =>
          e.metadataJson.experienceVersion === "interactive-v1" &&
          e.eventType === "dashboard_generated"
      )
      .map(e => e.submissionId)
  );
  for (const s of cohort)
    if (s.reportGeneratedAt && expectedIntakeAnswers(s) === 15)
      interactiveIds.add(s.submissionId);
  const openedIds = new Set(
    scoped
      .filter(
        e =>
          e.eventType === "simulator_opened" &&
          interactiveIds.has(e.submissionId)
      )
      .map(e => e.submissionId)
  );
  const mostTestedVariables: Record<string, number> = Object.fromEntries(
    variables.map(v => [v, 0])
  );
  const directions: Record<string, number> = {},
    advisoryPatterns: Record<string, number> = {};
  const modes = { single: 0, multi: 0 };
  const changes = {
    posture: { changed: 0, unchanged: 0 },
    safety: { changed: 0, unchanged: 0 },
    changing: { changed: 0, unchanged: 0 },
  };
  for (const e of scoped) {
    const m = sanitizeSimulatorMetadata(e.metadataJson);
    if (
      e.eventType === "scenario_variable_changed" &&
      typeof m.variable === "string"
    ) {
      mostTestedVariables[m.variable]++;
      const key = `${m.variable}: ${m.baselineBand} → ${m.newBand}`;
      directions[key] = (directions[key] || 0) + 1;
    }
    if (e.eventType === "scenario_evaluated") {
      if (m.mode === "single" || m.mode === "multi") modes[m.mode]++;
      for (const key of ["posture", "safety", "changing"] as const)
        if (typeof m[`${key}Changed`] === "boolean")
          changes[key][m[`${key}Changed`] ? "changed" : "unchanged"]++;
    }
    if (e.eventType === "jev_assessment_completed")
      for (const key of [
        "scenarioPlausibility",
        "evidenceSupport",
        "scenarioSensitivity",
      ]) {
        if (typeof m[key] === "string") {
          const label = `${key}: ${m[key]}`;
          advisoryPatterns[label] = (advisoryPatterns[label] || 0) + 1;
        }
      }
  }
  return {
    label: "Operational / exploratory pattern, not a research conclusion",
    opened: count("simulator_opened"),
    eligibleBaselines: interactiveIds.size,
    adoptedBaselines: openedIds.size,
    adoptionRate: interactiveIds.size
      ? Math.round((openedIds.size / interactiveIds.size) * 1000) / 10
      : null,
    evaluations: count("scenario_evaluated"),
    modes,
    resets: count("scenario_reset"),
    jevRequests: count("jev_assessment_requested"),
    jevCompleted: count("jev_assessment_completed"),
    jevUnavailable: count("jev_assessment_unavailable"),
    mostTestedVariables,
    directions,
    changes,
    advisoryPatterns,
  };
}
export type SimulatorAnalytics = ReturnType<typeof buildSimulatorAnalytics>;
