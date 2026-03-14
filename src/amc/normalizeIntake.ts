export interface AmcNormalizedIntake {
  fullName: string;
  email: string;
  location: string;
  currentRoleCompany: string;
  yearsExperience: string;

  mainDecision: string;
  urgency: string;
  optionsUnderConsideration: string;
  forcedChoiceToday: string;

  topPriorities: string[];
  nonNegotiable: string;
  biggestRisks: string;

  marketDemandOutlook: string;
  marketDemandReason: string;
  profileDifferentiation: string;

  companyHealthConfidence: string;
  companyStability: string;
  restructuringHistory: string;

  sponsorSupport: string;
  decisionLineClarity: string;
  workflowPace: string;
  externalShockExposure: string;

  riskOptimizationStyle: string;
  visibleRiskComfort: string;
  commitmentStyle: string;
  energizingWorkStyle: string;

  stayScenario12to18m: string;
  planBStrength: string;

  reportValueExpectation: string[];
  mustAnswerQuestion: string;
  consent: boolean;

  tier: string;
  submittedAt: string;
  reportDate: string;
  betaMode: boolean;
  lang: string;
  chatbotAccessToken: string;
  chatbotAccessExpiresAt: string;
}

type EnumMap = Record<string, string>;

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

  return text;
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeArray(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  const rawItems = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of rawItems) {
    const normalized = normalizeText(item);
    if (!normalized) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function mapEnum(value: unknown, mapping: EnumMap, fallback = ""): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    return fallback;
  }
  // Unmapped values intentionally fall back to an empty string (or provided fallback).
  return mapping[normalized] ?? fallback;
}

function normalizeConsent(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  const text = normalizeText(value).toLowerCase();
  if (!text) {
    return false;
  }
  const affirmative = new Set([
    "true",
    "yes",
    "i understand and agree",
    "yes, i understand and agree",
  ]);
  return affirmative.has(text);
}

function normalizeTier(value: unknown): string {
  const text = normalizeText(value).toLowerCase();
  if (text === "executive") {
    return "executive";
  }
  if (text === "essential") {
    return "essential";
  }
  return "essential";
}

function normalizeBooleanWithDefaultTrue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined || normalizeText(value) === "") {
    return true;
  }

  const text = normalizeText(value).toLowerCase();
  const falseTokens = ["false", "0", "no", "n", "off"];
  return !falseTokens.some((token) => text === token);
}

const YEARS_EXPERIENCE_MAP: EnumMap = {
  "0–2 years": "0_2",
  "3–5 years": "3_5",
  "6–10 years": "6_10",
  "11–15 years": "11_15",
  "16+ years": "16_plus",
};

const URGENCY_MAP: EnumMap = {
  "Within 1 month": "within_1m",
  "Within 3 months": "within_3m",
  "Within 6 months": "within_6m",
  "More than 6 months away": "after_6m",
  "Not sure": "not_sure",
};

const MARKET_DEMAND_OUTLOOK_MAP: EnumMap = {
  "Clearly declining": "declining",
  "Unclear / mixed": "unclear",
  "Clearly growing": "growing",
};

const PROFILE_DIFFERENTIATION_MAP: EnumMap = {
  "Many people with similar profiles": "low",
  "Some differentiation, but still competitive": "medium",
  "Strongly differentiated / niche profile": "high",
};

const COMPANY_HEALTH_CONFIDENCE_MAP: EnumMap = {
  "Low confidence": "low",
  "Medium confidence": "medium",
  "High confidence": "high",
};

const COMPANY_STABILITY_MAP: EnumMap = {
  "Unstable and unpredictable": "unstable",
  "Somewhat stable, but with noticeable changes or uncertainty": "mixed",
  "Stable and predictable": "stable",
};

const RESTRUCTURING_HISTORY_MAP: EnumMap = {
  "Yes – multiple significant changes": "multiple_changes",
  "Yes – a few changes, but mostly stable": "some_changes",
  "No major changes": "no_major_changes",
  "I don’t know": "unknown",
};

const SPONSOR_SUPPORT_MAP: EnumMap = {
  "Yes – at least one strong sponsor": "strong_sponsor",
  "Maybe – some goodwill, but not sure about real backing": "uncertain_support",
  "No – I don’t have a clear sponsor yet": "no_sponsor",
};

const DECISION_LINE_CLARITY_MAP: EnumMap = {
  "Not clear at all": "not_clear",
  "Somewhat clear": "somewhat_clear",
  "Very clear": "very_clear",
};

const WORKFLOW_PACE_MAP: EnumMap = {
  "Slow / bureaucratic": "slow_bureaucratic",
  "Mixed (some fast, some slow)": "mixed",
  "Fast-paced and agile": "fast_agile",
  "I don’t know yet": "unknown",
};

const EXTERNAL_SHOCK_EXPOSURE_MAP: EnumMap = {
  "Highly exposed, with limited protection": "high_exposure",
  "Some exposure, but manageable": "manageable_exposure",
  "Relatively well protected": "well_protected",
  "Not sure": "not_sure",
};

const RISK_OPTIMIZATION_STYLE_MAP: EnumMap = {
  "Protecting the downside": "protect_downside",
  "Balancing risk and reward": "balance_risk_reward",
  "Maximizing upside potential": "maximize_upside",
};

const VISIBLE_RISK_COMFORT_MAP: EnumMap = {
  "Not comfortable at all": "low",
  "Somewhat comfortable": "medium",
  "Very comfortable": "high",
};

const COMMITMENT_STYLE_MAP: EnumMap = {
  "I prefer small, reversible steps and testing before fully committing.": "small_reversible_steps",
  "I commit gradually but can change direction if needed.": "gradual_commitment",
  "Once I decide, I go all-in and push aggressively.": "go_all_in",
};

const PLAN_B_STRENGTH_MAP: EnumMap = {
  "I have almost no safety net if this fails.": "weak",
  "I have some alternatives or savings.": "moderate",
  "I have a clear Plan B and strong financial/career safety nets.": "strong",
};

export function normalizeIntake(raw: Record<string, any>): AmcNormalizedIntake {
  return {
    fullName: normalizeText(raw.fullName),
    email: normalizeEmail(raw.email),
    location: normalizeText(raw.location),
    currentRoleCompany: normalizeText(raw.currentRoleCompany),
    yearsExperience: mapEnum(raw.yearsExperience, YEARS_EXPERIENCE_MAP),

    mainDecision: normalizeText(raw.mainDecision),
    urgency: mapEnum(raw.urgency, URGENCY_MAP),
    optionsUnderConsideration: normalizeText(raw.optionsUnderConsideration),
    forcedChoiceToday: normalizeText(raw.forcedChoiceToday),

    topPriorities: normalizeArray(raw.topPriorities),
    nonNegotiable: normalizeText(raw.nonNegotiable),
    biggestRisks: normalizeText(raw.biggestRisks),

    marketDemandOutlook: mapEnum(raw.marketDemandOutlook, MARKET_DEMAND_OUTLOOK_MAP),
    marketDemandReason: normalizeText(raw.marketDemandReason),
    profileDifferentiation: mapEnum(raw.profileDifferentiation, PROFILE_DIFFERENTIATION_MAP),

    companyHealthConfidence: mapEnum(raw.companyHealthConfidence, COMPANY_HEALTH_CONFIDENCE_MAP),
    companyStability: mapEnum(raw.companyStability, COMPANY_STABILITY_MAP),
    restructuringHistory: mapEnum(raw.restructuringHistory, RESTRUCTURING_HISTORY_MAP),

    sponsorSupport: mapEnum(raw.sponsorSupport, SPONSOR_SUPPORT_MAP),
    decisionLineClarity: mapEnum(raw.decisionLineClarity, DECISION_LINE_CLARITY_MAP),
    workflowPace: mapEnum(raw.workflowPace, WORKFLOW_PACE_MAP),
    externalShockExposure: mapEnum(raw.externalShockExposure, EXTERNAL_SHOCK_EXPOSURE_MAP),

    riskOptimizationStyle: mapEnum(raw.riskOptimizationStyle, RISK_OPTIMIZATION_STYLE_MAP),
    visibleRiskComfort: mapEnum(raw.visibleRiskComfort, VISIBLE_RISK_COMFORT_MAP),
    commitmentStyle: mapEnum(raw.commitmentStyle, COMMITMENT_STYLE_MAP),
    energizingWorkStyle: normalizeText(raw.energizingWorkStyle),

    stayScenario12to18m: normalizeText(raw.stayScenario12to18m),
    planBStrength: mapEnum(raw.planBStrength, PLAN_B_STRENGTH_MAP),

    reportValueExpectation: normalizeArray(raw.reportValueExpectation),
    mustAnswerQuestion: normalizeText(raw.mustAnswerQuestion),
    consent: normalizeConsent(raw.consent),

    tier: normalizeTier(raw.tier),
    submittedAt: normalizeText(raw.submittedAt),
    reportDate: normalizeText(raw.reportDate),
    betaMode: normalizeBooleanWithDefaultTrue(raw.betaMode),
    lang: normalizeText(raw.lang) || "en",
    chatbotAccessToken: normalizeText(raw.chatbotAccessToken),
    chatbotAccessExpiresAt: normalizeText(raw.chatbotAccessExpiresAt),
  };
}

/*
Example:
const raw = {
  fullName: "  Alex Kim  ",
  email: "  ALEX@EXAMPLE.COM ",
  topPriorities: ["Income stability", "Income stability", "Long-term growth"],
  yearsExperience: "6–10 years",
  urgency: "Within 3 months",
  tier: "executive",
};

const normalized = normalizeIntake(raw);
// {
//   fullName: "Alex Kim",
//   email: "alex@example.com",
//   topPriorities: ["Income stability", "Long-term growth"],
//   yearsExperience: "6_10",
//   urgency: "within_3m",
//   tier: "executive",
//   ...
// }
*/
