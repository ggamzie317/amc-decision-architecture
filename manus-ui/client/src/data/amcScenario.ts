import {
  buildProductApplicationV3,
  deriveSafetyMarginCore,
  type ProductApplicationBuildInput,
  type ProductApplicationV3,
  type StructuralStrength,
  type StructuralRisk,
  type StructuralLoad,
} from "./amcProductApplicationV3";
export type ScenarioOverrides = Partial<{
  financialRoom: StructuralStrength;
  reversibility: StructuralStrength;
  downsideExposure: StructuralRisk;
  internalReadiness: StructuralStrength;
  optionBSupport: StructuralStrength;
  constraintLoad: StructuralLoad;
  externalValidation: StructuralStrength;
}>;
export type ScenarioVariable = keyof ScenarioOverrides;
export const scenarioVariables = [
  "financialRoom",
  "reversibility",
  "downsideExposure",
  "internalReadiness",
  "optionBSupport",
  "constraintLoad",
  "externalValidation",
] as const;
export function baselineBands(
  input: ProductApplicationBuildInput
): Required<ScenarioOverrides> {
  return {
    financialRoom: input.safetyMarginInputs.financialRoom.band,
    reversibility: input.safetyMarginInputs.reversibility.band,
    downsideExposure: input.safetyMarginInputs.downsideExposure.band,
    internalReadiness: input.structuralSignals.internalReadiness.band,
    optionBSupport: input.structuralSignals.optionBSupport.band,
    constraintLoad: input.structuralSignals.constraintLoad.band,
    externalValidation: input.structuralSignals.externalValidation.band,
  };
}
/** Copies the existing engine contract; evidence and answers are never modified. */
export function applyScenarioOverrides(
  baseline: ProductApplicationBuildInput,
  overrides: ScenarioOverrides
): ProductApplicationBuildInput {
  const next = structuredClone(baseline);
  for (const key of scenarioVariables) {
    const value = overrides[key];
    if (value === undefined || value === baselineBands(baseline)[key]) continue;
    // Provenance types belong to the existing engine. Hypothetical scope is conveyed by the scenario wrapper/UI, never persisted as actual evidence.
    if (key === "financialRoom")
      next.safetyMarginInputs.financialRoom = {
        ...next.safetyMarginInputs.financialRoom,
        band: value as StructuralStrength,
        source: "current-user-structured",
      };
    else if (key === "reversibility") {
      next.safetyMarginInputs.reversibility = {
        band: value as StructuralStrength,
        source: "current-user-structured",
      };
      next.structuralSignals.reversibility = {
        ...next.safetyMarginInputs.reversibility,
      };
    } else if (key === "downsideExposure") {
      next.safetyMarginInputs.downsideExposure = {
        band: value as StructuralRisk,
        source: "current-user-structured",
      };
      next.structuralSignals.structuralRisk = {
        ...next.safetyMarginInputs.downsideExposure,
      };
    } else if (key === "constraintLoad")
      next.structuralSignals.constraintLoad = {
        band: value as StructuralLoad,
        source: "current-user-structured",
      };
    else
      next.structuralSignals[key] = {
        band: value as StructuralStrength,
        source: "current-user-structured",
      };
  }
  if (
    ["financialRoom", "reversibility", "downsideExposure"].some(
      key =>
        overrides[key as ScenarioVariable] !== undefined &&
        overrides[key as ScenarioVariable] !==
          baselineBands(baseline)[key as ScenarioVariable]
    )
  ) {
    const safety = deriveSafetyMarginCore(next.safetyMarginInputs);
    next.structuralSignals.safetyMargin = {
      band: safety.band,
      source: safety.source,
    };
  }
  return next;
}
export function evaluateScenario(
  input: ProductApplicationBuildInput,
  overrides: ScenarioOverrides
) {
  return buildProductApplicationV3(applyScenarioOverrides(input, overrides));
}
export function updateScenario(
  input: ProductApplicationBuildInput,
  current: ScenarioOverrides,
  key: ScenarioVariable,
  value: string,
  mode: "single" | "multi"
): ScenarioOverrides {
  const next = mode === "single" ? {} : { ...current };
  if (value === baselineBands(input)[key]) delete next[key];
  else Object.assign(next, { [key]: value });
  return next;
}
export function scenarioImpact(
  baseline: ProductApplicationV3,
  scenario: ProductApplicationV3
) {
  const fields = (p: ProductApplicationV3) => ({
    posture: p.currentStructuralPosture.label,
    safety: p.presentation.safetyMarginKeyword,
    changing: `${p.changingPlays.length} · ${p.changingPlays.map(play => play.title).join(" · ") || "—"}`,
    missing: p.missingPoint,
    switches: p.decisionSwitches
      .map(s => `${s.signal}: ${s.direction}`)
      .join(" · "),
    tradeoff: p.presentation.coreTradeoffKeyword,
    test: p.nextStepExperiment.whatToTest,
  });
  const a = fields(baseline),
    b = fields(scenario);
  return (Object.keys(a) as Array<keyof typeof a>).map(key => ({
    key,
    before: a[key],
    after: b[key],
    changed: a[key] !== b[key],
  }));
}
