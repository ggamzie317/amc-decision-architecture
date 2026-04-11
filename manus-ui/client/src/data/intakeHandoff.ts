import type { AmcLanguage } from "../contexts/LanguageContext";
import {
  buildInitialAnswers,
  INTAKE_META_KEY,
  INTAKE_STORAGE_KEY,
  type IntakeAnswers,
} from "../data/intakeQuestionnaire";

export type AmcTier = "essential" | "executive";

export type AmcSubmissionHandoff = {
  submissionId: string;
  createdAt: string;
  source: "manus_ui_intake_v1";
  language: AmcLanguage;
  tier: AmcTier;
  recipient: {
    email: string;
    fullName: string;
  };
  delivery: {
    channel: "email";
    language: AmcLanguage;
    tier: AmcTier;
  };
  intakeRaw: Record<string, unknown>;
  intakeMeta: {
    completedAt?: string;
  };
};

export const SUBMISSION_HANDOFF_KEY = "amc_submission_handoff_v1";

const yearsMap: Record<string, string> = {
  "0_5": "3–5 years",
  "6_10": "6–10 years",
  "11_15": "11–15 years",
  "16_20": "16+ years",
  "20_plus": "16+ years",
};

const urgencyMap: Record<string, string> = {
  within_1m: "Within 1 month",
  within_3m: "Within 3 months",
  within_6m: "Within 6 months",
  after_6m: "More than 6 months away",
  not_sure: "Not sure",
};

const marketMap: Record<string, string> = {
  declining: "Clearly declining",
  unclear: "Unclear / mixed",
  growing: "Clearly growing",
};

const diffMap: Record<string, string> = {
  low: "Many people with similar profiles",
  medium: "Some differentiation, but still competitive",
  high: "Strongly differentiated / niche profile",
};

const confidenceMap: Record<string, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

const stabilityMap: Record<string, string> = {
  unstable: "Unstable and unpredictable",
  mixed: "Somewhat stable, but with noticeable changes or uncertainty",
  stable: "Stable and predictable",
};

const restructureMap: Record<string, string> = {
  multiple_changes: "Yes – multiple significant changes",
  some_changes: "Yes – a few changes, but mostly stable",
  no_major_changes: "No major changes",
  unknown: "I don’t know",
};

const sponsorMap: Record<string, string> = {
  strong_sponsor: "Yes – at least one strong sponsor",
  uncertain_support: "Maybe – some goodwill, but not sure about real backing",
  no_sponsor: "No – I don’t have a clear sponsor yet",
};

const clarityMap: Record<string, string> = {
  not_clear: "Not clear at all",
  somewhat_clear: "Somewhat clear",
  very_clear: "Very clear",
};

const paceMap: Record<string, string> = {
  slow: "Slow / bureaucratic",
  mixed: "Mixed (some fast, some slow)",
  fast: "Fast-paced and agile",
};

const exposureMap: Record<string, string> = {
  high_exposure: "Highly exposed, with limited protection",
  manageable_exposure: "Some exposure, but manageable",
  well_protected: "Relatively well protected",
  not_sure: "Not sure",
};

const riskStyleMap: Record<string, string> = {
  protect_downside: "Protecting the downside",
  balance_risk_reward: "Balancing risk and reward",
  maximize_upside: "Maximizing upside potential",
};

const riskComfortMap: Record<string, string> = {
  low: "Not comfortable at all",
  medium: "Somewhat comfortable",
  high: "Very comfortable",
};

const commitmentMap: Record<string, string> = {
  small_reversible_steps: "I prefer small, reversible steps and testing before fully committing.",
  gradual_commitment: "I commit gradually but can change direction if needed.",
  go_all_in: "Once I decide, I go all-in and push aggressively.",
};

const planBMap: Record<string, string> = {
  weak: "I have almost no safety net if this fails.",
  moderate: "I have some alternatives or savings.",
  strong: "I have a clear Plan B and strong financial/career safety nets.",
};

const prioritiesMap: Record<string, string> = {
  income_stability: "Income stability",
  growth_upside: "Long-term growth",
  role_fit: "Role fit",
  family_stability: "Family stability",
  location_flexibility: "Location flexibility",
  health_load: "Health and load sustainability",
  brand_platform: "Platform and brand value",
  decision_reversibility: "Decision reversibility",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function parseExpectations(value: unknown): string[] {
  const text = asString(value);
  if (!text.trim()) {
    return [];
  }
  return text
    .split(/\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function mapValue(value: string, mapping: Record<string, string>): string {
  return mapping[value] || value;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function createSubmissionId(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AMC-${stamp}-${rand}`;
}

export function readIntakeAnswersFromStorage(): IntakeAnswers {
  const base = buildInitialAnswers();
  if (typeof window === "undefined") {
    return base;
  }
  try {
    const raw = window.localStorage.getItem(INTAKE_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return { ...base, ...parsed } as IntakeAnswers;
  } catch {
    return base;
  }
}

function readIntakeMetaFromStorage(): { completedAt?: string } {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(INTAKE_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { completedAt?: string };
    return parsed || {};
  } catch {
    return {};
  }
}

export function buildEngineCompatibleIntake(
  answers: IntakeAnswers,
  tier: AmcTier,
  language: AmcLanguage,
): Record<string, unknown> {
  return {
    fullName: asString(answers.fullName),
    email: asString(answers.email),
    location: asString(answers.location),
    currentRoleCompany: asString(answers.currentRoleCompany),
    yearsExperience: mapValue(asString(answers.yearsExperience), yearsMap),

    mainDecision: asString(answers.mainDecision),
    urgency: mapValue(asString(answers.urgency), urgencyMap),
    optionsUnderConsideration: asString(answers.optionsUnderConsideration),
    forcedChoiceToday: asString(answers.forcedChoiceToday),

    topPriorities: asStringArray(answers.topPriorities).map((v) => mapValue(v, prioritiesMap)),
    nonNegotiable: asString(answers.nonNegotiable),
    biggestRisks: asString(answers.biggestRisks),

    marketDemandOutlook: mapValue(asString(answers.marketDemandOutlook), marketMap),
    marketDemandReason: asString(answers.marketDemandReason),
    profileDifferentiation: mapValue(asString(answers.profileDifferentiation), diffMap),

    companyHealthConfidence: mapValue(asString(answers.companyHealthConfidence), confidenceMap),
    companyStability: mapValue(asString(answers.companyStability), stabilityMap),
    restructuringHistory: mapValue(asString(answers.restructuringHistory), restructureMap),

    sponsorSupport: mapValue(asString(answers.sponsorSupport), sponsorMap),
    decisionLineClarity: mapValue(asString(answers.decisionLineClarity), clarityMap),
    workflowPace: mapValue(asString(answers.workflowPace), paceMap),
    externalShockExposure: mapValue(asString(answers.externalShockExposure), exposureMap),

    riskOptimizationStyle: mapValue(asString(answers.riskOptimizationStyle), riskStyleMap),
    visibleRiskComfort: mapValue(asString(answers.visibleRiskComfort), riskComfortMap),
    commitmentStyle: mapValue(asString(answers.commitmentStyle), commitmentMap),
    energizingWorkStyle: asString(answers.energizingWorkStyle),

    stayScenario12to18m: asString(answers.stayScenario12to18m),
    planBStrength: mapValue(asString(answers.planBStrength), planBMap),

    reportValueExpectation: parseExpectations(answers.reportValueExpectation),
    mustAnswerQuestion: asString(answers.mustAnswerQuestion),
    consent: answers.consent === true,

    tier,
    submittedAt: new Date().toISOString(),
    reportDate: todayISODate(),
    betaMode: true,
    lang: language,
    chatbotAccessToken: "",
    chatbotAccessExpiresAt: "",
  };
}

export function buildSubmissionHandoffFromStorage(
  tier: AmcTier,
  language: AmcLanguage,
): AmcSubmissionHandoff {
  const answers = readIntakeAnswersFromStorage();
  const intakeMeta = readIntakeMetaFromStorage();
  const submissionId = createSubmissionId();
  const createdAt = new Date().toISOString();
  const intakeRaw = buildEngineCompatibleIntake(answers, tier, language);

  return {
    submissionId,
    createdAt,
    source: "manus_ui_intake_v1",
    language,
    tier,
    recipient: {
      email: asString(answers.email),
      fullName: asString(answers.fullName),
    },
    delivery: {
      channel: "email",
      language,
      tier,
    },
    intakeRaw,
    intakeMeta,
  };
}

export function saveSubmissionHandoff(handoff: AmcSubmissionHandoff): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SUBMISSION_HANDOFF_KEY, JSON.stringify(handoff));
}

export function readSubmissionHandoff(): AmcSubmissionHandoff | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SUBMISSION_HANDOFF_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AmcSubmissionHandoff;
  } catch {
    return null;
  }
}

