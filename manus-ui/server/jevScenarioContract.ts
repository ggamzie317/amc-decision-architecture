/** Canonical AMU Choice packet and strict response boundary. Server-only. */
import type {
  JevInput,
  JevAdvisory,
  AdvisoryLevel,
} from "../client/src/data/amcJevAdvisory.js";
export const metrics = [
  "scenarioPlausibility",
  "evidenceSupport",
  "scenarioSensitivity",
  "changingFeasibility",
  "safetyMarginContribution",
] as const;
export function buildOfflineScenarioPacket(input: JevInput) {
  const criteria = {
    scenarioPlausibility: {
      low: "Assumptions conflict with supplied constraints",
      medium: "Assumptions are coherent but dependencies remain",
      high: "Assumptions are coherent with supplied capacities; not an outcome forecast",
    },
    evidenceSupport: {
      low: "Baseline validation is weak or unestablished",
      medium: "Baseline validation is developing",
      high: "Strong baseline evidence supports conditions; hypothetical evidence is never actual validation",
    },
    scenarioSensitivity: {
      low: "Protection, posture and Changing families are stable",
      medium: "Some protection or Changing families differ",
      high: "Posture changes or depends on unverified assumptions",
    },
    changingFeasibility: {
      low: "Readiness or constraints impede testing",
      medium: "Some execution capacity exists with gaps",
      high: "Support and readiness allow bounded testing under the stated constraints",
    },
    safetyMarginContribution: {
      low: "Protection stays limited or exposure increases",
      medium: "Some protective dimensions improve",
      high: "Financial, recovery and downside protection improve together",
    },
  };
  return {
    model: "typesafe-ai/jev",
    state: structuredClone(input),
    questions: Object.fromEntries(
      metrics.map(key => [
        key,
        {
          type: "choice",
          instructions:
            "Assess qualitative assumptions only. No new facts, winner, recommendation, personal outcome prediction, or change to the structural analysis.",
          criteria: criteria[key],
        },
      ])
    ),
  };
}
/** Canonical model/routing/distribution checks. Numeric provider values never leave this boundary. */
export function parseOfflineGatewayAdvisory(raw: unknown): JevAdvisory | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, any>,
    routing = data.provider_metadata?.gateway?.routing;
  if (
    Array.isArray(raw) ||
    Object.keys(data).some(
      k => !["model", "answers", "provider_metadata", "usage"].includes(k)
    ) ||
    !data.provider_metadata ||
    Object.keys(data.provider_metadata).some(k => k !== "gateway") ||
    !data.provider_metadata.gateway ||
    Object.keys(data.provider_metadata.gateway).some(k => k !== "routing") ||
    !routing ||
    Object.keys(routing).some(
      k =>
        ![
          "originalModelId",
          "canonicalSlug",
          "resolvedProvider",
          "finalProvider",
        ].includes(k)
    ) ||
    data.model !== "typesafe-ai/jev" ||
    routing?.originalModelId !== "typesafe-ai/jev" ||
    routing?.canonicalSlug !== "typesafe-ai/jev" ||
    routing?.resolvedProvider !== "typesafe-ai" ||
    routing?.finalProvider !== "typesafe-ai" ||
    !data.answers ||
    Object.keys(data.answers).sort().join("|") !== [...metrics].sort().join("|")
  )
    return null;
  const selected = {} as Pick<JevAdvisory, (typeof metrics)[number]>;
  for (const key of metrics) {
    const a = data.answers[key],
      p = a?.probabilities;
    if (
      !a ||
      Object.keys(a).some(
        k => !["type", "choice", "confidence", "probabilities"].includes(k)
      ) ||
      a.type !== "choice" ||
      !["low", "medium", "high"].includes(a.choice) ||
      !Number.isFinite(a.confidence) ||
      a.confidence < 0 ||
      a.confidence > 1 ||
      !p ||
      Object.keys(p).sort().join("|") !== "high|low|medium"
    )
      return null;
    const values = Object.values(p) as number[];
    if (
      values.some(
        v => typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1
      ) ||
      Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 0.02 ||
      p[a.choice] < Math.max(...values)
    )
      return null;
    selected[key] = a.choice as AdvisoryLevel;
  }
  return {
    ...selected,
    assumptions: ["The tested conditions would need to become available."],
    uncertainties: [
      "Whether assumed capacities can be secured remains unclear.",
    ],
    conditionalReading:
      "The supplied assumptions support a conditional reading only. If those conditions do not hold, this assessment may change.",
  };
}
