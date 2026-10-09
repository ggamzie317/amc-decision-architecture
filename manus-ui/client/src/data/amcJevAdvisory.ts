import { baselineBands, type ScenarioOverrides } from "./amcScenario";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "./amcProductApplicationV3";
export type AdvisoryLevel = "low" | "medium" | "high";
export type JevAdvisory = {
  scenarioPlausibility: AdvisoryLevel;
  evidenceSupport: AdvisoryLevel;
  scenarioSensitivity: AdvisoryLevel;
  changingFeasibility: AdvisoryLevel;
  safetyMarginContribution: AdvisoryLevel;
  assumptions: string[];
  uncertainties: string[];
  conditionalReading: string;
};
export type JevInput = {
  caseType: string;
  baselineBands: ReturnType<typeof baselineBands>;
  scenarioBands: ReturnType<typeof baselineBands>;
  changedVariables: string[];
  baselinePosture: string;
  scenarioPosture: string;
  safetyMargin: string[];
  changingFamilies: string[][];
};
export type JevProvider = { assess(input: JevInput): Promise<unknown> };
export type JevResult =
  | { status: "available"; advisory: JevAdvisory }
  | { status: "unavailable" };
const levels = ["low", "medium", "high"];
export function parseJevAdvisory(value: unknown): JevAdvisory | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  for (const key of [
    "scenarioPlausibility",
    "evidenceSupport",
    "scenarioSensitivity",
    "changingFeasibility",
    "safetyMarginContribution",
  ])
    if (!levels.includes(v[key] as string)) return null;
  // Only qualitative, non-prescriptive customer text may cross the advisory boundary.
  const safe = (s: unknown): s is string =>
    typeof s === "string" &&
    s.length > 0 &&
    s.length <= 600 &&
    !/[0-9%]|percent|probability|recommend|winner|success|FIFWM|AMC|AMU|canonical scorer|structured signal|signal provenance|current-user-structured|current-case-derived|확률|추천|성공/i.test(
      s
    );
  for (const key of ["assumptions", "uncertainties"])
    if (
      !Array.isArray(v[key]) ||
      (v[key] as unknown[]).length > 3 ||
      !(v[key] as unknown[]).every(safe)
    )
      return null;
  if (!safe(v.conditionalReading)) return null;
  return {
    scenarioPlausibility: v.scenarioPlausibility,
    evidenceSupport: v.evidenceSupport,
    scenarioSensitivity: v.scenarioSensitivity,
    changingFeasibility: v.changingFeasibility,
    safetyMarginContribution: v.safetyMarginContribution,
    assumptions: v.assumptions,
    uncertainties: v.uncertainties,
    conditionalReading: v.conditionalReading,
  } as JevAdvisory;
}
export function makeJevInput(
  input: ProductApplicationBuildInput,
  scenarioInput: ProductApplicationBuildInput,
  baseline: ProductApplicationV3,
  scenario: ProductApplicationV3,
  overrides: ScenarioOverrides
): JevInput {
  return {
    caseType: input.caseType,
    baselineBands: baselineBands(input),
    scenarioBands: baselineBands(scenarioInput),
    changedVariables: Object.keys(overrides).sort(),
    baselinePosture: baseline.currentStructuralPosture.label,
    scenarioPosture: scenario.currentStructuralPosture.label,
    safetyMargin: [baseline.safetyMargin.band, scenario.safetyMargin.band],
    changingFamilies: [
      baseline.changingPlays.map(p => p.family),
      scenario.changingPlays.map(p => p.family),
    ],
  };
}
/** Canonical AMU provider found (see docs/task_059_interactive_v1.md).
 * Live transmission was blocked by automatic approval review. Runtime deliberately
 * supplies no provider. This interface supports offline validation without networking. */
export function createJevSession(provider?: JevProvider, timeoutMs = 8000) {
  const cache = new Map<string, Promise<JevResult>>();
  return {
    assess(input: JevInput): Promise<JevResult> {
      const key = JSON.stringify(input);
      if (cache.has(key)) return cache.get(key)!;
      const request = (async (): Promise<JevResult> => {
        if (!provider) return { status: "unavailable" };
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const raw = await Promise.race([
            provider.assess(structuredClone(input)),
            new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
            }),
          ]);
          const advisory = parseJevAdvisory(raw);
          return advisory
            ? { status: "available", advisory }
            : { status: "unavailable" };
        } catch {
          return { status: "unavailable" };
        } finally {
          if (timer) clearTimeout(timer);
        }
      })();
      cache.set(key, request);
      return request;
    },
  };
}
