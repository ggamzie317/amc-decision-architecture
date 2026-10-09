import { scenarioVariables, type ScenarioVariable } from "./amcScenario";
import type { V2Sensitivity } from "./amcV2Model";

export function groupV2Sensitivity(rows: V2Sensitivity[]) {
  return scenarioVariables.map(variable => ({
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
export function prioritizeV2Thresholds(
  rows: V2Sensitivity[],
  baseline: Record<ScenarioVariable, string>
): V2Sensitivity[] {
  const changed = rows
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
  const seen = new Set<ScenarioVariable>();
  const distinct = changed.filter(row => {
    if (seen.has(row.variable)) return false;
    seen.add(row.variable);
    return true;
  });
  const result = distinct.slice(0, 5);
  for (const row of changed) {
    if (result.length >= 3 || result.length >= 5) break;
    if (!result.includes(row)) result.push(row);
  }
  return result;
}
