export type IntakeFieldType = "text" | "textarea" | "select" | "multiselect" | "consent";

export type IntakeQuestion = {
  id: number;
  field: string;
  type: IntakeFieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  helper?: string;
};

export type IntakeSection = {
  id: number;
  title: string;
  questions: IntakeQuestion[];
};

export const INTAKE_STORAGE_KEY = "amc_intake_answers_v1";
export const INTAKE_META_KEY = "amc_intake_meta_v1";

export const intakeSections: IntakeSection[] = [
  {
    id: 1,
    title: "Profile & Current Context",
    questions: [
      { id: 1, field: "fullName", type: "text", label: "1. Full Name", placeholder: "Your full name" },
      { id: 2, field: "email", type: "text", label: "2. Email", placeholder: "name@example.com" },
      { id: 3, field: "location", type: "text", label: "3. Current Location", placeholder: "City, Country" },
      {
        id: 4,
        field: "currentRoleCompany",
        type: "text",
        label: "4. Current Role / Company",
        placeholder: "Current title and company",
      },
      {
        id: 5,
        field: "yearsExperience",
        type: "select",
        label: "5. Years of Professional Experience",
        options: ["0_5", "6_10", "11_15", "16_20", "20_plus"],
      },
    ],
  },
  {
    id: 2,
    title: "Decision Frame",
    questions: [
      {
        id: 6,
        field: "mainDecision",
        type: "textarea",
        label: "6. What is the main career decision you are considering right now?",
        placeholder: "Describe the core decision in concrete terms.",
      },
      {
        id: 7,
        field: "urgency",
        type: "select",
        label: "7. What is the decision timeline?",
        options: ["within_1m", "within_3m", "within_6m", "after_6m", "not_sure"],
      },
      {
        id: 8,
        field: "optionsUnderConsideration",
        type: "textarea",
        label: "8. What options are currently under consideration?",
        placeholder: "Option A / Option B (or single path) with short framing.",
      },
      {
        id: 9,
        field: "forcedChoiceToday",
        type: "textarea",
        label: "9. If you had to choose today, what would you pick and why?",
        placeholder: "Short directional choice and rationale.",
      },
      {
        id: 10,
        field: "topPriorities",
        type: "multiselect",
        label: "10. Top priorities for this decision",
        helper: "Select up to 3.",
        options: [
          "income_stability",
          "growth_upside",
          "role_fit",
          "family_stability",
          "location_flexibility",
          "health_load",
          "brand_platform",
          "decision_reversibility",
        ],
      },
      {
        id: 11,
        field: "nonNegotiable",
        type: "textarea",
        label: "11. What is non-negotiable in this decision?",
        placeholder: "State hard constraints or red lines.",
      },
      {
        id: 12,
        field: "biggestRisks",
        type: "textarea",
        label: "12. What are the biggest downside risks you want to avoid?",
        placeholder: "List key risk scenarios.",
      },
    ],
  },
  {
    id: 3,
    title: "Market & Company Signals",
    questions: [
      {
        id: 13,
        field: "marketDemandOutlook",
        type: "select",
        label: "13. Market demand outlook (3–5 years)",
        options: ["declining", "unclear", "growing"],
      },
      {
        id: 14,
        field: "marketDemandReason",
        type: "textarea",
        label: "14. Why do you view demand this way?",
        placeholder: "Short evidence or context basis.",
      },
      {
        id: 15,
        field: "profileDifferentiation",
        type: "select",
        label: "15. How differentiated is your profile in this path?",
        options: ["low", "medium", "high"],
      },
      {
        id: 16,
        field: "companyHealthConfidence",
        type: "select",
        label: "16. Confidence in company health and viability",
        options: ["low", "medium", "high"],
      },
      {
        id: 17,
        field: "companyStability",
        type: "select",
        label: "17. Stability and predictability of team/organization",
        options: ["unstable", "mixed", "stable"],
      },
      {
        id: 18,
        field: "restructuringHistory",
        type: "select",
        label: "18. Recent restructuring / leadership change signal",
        options: ["multiple_changes", "some_changes", "no_major_changes", "unknown"],
      },
      {
        id: 19,
        field: "sponsorSupport",
        type: "select",
        label: "19. Active sponsor support in target role/team",
        options: ["no_sponsor", "uncertain_support", "strong_sponsor"],
      },
      {
        id: 20,
        field: "decisionLineClarity",
        type: "select",
        label: "20. Clarity of decision path and criteria",
        options: ["not_clear", "somewhat_clear", "very_clear"],
      },
      {
        id: 21,
        field: "workflowPace",
        type: "select",
        label: "21. Current workflow pace and execution load",
        options: ["slow", "mixed", "fast"],
      },
      {
        id: 22,
        field: "externalShockExposure",
        type: "select",
        label: "22. Exposure to external shocks (market/policy/industry)",
        options: ["high_exposure", "manageable_exposure", "well_protected", "not_sure"],
      },
    ],
  },
  {
    id: 4,
    title: "Fit & Operating Posture",
    questions: [
      {
        id: 23,
        field: "riskOptimizationStyle",
        type: "select",
        label: "23. Risk style in major decisions",
        options: ["protect_downside", "balance_risk_reward", "maximize_upside"],
      },
      {
        id: 24,
        field: "visibleRiskComfort",
        type: "select",
        label: "24. Comfort with visible uncertainty",
        options: ["low", "medium", "high"],
      },
      {
        id: 25,
        field: "commitmentStyle",
        type: "select",
        label: "25. Commitment style",
        options: ["small_reversible_steps", "gradual_commitment", "go_all_in"],
      },
      {
        id: 26,
        field: "energizingWorkStyle",
        type: "textarea",
        label: "26. What work style feels energizing and sustainable for you?",
        placeholder: "Describe pace, operating mode, and environment fit.",
      },
    ],
  },
  {
    id: 5,
    title: "Reality & Safety Nets",
    questions: [
      {
        id: 27,
        field: "stayScenario12to18m",
        type: "textarea",
        label: "27. If you stay on this path for 12–18 months, what is likely to happen?",
        placeholder: "Describe realistic trajectory and risk.",
      },
      {
        id: 28,
        field: "planBStrength",
        type: "select",
        label: "28. Strength of fallback / safety net",
        options: ["weak", "moderate", "strong"],
      },
    ],
  },
  {
    id: 6,
    title: "Expectations & Consent",
    questions: [
      {
        id: 29,
        field: "reportValueExpectation",
        type: "textarea",
        label: "29. What would make this report extremely valuable for you?",
        placeholder: "State expected value or key decision-use outcome.",
      },
      {
        id: 30,
        field: "mustAnswerQuestion",
        type: "textarea",
        label: "30. What is the one question this report must answer?",
        placeholder: "Your non-negotiable decision question.",
      },
      {
        id: 31,
        field: "consent",
        type: "consent",
        label: "31. I confirm this submission is accurate to the best of my knowledge and consent to AMC report preparation.",
      },
    ],
  },
];

export const intakeQuestions = intakeSections.flatMap((section) =>
  section.questions.map((question) => ({ ...question, sectionId: section.id, sectionTitle: section.title })),
);

export type IntakeAnswers = Record<string, string | string[] | boolean>;

export function buildInitialAnswers(): IntakeAnswers {
  const base: IntakeAnswers = {};
  for (const q of intakeQuestions) {
    if (q.type === "multiselect") {
      base[q.field] = [];
    } else if (q.type === "consent") {
      base[q.field] = false;
    } else {
      base[q.field] = "";
    }
  }
  return base;
}
