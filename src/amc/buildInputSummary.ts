import type { AmcNormalizedIntake } from "./normalizeIntake";
import type { AmcDerivedFlags } from "./deriveFlags";

export interface AmcInputSummary {
  clientDisplay: {
    fullName: string;
    email: string;
    location: string;
    currentRoleCompany: string;
    yearsExperience: string;
    tier: string;
  };

  decisionSnapshot: {
    mainDecision: string;
    urgency: string;
    optionsUnderConsideration: string;
    forcedChoiceToday: string;
  };

  prioritiesAndConstraints: {
    topPriorities: string[];
    nonNegotiable: string;
    biggestRisks: string;
  };

  marketAndRoleView: {
    marketDemandOutlook: string;
    marketDemandReason: string;
    profileDifferentiation: string;
  };

  organizationalContext: {
    companyHealthConfidence: string;
    companyStability: string;
    restructuringHistory: string;
    sponsorSupport: string;
    decisionLineClarity: string;
    workflowPace: string;
    externalShockExposure: string;
  };

  personalDecisionStyle: {
    riskOptimizationStyle: string;
    visibleRiskComfort: string;
    commitmentStyle: string;
    energizingWorkStyle: string;
  };

  fallbackContext: {
    stayScenario12to18m: string;
    planBStrength: string;
  };

  reportIntent: {
    reportValueExpectation: string[];
    mustAnswerQuestion: string;
  };

  highlightedSignals: {
    urgencyLabel: string;
    safetyNetLabel: string;
    sponsorSupportLabel: string;
    decisionClarityLabel: string;
    companyStabilityLabel: string;
    externalExposureLabel: string;
    marketOutlookLabel: string;
    differentiationLabel: string;
    riskStyleLabel: string;
    commitmentStyleLabel: string;
  };
}

function buildUrgencyLabel(flags: AmcDerivedFlags): string {
  if (flags.highUrgency) return "High urgency";
  if (flags.mediumUrgency) return "Medium urgency";
  if (flags.lowUrgency) return "Low urgency";
  return "Urgency unclear";
}

function buildSafetyNetLabel(flags: AmcDerivedFlags): string {
  if (flags.strongSafetyNet) return "Strong safety net";
  if (flags.moderateSafetyNet) return "Moderate safety net";
  if (flags.weakSafetyNet) return "Weak safety net";
  return "Safety net unclear";
}

function buildSponsorSupportLabel(flags: AmcDerivedFlags): string {
  if (flags.strongSponsorSupport) return "Strong sponsor support";
  if (flags.uncertainSponsorSupport) return "Uncertain sponsor support";
  if (flags.lowSponsorSupport) return "Low sponsor support";
  return "Sponsor support unclear";
}

function buildDecisionClarityLabel(flags: AmcDerivedFlags): string {
  if (flags.highDecisionClarity) return "High decision-line clarity";
  if (flags.mediumDecisionClarity) return "Medium decision-line clarity";
  if (flags.lowDecisionClarity) return "Low decision-line clarity";
  return "Decision-line clarity unclear";
}

function buildCompanyStabilityLabel(flags: AmcDerivedFlags): string {
  if (flags.highCompanyStability) return "High company stability";
  if (flags.mediumCompanyStability) return "Mixed company stability";
  if (flags.lowCompanyStability) return "Low company stability";
  return "Company stability unclear";
}

function buildExternalExposureLabel(flags: AmcDerivedFlags): string {
  if (flags.highExternalExposure) return "High external exposure";
  if (flags.manageableExternalExposure) return "Manageable external exposure";
  if (flags.wellProtectedExternally) return "Well protected externally";
  return "External exposure unclear";
}

function buildMarketOutlookLabel(flags: AmcDerivedFlags): string {
  if (flags.growingMarketOutlook) return "Growing market outlook";
  if (flags.unclearMarketOutlook) return "Unclear market outlook";
  if (flags.decliningMarketOutlook) return "Declining market outlook";
  return "Market outlook unclear";
}

function buildDifferentiationLabel(flags: AmcDerivedFlags): string {
  if (flags.highDifferentiation) return "High differentiation";
  if (flags.mediumDifferentiation) return "Medium differentiation";
  if (flags.lowDifferentiation) return "Low differentiation";
  return "Differentiation unclear";
}

function buildRiskStyleLabel(flags: AmcDerivedFlags): string {
  if (flags.upsideMaximizingStyle) return "Upside-maximizing risk style";
  if (flags.balancedRiskStyle) return "Balanced risk style";
  if (flags.downsideProtectiveStyle) return "Downside-protective risk style";
  return "Risk style unclear";
}

function buildCommitmentStyleLabel(flags: AmcDerivedFlags): string {
  if (flags.allInCommitmentStyle) return "All-in commitment style";
  if (flags.gradualCommitmentStyle) return "Gradual commitment style";
  if (flags.reversibleCommitmentStyle) return "Reversible commitment style";
  return "Commitment style unclear";
}

type LabelMap = Record<string, string>;

const NOT_SPECIFIED = "Not specified";

function toReadable(value: string, map: LabelMap): string {
  if (!value) {
    return NOT_SPECIFIED;
  }
  return map[value] ?? NOT_SPECIFIED;
}

const YEARS_EXPERIENCE_LABELS: LabelMap = {
  "0_2": "0–2 years",
  "3_5": "3–5 years",
  "6_10": "6–10 years",
  "11_15": "11–15 years",
  "16_plus": "16+ years",
};

const TIER_LABELS: LabelMap = {
  essential: "Essential",
  executive: "Executive",
};

const URGENCY_LABELS: LabelMap = {
  within_1m: "Within 1 month",
  within_3m: "Within 3 months",
  within_6m: "Within 6 months",
  after_6m: "More than 6 months away",
  not_sure: "Not sure",
};

const MARKET_OUTLOOK_LABELS: LabelMap = {
  declining: "Clearly declining",
  unclear: "Unclear / mixed",
  growing: "Clearly growing",
};

const DIFFERENTIATION_LABELS: LabelMap = {
  low: "Low differentiation",
  medium: "Medium differentiation",
  high: "High differentiation",
};

const COMPANY_HEALTH_LABELS: LabelMap = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

const COMPANY_STABILITY_LABELS: LabelMap = {
  unstable: "Unstable",
  mixed: "Mixed",
  stable: "Stable",
};

const RESTRUCTURING_LABELS: LabelMap = {
  multiple_changes: "Multiple significant changes",
  some_changes: "Some changes",
  no_major_changes: "No major changes",
  unknown: "Unknown",
};

const SPONSOR_SUPPORT_LABELS: LabelMap = {
  no_sponsor: "No clear sponsor",
  uncertain_support: "Uncertain sponsor support",
  strong_sponsor: "Strong sponsor support",
};

const DECISION_CLARITY_LABELS: LabelMap = {
  not_clear: "Not clear",
  somewhat_clear: "Somewhat clear",
  very_clear: "Very clear",
};

const WORKFLOW_PACE_LABELS: LabelMap = {
  slow_bureaucratic: "Slow / bureaucratic",
  mixed: "Mixed",
  fast_agile: "Fast-paced and agile",
  unknown: "Unknown",
};

const EXTERNAL_EXPOSURE_LABELS: LabelMap = {
  high_exposure: "Highly exposed",
  manageable_exposure: "Some exposure, but manageable",
  well_protected: "Relatively well protected",
  not_sure: "Not sure",
};

const RISK_STYLE_LABELS: LabelMap = {
  protect_downside: "Protecting the downside",
  balance_risk_reward: "Balancing risk and reward",
  maximize_upside: "Maximizing upside potential",
};

const RISK_COMFORT_LABELS: LabelMap = {
  low: "Low comfort with visible risk",
  medium: "Some comfort with visible risk",
  high: "High comfort with visible risk",
};

const COMMITMENT_STYLE_LABELS: LabelMap = {
  small_reversible_steps: "Small, reversible steps",
  gradual_commitment: "Gradual commitment",
  go_all_in: "All-in commitment",
};

const PLAN_B_STRENGTH_LABELS: LabelMap = {
  weak: "Weak safety net",
  moderate: "Moderate safety net",
  strong: "Strong safety net",
};

export function buildInputSummary(
  intake: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
): AmcInputSummary {
  return {
    clientDisplay: {
      fullName: intake.fullName,
      email: intake.email,
      location: intake.location,
      currentRoleCompany: intake.currentRoleCompany,
      yearsExperience: toReadable(intake.yearsExperience, YEARS_EXPERIENCE_LABELS),
      tier: toReadable(intake.tier, TIER_LABELS),
    },

    decisionSnapshot: {
      mainDecision: intake.mainDecision,
      urgency: toReadable(intake.urgency, URGENCY_LABELS),
      optionsUnderConsideration: intake.optionsUnderConsideration,
      forcedChoiceToday: intake.forcedChoiceToday,
    },

    prioritiesAndConstraints: {
      topPriorities: intake.topPriorities,
      nonNegotiable: intake.nonNegotiable,
      biggestRisks: intake.biggestRisks,
    },

    marketAndRoleView: {
      marketDemandOutlook: toReadable(intake.marketDemandOutlook, MARKET_OUTLOOK_LABELS),
      marketDemandReason: intake.marketDemandReason,
      profileDifferentiation: toReadable(intake.profileDifferentiation, DIFFERENTIATION_LABELS),
    },

    organizationalContext: {
      companyHealthConfidence: toReadable(intake.companyHealthConfidence, COMPANY_HEALTH_LABELS),
      companyStability: toReadable(intake.companyStability, COMPANY_STABILITY_LABELS),
      restructuringHistory: toReadable(intake.restructuringHistory, RESTRUCTURING_LABELS),
      sponsorSupport: toReadable(intake.sponsorSupport, SPONSOR_SUPPORT_LABELS),
      decisionLineClarity: toReadable(intake.decisionLineClarity, DECISION_CLARITY_LABELS),
      workflowPace: toReadable(intake.workflowPace, WORKFLOW_PACE_LABELS),
      externalShockExposure: toReadable(intake.externalShockExposure, EXTERNAL_EXPOSURE_LABELS),
    },

    personalDecisionStyle: {
      riskOptimizationStyle: toReadable(intake.riskOptimizationStyle, RISK_STYLE_LABELS),
      visibleRiskComfort: toReadable(intake.visibleRiskComfort, RISK_COMFORT_LABELS),
      commitmentStyle: toReadable(intake.commitmentStyle, COMMITMENT_STYLE_LABELS),
      energizingWorkStyle: intake.energizingWorkStyle,
    },

    fallbackContext: {
      stayScenario12to18m: intake.stayScenario12to18m,
      planBStrength: toReadable(intake.planBStrength, PLAN_B_STRENGTH_LABELS),
    },

    reportIntent: {
      reportValueExpectation: intake.reportValueExpectation,
      mustAnswerQuestion: intake.mustAnswerQuestion,
    },

    highlightedSignals: {
      urgencyLabel: buildUrgencyLabel(flags),
      safetyNetLabel: buildSafetyNetLabel(flags),
      sponsorSupportLabel: buildSponsorSupportLabel(flags),
      decisionClarityLabel: buildDecisionClarityLabel(flags),
      companyStabilityLabel: buildCompanyStabilityLabel(flags),
      externalExposureLabel: buildExternalExposureLabel(flags),
      marketOutlookLabel: buildMarketOutlookLabel(flags),
      differentiationLabel: buildDifferentiationLabel(flags),
      riskStyleLabel: buildRiskStyleLabel(flags),
      commitmentStyleLabel: buildCommitmentStyleLabel(flags),
    },
  };
}

/*
Example:
const summary = buildInputSummary(intake, flags);
// summary.clientDisplay.fullName
// summary.decisionSnapshot.mainDecision
// summary.highlightedSignals.urgencyLabel
*/
