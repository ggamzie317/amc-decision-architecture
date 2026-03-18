import type { AmcNormalizedIntake } from "./normalizeIntake";

export type InputCompletenessBand = "high" | "medium" | "low";

export interface InputCompletenessMetadata {
  inputCompletenessScore: number;
  inputCompletenessBand: InputCompletenessBand;
  evidenceProfile: "sufficient" | "moderate" | "limited";
}

export function computeInputCompletenessMetadata(
  normalized: Partial<AmcNormalizedIntake> | Record<string, unknown>,
): InputCompletenessMetadata {
  const fields = [
    "fullName",
    "email",
    "location",
    "currentRoleCompany",
    "yearsExperience",
    "mainDecision",
    "urgency",
    "optionsUnderConsideration",
    "forcedChoiceToday",
    "topPriorities",
    "nonNegotiable",
    "biggestRisks",
    "marketDemandOutlook",
    "marketDemandReason",
    "profileDifferentiation",
    "companyHealthConfidence",
    "companyStability",
    "restructuringHistory",
    "sponsorSupport",
    "decisionLineClarity",
    "workflowPace",
    "externalShockExposure",
    "riskOptimizationStyle",
    "visibleRiskComfort",
    "commitmentStyle",
    "energizingWorkStyle",
    "stayScenario12to18m",
    "planBStrength",
    "reportValueExpectation",
    "mustAnswerQuestion",
  ] as const;

  let present = 0;
  for (const field of fields) {
    const value = (normalized as Record<string, unknown>)[field];
    if (Array.isArray(value)) {
      if (value.length > 0) {
        present += 1;
      }
      continue;
    }
    if (typeof value === "string") {
      if (value.trim()) {
        present += 1;
      }
      continue;
    }
    if (value !== null && value !== undefined) {
      present += 1;
    }
  }

  const score = present / fields.length;
  if (score >= 0.85) {
    return {
      inputCompletenessScore: score,
      inputCompletenessBand: "high",
      evidenceProfile: "sufficient",
    };
  }
  if (score >= 0.6) {
    return {
      inputCompletenessScore: score,
      inputCompletenessBand: "medium",
      evidenceProfile: "moderate",
    };
  }
  return {
    inputCompletenessScore: score,
    inputCompletenessBand: "low",
    evidenceProfile: "limited",
  };
}
