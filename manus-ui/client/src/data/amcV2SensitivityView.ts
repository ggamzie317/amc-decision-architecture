import {
  baselineBands,
  scenarioVariables,
  type ScenarioOverrides,
  type ScenarioVariable,
} from "./amcScenario";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "./amcProductApplicationV3";
import type { V2Sensitivity } from "./amcV2Model";
import {
  v2FamilyLabel,
  v2t,
  type V2CopyKey,
  type V2Language,
} from "./v2Language";

export function groupV2Sensitivity(
  rows: V2Sensitivity[],
  variables: readonly ScenarioVariable[] = scenarioVariables
) {
  return variables.map(variable => ({
    variable,
    alternatives: rows.filter(row => row.variable === variable),
  }));
}
const priority = (row: V2Sensitivity) =>
  row.posture ? 0 : row.safety ? 1 : row.changing ? 2 : row.nextTest ? 3 : 4;
const qualitativeOrder: Record<string, readonly string[]> = {
  strength: ["weak", "developing", "strong"],
  risk: ["low", "moderate", "high"],
  load: ["light", "material", "heavy"],
};
function distance(variable: ScenarioVariable, from: string, to: string) {
  const order =
    variable === "downsideExposure"
      ? qualitativeOrder.risk
      : variable === "constraintLoad"
        ? qualitativeOrder.load
        : qualitativeOrder.strength;
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0) return b === 1 ? 1 : 2;
  if (b < 0) return 3;
  return Math.abs(a - b);
}
function rankedChanges(
  rows: V2Sensitivity[],
  baseline: Record<ScenarioVariable, string>
) {
  return rows
    .filter(row => priority(row) < 4)
    .sort(
      (a, b) =>
        priority(a) - priority(b) ||
        distance(a.variable, baseline[a.variable], a.band) -
          distance(b.variable, baseline[b.variable], b.band) ||
        scenarioVariables.indexOf(a.variable) -
          scenarioVariables.indexOf(b.variable) ||
        a.band.localeCompare(b.band)
    );
}
export function prioritizeV2Thresholds(
  rows: V2Sensitivity[],
  baseline: Record<ScenarioVariable, string>
): V2Sensitivity[] {
  const seen = new Set<ScenarioVariable>();
  return rankedChanges(rows, baseline)
    .filter(row => {
      if (seen.has(row.variable)) return false;
      seen.add(row.variable);
      return true;
    })
    .slice(0, 5);
}

type LeverFamily = "capacity" | "reversibility" | "readiness" | "external";
const familyOf: Record<ScenarioVariable, LeverFamily> = {
  financialRoom: "capacity",
  downsideExposure: "capacity",
  constraintLoad: "capacity",
  reversibility: "reversibility",
  internalReadiness: "readiness",
  optionBSupport: "readiness",
  externalValidation: "external",
};
const majorImpacts = (row: V2Sensitivity) =>
  new Set((["posture", "safety", "changing"] as const).filter(key => row[key]));
/** One leading lever per structural family; a second needs a distinct major effect. */
export function selectV2SimulatorVariables(
  rows: V2Sensitivity[],
  baseline: Record<ScenarioVariable, string>
): ScenarioVariable[] {
  const ranked = rankedChanges(rows, baseline);
  const bestByVariable = new Map<ScenarioVariable, V2Sensitivity>();
  for (const row of ranked)
    if (!bestByVariable.has(row.variable))
      bestByVariable.set(row.variable, row);
  const bestRows = ranked.filter(
    row => bestByVariable.get(row.variable) === row
  );
  const bestByFamily = new Map<LeverFamily, V2Sensitivity>();
  for (const row of bestRows)
    if (!bestByFamily.has(familyOf[row.variable]))
      bestByFamily.set(familyOf[row.variable], row);
  const selected = Array.from(bestByFamily.values()).slice(0, 4);
  if (selected.length < 3) {
    for (const row of bestRows) {
      if (selected.length >= 3) break;
      const representative = bestByFamily.get(familyOf[row.variable]);
      if (!representative || representative === row) continue;
      const leadEffects = majorImpacts(representative);
      if (
        Array.from(majorImpacts(row)).some(effect => !leadEffects.has(effect))
      )
        selected.push(row);
    }
  }
  return selected.map(row => row.variable);
}
/** Drops stale or hidden overrides before evaluating a customer scenario. */
export function limitV2Overrides(
  input: ProductApplicationBuildInput,
  visible: readonly ScenarioVariable[],
  overrides: ScenarioOverrides
): ScenarioOverrides {
  const baseline = baselineBands(input);
  const next: ScenarioOverrides = {};
  for (const variable of visible) {
    const band = overrides[variable];
    if (band !== undefined && band !== baseline[variable])
      Object.assign(next, { [variable]: band });
  }
  return next;
}
export function v2ScenarioComparison(
  baseline: ProductApplicationV3,
  scenario: ProductApplicationV3,
  language: V2Language
): [V2CopyKey, string, string][] {
  const t = (key: V2CopyKey) => v2t(language, key);
  const changing = (result: ProductApplicationV3) =>
    `${result.changingPlays.length} · ${result.changingPlays.map(play => v2FamilyLabel(language, play.family)).join(" · ") || t("noneYet")}`;
  return [
    [
      "posture",
      baseline.currentStructuralPosture.label,
      scenario.currentStructuralPosture.label,
    ],
    ["safety", t(baseline.safetyMargin.band), t(scenario.safetyMargin.band)],
    ["missing", baseline.missingPoint, scenario.missingPoint],
    ["changing", changing(baseline), changing(scenario)],
    [
      "nextTest",
      baseline.nextStepExperiment.whatToTest,
      scenario.nextStepExperiment.whatToTest,
    ],
  ];
}
