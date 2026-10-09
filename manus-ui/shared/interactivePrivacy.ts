/** Shared allowlist: interactive narratives remain in React memory only. */
export const identity = {
  experienceVersion: "interactive-v1",
  intakeSchemaVersion: "AMC-INTAKE-V4-15",
};
export const v2Identity = {
  experienceVersion: "interactive-v2",
  intakeSchemaVersion: "AMC-MODULES-V2-8",
};
export const caseTypes = [
  "Corporate Stay vs Exit",
  "MBA / EMBA / PhD Decision",
  "Overseas Relocation",
  "Entrepreneurship",
  "Industry Transition",
  "Role Upgrade / Downgrade",
  "Burnout-driven Decision",
  "Family Constraint-heavy Decision",
  "General Career Reconfiguration",
] as const;
export const postures = [
  "Stronger Transition Case",
  "Protect and Reconfigure",
  "Preserve and Validate",
  "더 강해진 전환 근거",
  "기반을 보호하며 재구성",
  "보존하며 검증",
] as const;
export const families = [
  "parallel-validation",
  "role-scope",
  "timing",
  "resource",
  "pathway",
] as const;
export const variables = [
  "financialRoom",
  "reversibility",
  "downsideExposure",
  "internalReadiness",
  "optionBSupport",
  "constraintLoad",
  "externalValidation",
] as const;
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
const obj = (v: unknown): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, any>)
    : {};
function selectedIdentity(value: unknown) {
  const v = obj(value);
  return v.experienceVersion === v2Identity.experienceVersion ||
    v.intakeSchemaVersion === v2Identity.intakeSchemaVersion
    ? v2Identity
    : identity;
}
export function isInteractive(value: unknown) {
  const v = obj(value);
  return (
    v.experienceVersion === identity.experienceVersion ||
    v.intakeSchemaVersion === identity.intakeSchemaVersion ||
    v.experienceVersion === v2Identity.experienceVersion ||
    v.intakeSchemaVersion === v2Identity.intakeSchemaVersion
  );
}
export function completedInteractive(value: unknown) {
  const v = obj(value);
  return (
    (v.experienceVersion === v2Identity.experienceVersion &&
      v.intakeSchemaVersion === v2Identity.intakeSchemaVersion &&
      v.completedIntakeQuestionCount === 8) ||
    (v.experienceVersion === identity.experienceVersion &&
      v.intakeSchemaVersion === identity.intakeSchemaVersion &&
      v.completedIntakeQuestionCount === 15)
  );
}
export function projectInteractivePatch(value: unknown): Record<string, any> {
  const v = obj(value),
    s = obj(v.structuralOutputJson),
    p = obj(s.postureBasis),
    safety = obj(s.safetyMargin),
    inputs = obj(safety.inputs);
  const baseline: Record<string, string> = {};
  for (const key of variables) {
    const band =
      obj(s.baselineBands)[key] ??
      obj(inputs[key]).band ??
      obj(p[key]).band ??
      (key === "downsideExposure" ? obj(p.structuralRisk).band : undefined);
    if (bands.includes(band)) baseline[key] = band;
  }
  const changing = Array.isArray(s.changingPlays)
    ? s.changingPlays
        .map((x: unknown) => obj(x).family)
        .filter((x: any) => families.includes(x))
        .slice(0, 5)
    : [];
  const band = safety.band ?? obj(v.safetyMarginStructuredData).band;
  const out: Record<string, any> = {
    answersJson: {},
    missingPoint: null,
    alternativePath: null,
    decisionConditionsJson: [],
    existingFifwmStructuredData: {},
    externalEvidenceJson: {},
    externalEvidenceConfidence: null,
    safetyMarginStructuredData: bands.includes(band) ? { band } : {},
    structuralOutputJson: {
      ...selectedIdentity(s),
      ...(Object.keys(baseline).length ? { baselineBands: baseline } : {}),
      ...(Array.isArray(s.changingPlays)
        ? {
            changingPlays: changing.map((family: string) => ({ family })),
            changingCount: changing.length,
          }
        : {}),
    },
  };
  if (completedInteractive(s) || v.fullIntakeCompletedAt)
    out.structuralOutputJson.completedIntakeQuestionCount =
      selectedIdentity(s) === v2Identity ? 8 : 15;
  if ("caseType" in v)
    out.caseType = caseTypes.includes(v.caseType) ? v.caseType : null;
  if (
    ["live", "unavailable", "demo"].includes(s.externalEvidenceStatus) &&
    selectedIdentity(s) === v2Identity
  )
    out.structuralOutputJson.externalEvidenceStatus = s.externalEvidenceStatus;
  if (postures.includes(obj(s.currentStructuralPosture).label))
    out.structuralOutputJson.currentStructuralPosture = {
      label: s.currentStructuralPosture.label,
    };
  if (bands.includes(band)) out.structuralOutputJson.safetyMargin = { band };
  const switches = Array.isArray(s.decisionSwitches)
    ? s.decisionSwitches.length
    : s.decisionSwitchCount;
  if (Number.isInteger(switches) && switches >= 0 && switches <= 20)
    out.structuralOutputJson.decisionSwitchCount = switches;
  for (const k of ["serviceStorageConsent", "researchUseConsent"])
    if (typeof v[k] === "boolean") out[k] = v[k];
  if (["en", "ko"].includes(v.language)) out.language = v.language;
  if (["live", "fallback", "mock"].includes(v.externalEvidenceMode))
    out.externalEvidenceMode = v.externalEvidenceMode;
  if (
    [
      "preview_started",
      "preview_completed",
      "full_intake_started",
      "full_intake_completed",
      "dashboard_generated",
      "report_generated",
      "detailed_report_opened",
      "print_save_clicked",
    ].includes(v.currentStage)
  )
    out.currentStage = v.currentStage;
  for (const k of [
    "previewStartedAt",
    "previewCompletedAt",
    "fullIntakeStartedAt",
    "fullIntakeCompletedAt",
    "reportGeneratedAt",
    "printSaveClickedAt",
  ])
    if (typeof v[k] === "string" && !Number.isNaN(Date.parse(v[k])))
      out[k] = new Date(v[k]).toISOString();
  return out;
}
export function projectInteractiveMetadata(value: unknown) {
  const v = obj(value),
    out: Record<string, unknown> = { ...selectedIdentity(v) };
  for (const key of ["derivedAnalysisSynced"])
    if (typeof v[key] === "boolean") out[key] = v[key];
  for (const key of ["externalEvidenceMode"])
    if (["live", "fallback", "mock", "unverified", "checking"].includes(v[key]))
      out[key] = v[key];
  for (const key of ["from", "to"])
    if (["en", "ko"].includes(v[key])) out[key] = v[key];
  if (typeof v.requestId === "string" && /^[a-f0-9-]{36}$/i.test(v.requestId))
    out.requestId = v.requestId;
  return out;
}
