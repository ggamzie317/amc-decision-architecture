import { buildCurrentCaseStructuralSignals } from "./amcCurrentCaseStructuralSignals";
import {
  buildProductApplicationV3,
  buildUnavailableFifwm,
  type ProductApplicationBuildInput,
  type ProductApplicationV3,
  type StructuralStrength,
  type StructuralRisk,
  type StructuralLoad,
} from "./amcProductApplicationV3";
import {
  applyScenarioOverrides,
  baselineBands,
  evaluateScenario,
  scenarioVariables,
  type ScenarioOverrides,
  type ScenarioVariable,
} from "./amcScenario";
import {
  unavailableIntelligence,
  type ExternalIntelligenceV2,
  type V2Provenance,
} from "./externalIntelligenceV2";
import { caseTypes } from "../../../shared/interactivePrivacy";
import { v2t, type V2CopyKey, type V2Language } from "./v2Language";
import { v2CustomerNextTest, v2MissingPoint } from "./amcV2Presentation";
export const V2_SCHEMA = "AMC-MODULES-V2-8";
export const V2_EXPERIENCE = "interactive-v2";
export type V2CaseType = (typeof caseTypes)[number];
export type V2Bands = {
  internalReadiness: StructuralStrength;
  financialRoom: StructuralStrength;
  reversibility: StructuralStrength;
  downsideExposure: StructuralRisk;
  optionBSupport: StructuralStrength;
  constraintLoad: StructuralLoad;
};
export type V2State = {
  language: V2Language;
  decision: string;
  optionA: string;
  optionB: string;
  caseType: V2CaseType;
  whyNow: V2CopyKey[];
  waitEffect: V2CopyKey | null;
  protects: V2CopyKey[];
  opens: V2CopyKey[];
  exposes: V2CopyKey[];
  externalAreas: V2CopyKey[];
  targetGeography: string;
  publicSearchTarget?: string;
  bands: V2Bands;
  bandSelections: Record<keyof V2Bands, boolean>;
  missingAssets: V2CopyKey[];
  supportSources: V2CopyKey[];
  constraints: V2CopyKey[];
  timingEffect: V2CopyKey | null;
  switchIds: string[];
  customCondition: string;
  optionalNote: string;
  serviceConsent: boolean;
  researchConsent: boolean;
};
export const v2ModuleKeys = [
  "currentSituation",
  "options",
  "externalPressure",
  "readiness",
  "safety",
  "support",
  "timing",
  "switches",
] as const satisfies readonly V2CopyKey[];
export const v2Choices = {
  whyNow: [
    "newOpportunity",
    "stagnation",
    "incomePressure",
    "familyLocation",
    "marketChange",
    "identity",
    "workload",
    "ageTiming",
    "other",
  ],
  protects: [
    "income",
    "stability",
    "roleTitle",
    "familyStability",
    "time",
    "network",
    "credibility",
    "flexibility",
    "other",
  ],
  opens: [
    "growth",
    "incomeUpside",
    "newMarket",
    "mobility",
    "learning",
    "autonomy",
    "identityAlignment",
    "network",
    "researchExpertise",
    "other",
  ],
  exposes: [
    "incomeRisk",
    "timeRisk",
    "executionBurden",
    "familyPressure",
    "visa",
    "credibilityRisk",
    "marketUncertainty",
    "recoveryRisk",
    "other",
  ],
  careerExternal: [
    "hiringDemand",
    "roleDemand",
    "compensation",
    "requiredSkills",
    "industryDirection",
    "geography",
    "visaMobility",
  ],
  entrepreneurExternal: [
    "customerDemand",
    "competition",
    "pricing",
    "marketGrowth",
    "distribution",
    "barriers",
    "regulation",
  ],
  educationExternal: [
    "programOutcomes",
    "employmentRelevance",
    "researchRelevance",
    "opportunityCost",
    "funding",
    "geographyMobility",
  ],
  missingAssets: [
    "skills",
    "credential",
    "trackRecord",
    "network",
    "marketProof",
    "time",
    "energy",
    "executionCapacity",
  ],
  supportSources: [
    "family",
    "managerCompany",
    "professionalNetwork",
    "mentor",
    "academic",
    "financialSupport",
    "partner",
    "customerBuyer",
    "none",
  ],
  constraints: [
    "deadline",
    "careerTiming",
    "family",
    "location",
    "visa",
    "company",
    "financialConstraint",
    "healthEnergy",
    "marketWindow",
    "schoolChildren",
    "other",
  ],
} as const satisfies Record<string, readonly V2CopyKey[]>;
export function v2ExternalOptions(caseType: V2CaseType): readonly V2CopyKey[] {
  return caseType === "Entrepreneurship"
    ? v2Choices.entrepreneurExternal
    : caseType === "MBA / EMBA / PhD Decision"
      ? v2Choices.educationExternal
      : v2Choices.careerExternal;
}
export function suggestV2CaseType(text: string): V2CaseType {
  const t = text.toLowerCase();
  if (/창업|사업|startup|business|founder|entrepreneur/.test(t))
    return "Entrepreneurship";
  if (/mba|emba|phd|박사|석사|대학원|학위/.test(t))
    return "MBA / EMBA / PhD Decision";
  if (/해외|이주|relocat|overseas|abroad/.test(t)) return "Overseas Relocation";
  if (/산업|industry|job search|이직|채용/.test(t))
    return "Industry Transition";
  if (/승진|직급|role upgrade|downgrade/.test(t))
    return "Role Upgrade / Downgrade";
  if (/번아웃|burnout|소진/.test(t)) return "Burnout-driven Decision";
  if (/가족|육아|family/.test(t)) return "Family Constraint-heavy Decision";
  if (/퇴사|잔류|stay|exit/.test(t)) return "Corporate Stay vs Exit";
  return "General Career Reconfiguration";
}
export function initialV2State(language: V2Language = "en"): V2State {
  return {
    language,
    decision: "",
    optionA: "",
    optionB: "",
    caseType: "General Career Reconfiguration",
    whyNow: [],
    waitEffect: null,
    protects: [],
    opens: [],
    exposes: [],
    externalAreas: [],
    targetGeography: "",
    bands: {
      internalReadiness: "unknown",
      financialRoom: "unknown",
      reversibility: "unknown",
      downsideExposure: "unknown",
      optionBSupport: "unknown",
      constraintLoad: "unknown",
    },
    bandSelections: {
      internalReadiness: false,
      financialRoom: false,
      reversibility: false,
      downsideExposure: false,
      optionBSupport: false,
      constraintLoad: false,
    },
    missingAssets: [],
    supportSources: [],
    constraints: [],
    timingEffect: null,
    switchIds: [],
    customCondition: "",
    optionalNote: "",
    serviceConsent: false,
    researchConsent: false,
  };
}
export const v2RequiredBandsByStep: Partial<
  Record<number, readonly (keyof V2Bands)[]>
> = {
  3: ["internalReadiness"],
  4: ["financialRoom", "reversibility", "downsideExposure"],
  5: ["optionBSupport"],
  6: ["constraintLoad"],
};
export function v2UnansweredBands(
  state: V2State,
  step: number
): (keyof V2Bands)[] {
  return (v2RequiredBandsByStep[step] || []).filter(
    key => !state.bandSelections[key]
  );
}
export function v2AllBandsAnswered(state: V2State): boolean {
  return [3, 4, 5, 6]
    .flatMap(step => v2RequiredBandsByStep[step] || [])
    .every(key => state.bandSelections[key]);
}
export type V2Switch = {
  id: string;
  text: string;
  side: "B" | "A";
  provenance: V2Provenance;
};
export function v2SwitchCandidates(
  s: V2State,
  intelligence: ExternalIntelligenceV2
): V2Switch[] {
  const t = (key: V2CopyKey) => v2t(s.language, key);
  const caseArea: V2CopyKey =
    s.caseType === "Entrepreneurship"
      ? "customerDemand"
      : s.caseType === "MBA / EMBA / PhD Decision"
        ? "programOutcomes"
        : "roleDemand";
  const externalLabel = s.externalAreas[0]
    ? t(s.externalAreas[0])
    : intelligence.status === "demo" && intelligence.evidenceBlocks[0]
      ? intelligence.evidenceBlocks[0].dimension
      : t(caseArea);
  const fourth =
    s.bands.optionBSupport === "weak" || s.bands.optionBSupport === "unknown"
      ? "supportBand"
      : "readinessBand";
  const fourthId = fourth === "supportBand" ? "support" : "readiness";
  const candidates: V2Switch[] = [
    {
      id: "external",
      text: `${externalLabel} · ${t("ifVerified")}`,
      side: "B",
      provenance: "DERIVED_CORE_RULE",
    },
    {
      id: "financial",
      text: `${t("financial")} · ${t("strong")}`,
      side: "B",
      provenance: "DERIVED_CORE_RULE",
    },
    {
      id: "reversibility",
      text: `${t("reversibility")} · ${t("strong")}`,
      side: "B",
      provenance: "DERIVED_CORE_RULE",
    },
    {
      id: fourthId,
      text: `${t(fourth)} · ${t("strong")}`,
      side: "B",
      provenance: "DERIVED_CORE_RULE",
    },
    {
      id: "downside",
      text: `${t("downside")} · ${t("high")}`,
      side: "A",
      provenance: "DERIVED_CORE_RULE",
    },
    {
      id: "constraints",
      text: `${t("constraint")} · ${t("heavy")}`,
      side: "A",
      provenance: "DERIVED_CORE_RULE",
    },
  ];
  if (intelligence.status === "demo")
    candidates[0].text += ` (${t("demoNotVerification")})`;
  return candidates;
}
const selected = (s: V2State, keys: V2CopyKey[]) =>
  keys.map(k => v2t(s.language, k)).join(s.language === "ko" ? " · " : " · ");
export function buildV2Input(
  s: V2State,
  intelligence?: ExternalIntelligenceV2
): ProductApplicationBuildInput {
  const language = s.language;
  // Public facts inform the reasoning below; they cannot establish this customer's
  // employability, paid demand or recovery capacity. Personal validation stays unknown.
  const personalValidation = {
    status: "unverified" as const,
    confidence: "low" as const,
    generatedAtLabel: "",
    externalSignals: [],
    sourceNotes: [],
    uncertaintyNotes: [],
    implication: "",
  };
  const selections = {
    17: s.bands.internalReadiness,
    19: s.bands.financialRoom,
    20: s.bands.reversibility,
    21: s.bands.downsideExposure,
    23: s.bands.optionBSupport,
    25: s.bands.constraintLoad,
  };
  const coreSignals = buildCurrentCaseStructuralSignals({
    externalSnapshot: personalValidation,
    selections,
  });
  const missing = v2MissingPoint(s.caseType, language);
  const externalArea = selected(s, s.externalAreas);
  const conditionNames = v2SwitchCandidates(
    s,
    unavailableIntelligence(s.caseType, language)
  )
    .filter(c => s.switchIds.includes(c.id))
    .map(c => c.text);
  const answers: Record<number, string> = {
    1: s.decision,
    5: s.optionA,
    8: s.optionB,
    6: selected(s, s.protects),
    9: selected(s, s.opens),
    14: externalArea,
    17: selected(s, s.missingAssets),
    19: v2t(language, s.bands.financialRoom),
    20: v2t(language, s.bands.reversibility),
    21: v2t(language, s.bands.downsideExposure),
    23: selected(s, s.supportSources),
    25: selected(s, s.constraints),
  };
  const riskLabel = v2t(language, "downside");
  return {
    language,
    caseType: s.caseType,
    optionA: s.optionA,
    optionB: s.optionB,
    answers,
    fifwm: buildUnavailableFifwm(language),
    fifwmSource: "unavailable",
    ...coreSignals,
    missingPoint: missing.point,
    missingPointWhy: missing.why,
    primaryRisk: riskLabel,
    primaryRiskMeaning:
      s.bands.downsideExposure === "unknown"
        ? v2t(language, "noneYet")
        : v2t(language, s.bands.downsideExposure),
    decisionConditions: [
      ...conditionNames,
      ...(s.customCondition.trim() ? [s.customCondition.trim()] : []),
    ].slice(0, 3),
    validationFocus: externalArea || v2t(language, "evidenceUnavailable"),
    externalImplication:
      intelligence?.status === "live"
        ? [
            intelligence.implication,
            ...intelligence.evidenceBlocks.map(
              block => `${block.dimension}: ${block.fact}`
            ),
          ].join("\n")
        : v2t(language, "evidenceUnavailable"),
    plan: [
      {
        period: "30",
        title: v2t(language, "day30"),
        action: v2t(language, "externalValidation"),
        output: v2t(language, "evidence"),
      },
      {
        period: "60",
        title: v2t(language, "day60"),
        action: v2t(language, "readinessBand"),
        output: v2t(language, "validationState"),
      },
      {
        period: "90",
        title: v2t(language, "day90"),
        action: v2t(language, "switches"),
        output: v2t(language, "decisionMap"),
      },
    ],
  };
}
export type V2Reading = { value: string; provenance: V2Provenance };
export function v2DecisionReadings(s: V2State, core: ProductApplicationV3) {
  const label = (keys: V2CopyKey[], fallback: string) =>
    selected(s, keys) || fallback;
  const caseStructure = core.presentation.decisionStructure;
  const protects = label(s.protects, caseStructure.optionAProtects);
  const opens = label(s.opens, caseStructure.optionBOpens);
  const tradeoffProtects = label(
    s.protects.slice(0, 2),
    caseStructure.optionAProtects
  );
  const tradeoffOpens = label(s.opens.slice(0, 2), caseStructure.optionBOpens);
  const nextTest = v2CustomerNextTest(
    s.caseType,
    s.language,
    core.presentation.nextTestKeyword
  );
  return {
    posture: {
      value: core.currentStructuralPosture.label,
      provenance: "DERIVED_CORE_RULE",
    },
    safety: {
      value: v2t(s.language, core.safetyMargin.band),
      provenance: "DERIVED_CORE_RULE",
    },
    missing: {
      value:
        s.language === "ko"
          ? v2MissingPoint(s.caseType, s.language).point
          : core.presentation.missingPointKeyword,
      provenance: "DERIVED_CORE_RULE",
    },
    missingDetail: {
      value: v2MissingPoint(s.caseType, s.language).why,
      provenance: "DERIVED_CORE_RULE",
    },
    protects: {
      value: protects,
      provenance: s.protects.length ? "USER_STRUCTURED" : "DERIVED_CORE_RULE",
    },
    opens: {
      value: opens,
      provenance: s.opens.length ? "USER_STRUCTURED" : "DERIVED_CORE_RULE",
    },
    tradeoff: {
      value: `${tradeoffProtects} ↔ ${tradeoffOpens}`,
      provenance:
        s.protects.length && s.opens.length
          ? "USER_STRUCTURED"
          : "DERIVED_CORE_RULE",
    },
    exposure: {
      value: label(
        s.exposes,
        `${v2t(s.language, "downside")}: ${v2t(s.language, core.safetyMargin.inputs.downsideExposure.band)}`
      ),
      provenance: s.exposes.length ? "USER_STRUCTURED" : "DERIVED_CORE_RULE",
    },
    constraint: {
      value: label(s.constraints, caseStructure.keyConstraint),
      provenance: s.constraints.length
        ? "USER_STRUCTURED"
        : "DERIVED_CORE_RULE",
    },
    nextTest: { value: nextTest, provenance: "DERIVED_CORE_RULE" },
  } as const satisfies Record<string, V2Reading>;
}
export type V2Sensitivity = {
  variable: ScenarioVariable;
  band: string;
  posture: boolean;
  safety: boolean;
  changing: boolean;
  nextTest: boolean;
  scenario: ProductApplicationV3;
};
export function buildV2Sensitivity(
  input: ProductApplicationBuildInput,
  baseline = buildProductApplicationV3(input)
): V2Sensitivity[] {
  const base = baselineBands(input);
  return scenarioVariables.flatMap(variable => {
    const choices =
      variable === "downsideExposure"
        ? ["low", "moderate", "high", "unknown"]
        : variable === "constraintLoad"
          ? ["light", "material", "heavy", "unknown"]
          : ["strong", "developing", "weak", "unknown"];
    return choices
      .filter(band => band !== base[variable])
      .map(band => {
        const overrides = { [variable]: band } as ScenarioOverrides;
        const scenario = evaluateScenario(input, overrides);
        return {
          variable,
          band,
          posture:
            scenario.currentStructuralPosture.label !==
            baseline.currentStructuralPosture.label,
          safety: scenario.safetyMargin.band !== baseline.safetyMargin.band,
          changing:
            JSON.stringify(scenario.changingPlays.map(p => p.family)) !==
            JSON.stringify(baseline.changingPlays.map(p => p.family)),
          nextTest:
            scenario.nextStepExperiment.whatToTest !==
            baseline.nextStepExperiment.whatToTest,
          scenario,
        };
      });
  });
}
export function v2Scenario(
  input: ProductApplicationBuildInput,
  overrides: ScenarioOverrides
) {
  return {
    input: applyScenarioOverrides(input, overrides),
    result: evaluateScenario(input, overrides),
  };
}
