import type { AmcNormalizedIntake } from "./normalizeIntake";

export interface AmcDerivedFlags {
  highUrgency: boolean;
  mediumUrgency: boolean;
  lowUrgency: boolean;
  urgencyUnclear: boolean;

  weakSafetyNet: boolean;
  moderateSafetyNet: boolean;
  strongSafetyNet: boolean;

  lowSponsorSupport: boolean;
  uncertainSponsorSupport: boolean;
  strongSponsorSupport: boolean;

  lowDecisionClarity: boolean;
  mediumDecisionClarity: boolean;
  highDecisionClarity: boolean;

  lowCompanyHealthConfidence: boolean;
  mediumCompanyHealthConfidence: boolean;
  highCompanyHealthConfidence: boolean;

  lowCompanyStability: boolean;
  mediumCompanyStability: boolean;
  highCompanyStability: boolean;

  majorRestructuringRisk: boolean;
  someRestructuringRisk: boolean;
  noRestructuringSignal: boolean;
  restructuringUnknown: boolean;

  highExternalExposure: boolean;
  manageableExternalExposure: boolean;
  wellProtectedExternally: boolean;
  externalExposureUnclear: boolean;

  lowRiskComfort: boolean;
  mediumRiskComfort: boolean;
  highRiskComfort: boolean;

  downsideProtectiveStyle: boolean;
  balancedRiskStyle: boolean;
  upsideMaximizingStyle: boolean;

  reversibleCommitmentStyle: boolean;
  gradualCommitmentStyle: boolean;
  allInCommitmentStyle: boolean;

  decliningMarketOutlook: boolean;
  unclearMarketOutlook: boolean;
  growingMarketOutlook: boolean;

  lowDifferentiation: boolean;
  mediumDifferentiation: boolean;
  highDifferentiation: boolean;

  structurallyFragileMove: boolean;
  structurallySupportedMove: boolean;
  highExecutionRisk: boolean;
  highInterpretiveNeed: boolean;
}

function isOneOf(value: string, candidates: readonly string[]): boolean {
  return candidates.includes(value);
}

export function deriveFlags(intake: AmcNormalizedIntake): AmcDerivedFlags {
  const highUrgency = intake.urgency === "within_1m";
  const mediumUrgency = intake.urgency === "within_3m";
  const lowUrgency = isOneOf(intake.urgency, ["within_6m", "after_6m"]);
  const urgencyUnclear = intake.urgency === "not_sure" || intake.urgency === "";

  const weakSafetyNet = intake.planBStrength === "weak";
  const moderateSafetyNet = intake.planBStrength === "moderate";
  const strongSafetyNet = intake.planBStrength === "strong";

  const lowSponsorSupport = intake.sponsorSupport === "no_sponsor";
  const uncertainSponsorSupport = intake.sponsorSupport === "uncertain_support";
  const strongSponsorSupport = intake.sponsorSupport === "strong_sponsor";

  const lowDecisionClarity = intake.decisionLineClarity === "not_clear";
  const mediumDecisionClarity = intake.decisionLineClarity === "somewhat_clear";
  const highDecisionClarity = intake.decisionLineClarity === "very_clear";

  const lowCompanyHealthConfidence = intake.companyHealthConfidence === "low";
  const mediumCompanyHealthConfidence = intake.companyHealthConfidence === "medium";
  const highCompanyHealthConfidence = intake.companyHealthConfidence === "high";

  const lowCompanyStability = intake.companyStability === "unstable";
  const mediumCompanyStability = intake.companyStability === "mixed";
  const highCompanyStability = intake.companyStability === "stable";

  const majorRestructuringRisk = intake.restructuringHistory === "multiple_changes";
  const someRestructuringRisk = intake.restructuringHistory === "some_changes";
  const noRestructuringSignal = intake.restructuringHistory === "no_major_changes";
  const restructuringUnknown = intake.restructuringHistory === "unknown" || intake.restructuringHistory === "";

  const highExternalExposure = intake.externalShockExposure === "high_exposure";
  const manageableExternalExposure = intake.externalShockExposure === "manageable_exposure";
  const wellProtectedExternally = intake.externalShockExposure === "well_protected";
  const externalExposureUnclear = intake.externalShockExposure === "not_sure" || intake.externalShockExposure === "";

  const lowRiskComfort = intake.visibleRiskComfort === "low";
  const mediumRiskComfort = intake.visibleRiskComfort === "medium";
  const highRiskComfort = intake.visibleRiskComfort === "high";

  const downsideProtectiveStyle = intake.riskOptimizationStyle === "protect_downside";
  const balancedRiskStyle = intake.riskOptimizationStyle === "balance_risk_reward";
  const upsideMaximizingStyle = intake.riskOptimizationStyle === "maximize_upside";

  const reversibleCommitmentStyle = intake.commitmentStyle === "small_reversible_steps";
  const gradualCommitmentStyle = intake.commitmentStyle === "gradual_commitment";
  const allInCommitmentStyle = intake.commitmentStyle === "go_all_in";

  const decliningMarketOutlook = intake.marketDemandOutlook === "declining";
  const unclearMarketOutlook = intake.marketDemandOutlook === "unclear" || intake.marketDemandOutlook === "";
  const growingMarketOutlook = intake.marketDemandOutlook === "growing";

  const lowDifferentiation = intake.profileDifferentiation === "low";
  const mediumDifferentiation = intake.profileDifferentiation === "medium";
  const highDifferentiation = intake.profileDifferentiation === "high";

  const fragileSignalsCount = [
    weakSafetyNet,
    lowSponsorSupport,
    lowCompanyStability,
    highExternalExposure,
    lowDecisionClarity,
  ].filter(Boolean).length;
  const structurallyFragileMove = fragileSignalsCount >= 2;

  const supportedSignalsCount = [
    strongSafetyNet,
    strongSponsorSupport,
    highCompanyStability,
    wellProtectedExternally,
    highDecisionClarity,
  ].filter(Boolean).length;
  const structurallySupportedMove = supportedSignalsCount >= 3;

  const highExecutionRisk = Boolean(
    (weakSafetyNet && highUrgency) ||
      (lowCompanyStability && majorRestructuringRisk) ||
      (highExternalExposure && lowDecisionClarity) ||
      (allInCommitmentStyle && lowRiskComfort),
  );

  const highInterpretiveNeed = Boolean(
    urgencyUnclear ||
      unclearMarketOutlook ||
      mediumDecisionClarity ||
      uncertainSponsorSupport ||
      someRestructuringRisk,
  );

  return {
    highUrgency,
    mediumUrgency,
    lowUrgency,
    urgencyUnclear,

    weakSafetyNet,
    moderateSafetyNet,
    strongSafetyNet,

    lowSponsorSupport,
    uncertainSponsorSupport,
    strongSponsorSupport,

    lowDecisionClarity,
    mediumDecisionClarity,
    highDecisionClarity,

    lowCompanyHealthConfidence,
    mediumCompanyHealthConfidence,
    highCompanyHealthConfidence,

    lowCompanyStability,
    mediumCompanyStability,
    highCompanyStability,

    majorRestructuringRisk,
    someRestructuringRisk,
    noRestructuringSignal,
    restructuringUnknown,

    highExternalExposure,
    manageableExternalExposure,
    wellProtectedExternally,
    externalExposureUnclear,

    lowRiskComfort,
    mediumRiskComfort,
    highRiskComfort,

    downsideProtectiveStyle,
    balancedRiskStyle,
    upsideMaximizingStyle,

    reversibleCommitmentStyle,
    gradualCommitmentStyle,
    allInCommitmentStyle,

    decliningMarketOutlook,
    unclearMarketOutlook,
    growingMarketOutlook,

    lowDifferentiation,
    mediumDifferentiation,
    highDifferentiation,

    structurallyFragileMove,
    structurallySupportedMove,
    highExecutionRisk,
    highInterpretiveNeed,
  };
}

/*
Example:
const sampleIntake: AmcNormalizedIntake = {
  fullName: "Alex Kim",
  email: "alex@example.com",
  location: "Seoul",
  currentRoleCompany: "Product Manager at ABC Corp",
  yearsExperience: "6_10",
  mainDecision: "Move to a new external role",
  urgency: "within_1m",
  optionsUnderConsideration: "Option A, Option B",
  forcedChoiceToday: "No",
  topPriorities: ["stability", "growth"],
  nonNegotiable: "base compensation",
  biggestRisks: "transition risk",
  marketDemandOutlook: "unclear",
  marketDemandReason: "mixed hiring signals",
  profileDifferentiation: "medium",
  companyHealthConfidence: "medium",
  companyStability: "unstable",
  restructuringHistory: "multiple_changes",
  sponsorSupport: "no_sponsor",
  decisionLineClarity: "not_clear",
  workflowPace: "mixed",
  externalShockExposure: "high_exposure",
  riskOptimizationStyle: "balance_risk_reward",
  visibleRiskComfort: "low",
  commitmentStyle: "go_all_in",
  energizingWorkStyle: "problem solving",
  stayScenario12to18m: "role stagnation likely",
  planBStrength: "weak",
  reportValueExpectation: ["clarity"],
  mustAnswerQuestion: "Is this move defensible now?",
  consent: true,
  tier: "essential",
  submittedAt: "2026-03-15T10:00:00Z",
  reportDate: "2026-03-15",
  betaMode: true,
  lang: "en",
  chatbotAccessToken: "",
  chatbotAccessExpiresAt: "",
};

const flags = deriveFlags(sampleIntake);
// Expected examples:
// flags.highUrgency === true
// flags.weakSafetyNet === true
// flags.structurallyFragileMove === true
// flags.highExecutionRisk === true
// flags.highInterpretiveNeed === true
*/
