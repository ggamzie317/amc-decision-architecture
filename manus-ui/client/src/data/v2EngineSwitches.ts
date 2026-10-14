import type { ProductApplicationBuildInput, ProductApplicationV3 } from "./amcProductApplicationV3";
import { baselineBands, evaluateScenario, type ScenarioOverrides } from "./amcScenario";
import { v2t, type V2CopyKey, type V2Language } from "./v2Language";

/**
 * Decision switches the engine itself finds (issue A3): for each structural
 * condition, move one step better and one step worse and keep the moves that
 * change the current structural posture under the existing formula. Nothing
 * is scored here; it is the same evaluation the simulator uses.
 */
const ladders: Record<string, readonly string[]> = {
  externalValidation: ["weak", "developing", "strong"],
  internalReadiness: ["weak", "developing", "strong"],
  financialRoom: ["weak", "developing", "strong"],
  reversibility: ["weak", "developing", "strong"],
  optionBSupport: ["weak", "developing", "strong"],
  downsideExposure: ["high", "moderate", "low"],
  constraintLoad: ["heavy", "material", "light"],
};
const labelKey: Record<string, V2CopyKey> = {
  externalValidation: "externalValidation",
  internalReadiness: "readinessBand",
  financialRoom: "financial",
  reversibility: "reversibility",
  optionBSupport: "supportBand",
  downsideExposure: "downside",
  constraintLoad: "constraint",
};

export type V2EngineSwitch = { variable: string; signal: string; direction: string; improves: boolean; labels: string[] };

export function v2EngineSwitches(
  input: ProductApplicationBuildInput,
  core: ProductApplicationV3,
  language: V2Language,
  max = 3
): V2EngineSwitch[] {
  const ko = language === "ko";
  const bands = baselineBands(input) as Record<string, string>;
  const found: V2EngineSwitch[] = [];
  for (const variable of Object.keys(ladders)) {
    const ladder = ladders[variable];
    const current = bands[variable];
    if (current === undefined) continue;
    const index = ladder.indexOf(current);
    // An unknown condition is tested at both ends: "if it turns out strong / weak".
    const moves = index < 0
      ? [{ band: ladder[2], improves: true }, { band: ladder[0], improves: false }]
      : [
          ...(index < 2 ? [{ band: ladder[index + 1], improves: true }] : []),
          ...(index > 0 ? [{ band: ladder[index - 1], improves: false }] : []),
        ];
    for (const move of moves) {
      const scenario = evaluateScenario(input, { [variable]: move.band } as ScenarioOverrides);
      if (scenario.currentStructuralPosture.label === core.currentStructuralPosture.label) continue;
      const label = v2t(language, labelKey[variable]);
      found.push({
        variable,
        labels: [label],
        improves: move.improves,
        signal: ko
          ? `${label}: ${v2t(language, current as V2CopyKey)} → ${v2t(language, move.band as V2CopyKey)}`
          : `${label}: ${v2t(language, current as V2CopyKey)} → ${v2t(language, move.band as V2CopyKey)}`,
        direction: ko
          ? `구조 판단이 '${scenario.currentStructuralPosture.label}'(으)로 바뀝니다`
          : `The structural reading becomes '${scenario.currentStructuralPosture.label}'`,
      });
    }
  }
  if (!found.length) found.push(...pairSwitches(input, core, language, bands));
  // Improvements first: what would have to become true for a different reading.
  return found.sort((a, b) => Number(b.improves) - Number(a.improves)).slice(0, max);
}

/**
 * Mid-range profiles rarely flip on one step (boundaries are 8 and 1), so
 * also test two conditions moving together in the same direction.
 */
function pairSwitches(
  input: ProductApplicationBuildInput,
  core: ProductApplicationV3,
  language: V2Language,
  bands: Record<string, string>
): V2EngineSwitch[] {
  const ko = language === "ko";
  const step = (variable: string, improves: boolean) => {
    const ladder = ladders[variable];
    const index = ladder.indexOf(bands[variable]);
    if (index < 0) return improves ? ladder[2] : ladder[0];
    const next = index + (improves ? 1 : -1);
    return next >= 0 && next < ladder.length ? ladder[next] : null;
  };
  const variables = Object.keys(ladders).filter(v => bands[v] !== undefined);
  const out: V2EngineSwitch[] = [];
  for (const improves of [true, false]) {
    for (let i = 0; i < variables.length && out.filter(o => o.improves === improves).length < 2; i++)
      for (let j = i + 1; j < variables.length && out.filter(o => o.improves === improves).length < 2; j++) {
        const [a, b] = [variables[i], variables[j]];
        const [bandA, bandB] = [step(a, improves), step(b, improves)];
        if (!bandA || !bandB) continue;
        const scenario = evaluateScenario(input, { [a]: bandA, [b]: bandB } as ScenarioOverrides);
        if (scenario.currentStructuralPosture.label === core.currentStructuralPosture.label) continue;
        const part = (v: string, band: string) => `${v2t(language, labelKey[v])} ${v2t(language, bands[v] as V2CopyKey)} → ${v2t(language, band as V2CopyKey)}`;
        out.push({
          variable: `${a}+${b}`,
          labels: [v2t(language, labelKey[a]), v2t(language, labelKey[b])],
          improves,
          signal: `${part(a, bandA)} + ${part(b, bandB)}`,
          direction: ko
            ? `두 조건이 함께 바뀌면 구조 판단이 '${scenario.currentStructuralPosture.label}'(으)로 바뀝니다`
            : `If both change, the structural reading becomes '${scenario.currentStructuralPosture.label}'`,
        });
      }
  }
  return out;
}
