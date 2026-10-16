import { withKoreanParticle } from "./koreanParticle";

export const AMC_ANALYSIS_SEQUENCE = [
  "User Input", "Live External Evidence", "FIFWM / Decision Structure",
  "What You May Be Missing", "Current Structural Posture", "Changing",
  "Safety Margin", "Decision Switches", "Next Experiment",
] as const;

export type StructuralStrength = "strong" | "developing" | "weak" | "unknown";
export type StructuralRisk = "low" | "moderate" | "high" | "unknown";
export type StructuralLoad = "light" | "material" | "heavy" | "unknown";
export type MissingPointImpact = "resolved" | "material" | "critical" | "unknown";
export type StructuralSignalSource =
  | "canonical-current-case"
  | "current-user-structured"
  | "live-external-evidence"
  | "current-case-derived"
  | "unavailable";
export type StructuralSignal<TBand extends string> = { band: TBand; source: StructuralSignalSource };
export type SafetyMarginInputs = {
  financialRoom: StructuralSignal<StructuralStrength>;
  reversibility: StructuralSignal<StructuralStrength>;
  downsideExposure: StructuralSignal<StructuralRisk>;
};
export type SafetyMarginCore = StructuralSignal<StructuralStrength> & { knownDimensions: number };
export type PostureFamily = "transition" | "validate" | "reconfigure";
export type PostureAssessment = {
  support: number;
  candidatePosture: PostureFamily;
  effectivePosture: PostureFamily;
  guardrailApplied: boolean;
  guardrailTriggers: Array<"weak-safety-margin" | "weak-reversibility" | "high-structural-risk">;
};
export type FifwmFactor = { score: 0 | 1 | 2 | null; reading: string };
export type FifwmStructure = {
  formal: FifwmFactor;
  informal: FifwmFactor;
  framework: FifwmFactor;
  workflow: FifwmFactor;
  marketPolicy: FifwmFactor;
};
export type ChangingPlay = {
  family: "parallel-validation" | "role-scope" | "timing" | "resource" | "pathway";
  title: string;
  move: string;
  changes: string;
  protects: string;
  needs: string;
  exposure: string;
  optionStrengthened: string;
  evidence: string;
  timeExposure: string;
};

export type ProductApplicationPresentation = {
  postureKeyword: string;
  missingPointKeyword: string;
  safetyMarginKeyword: string;
  coreTradeoffKeyword: string;
  nextTestKeyword: string;
  missingPointSummary: string;
  decisionStructure: {
    optionA: string;
    optionAProtects: string;
    optionB: string;
    optionBOpens: string;
    coreTension: string;
    keyConstraint: string;
    externalEvidence: string;
  };
};

export type ProductApplicationV3 = {
  analysisSequence: typeof AMC_ANALYSIS_SEQUENCE;
  presentation: ProductApplicationPresentation;
  decisionStructure: {
    fifwm: FifwmStructure;
    fifwmSource: "canonical-current-case" | "case-adapted" | "unavailable";
    insideReality: string;
    outsideEvidence: string;
    constraints: string;
    tradeOffs: string;
  };
  missingPoint: string;
  currentStructuralPosture: { label: string; sentence: string };
  postureEvidenceCoverage: "limited" | "partial" | "stronger";
  postureBasis: ProductApplicationBuildInput["structuralSignals"];
  why: { topDrivers: string[]; biggestRisk: string; strongestCounterargument: string };
  changingPlays: ChangingPlay[];
  safetyMargin: {
    band: StructuralStrength;
    source: StructuralSignalSource;
    inputs: SafetyMarginInputs;
    reading: string;
    financialRoomReading: string;
    recoveryReentryReading: string;
    downsideExposureReading: string;
    roomToBeWrong: string;
    strongestProtection: string;
    weakestMargin: string;
    protectedCapacity: string;
    exposureBoundary: string;
  };
  decisionSwitches: Array<{ signal: string; direction: string }>;
  nextStepExperiment: {
    whatToTest: string;
    buildOrLearn: string;
    evidenceToCollect: string;
    exposureBoundary: string;
    continueCondition: string;
    pauseCondition: string;
    reassessAt: string;
    stages: Array<{ period: string; title: string; action: string; output: string }>;
  };
};

export type ProductApplicationBuildInput = {
  language: "en" | "ko";
  caseType: string;
  optionA: string;
  optionB: string;
  answers: Record<number, string>;
  fifwm: FifwmStructure;
  fifwmSource: "canonical-current-case" | "case-adapted" | "unavailable";
  safetyMarginInputs: SafetyMarginInputs;
  structuralSignals: {
    externalValidation: StructuralSignal<StructuralStrength>;
    internalReadiness: StructuralSignal<StructuralStrength>;
    safetyMargin: StructuralSignal<StructuralStrength>;
    reversibility: StructuralSignal<StructuralStrength>;
    optionBSupport: StructuralSignal<StructuralStrength>;
    structuralRisk: StructuralSignal<StructuralRisk>;
    constraintLoad: StructuralSignal<StructuralLoad>;
    missingPointImpact: StructuralSignal<MissingPointImpact>;
  };
  missingPoint: string;
  missingPointWhy: string;
  /** Compatibility input only. New Changing discovery is derived from structure. */
  changingMoves?: string[];
  primaryRisk: string;
  primaryRiskMeaning: string;
  decisionConditions: string[];
  /**
   * Which option each decision condition argues for, by index: "B" = a reason
   * to move toward the new path, "A" = a reason to stay or wait. Missing or
   * null keeps the older position-based wording (legacy surfaces, free text).
   */
  decisionConditionSides?: Array<"A" | "B" | null>;
  validationFocus: string;
  externalImplication: string;
  plan: Array<{ period: string; title: string; action: string; output: string }>;
};

const answer = (answers: Record<number, string>, id: number, fallback: string) =>
  answers[id]?.trim() || fallback;

const cleanOptionLabel = (value: string) => value.trim().replace(/[.!?]+$/, "");

const scoreKeys = {
  formal: "F_Formal",
  informal: "F_Informal",
  framework: "F_Framework",
  workflow: "F_Workflow",
  marketPolicy: "F_MarketPolicy",
} as const;

/** Missing values (null, "", false, whitespace) stay unassessed; only a real 0/1/2 scores. */
export function fifwmScore(value: unknown): 0 | 1 | 2 | null {
  const numeric = typeof value === "number"
    ? value
    : typeof value === "string" && /^\s*[0-2]\s*$/.test(value) ? Number(value) : NaN;
  return numeric === 0 || numeric === 1 || numeric === 2 ? numeric : null;
}

/** Maps the canonical FIFWM fields emitted by src/scoring/fifwm.py and report_payload_builder.py. */
export function buildFifwmFromReportPayload(payload: Record<string, unknown>): FifwmStructure {
  return Object.fromEntries(
    Object.entries(scoreKeys).map(([factor, prefix]) => {
      const reading = payload[`${prefix}_Text`] || payload[`${prefix}_Note`] || "Signal currently insufficient for a stable sub-read.";
      return [factor, { score: fifwmScore(payload[`${prefix}_Score`]), reading: String(reading) }];
    }),
  ) as FifwmStructure;
}

/** Used when the live intake has not passed through the canonical AMC FIFWM scorer. */
export function buildUnavailableFifwm(language: "en" | "ko"): FifwmStructure {
  const reading = language === "ko"
    ? "현재 사례가 canonical FIFWM scorer를 통과하지 않아 판단할 근거가 충분하지 않습니다."
    : "Insufficient current-case evidence: this intake has not passed through the canonical FIFWM scorer.";
  return Object.fromEntries(Object.keys(scoreKeys).map((factor) => [factor, { score: null, reading }])) as FifwmStructure;
}

const strengthScore: Record<StructuralStrength, number> = { strong: 2, developing: 1, weak: 0, unknown: 1 };
const riskPenalty: Record<StructuralRisk, number> = { low: 0, moderate: 1, high: 2, unknown: 1 };
const loadPenalty: Record<StructuralLoad, number> = { light: 0, material: 1, heavy: 2, unknown: 1 };
const missingPenalty: Record<MissingPointImpact, number> = { resolved: 0, material: 1, critical: 2, unknown: 1 };

/** Deterministic current-case Safety Margin core; unknown dimensions do not affect the average. */
export function deriveSafetyMarginCore(inputs: SafetyMarginInputs): SafetyMarginCore {
  const values = [
    inputs.financialRoom.band === "unknown" ? null : strengthScore[inputs.financialRoom.band],
    inputs.reversibility.band === "unknown" ? null : strengthScore[inputs.reversibility.band],
    inputs.downsideExposure.band === "unknown" ? null : 2 - riskPenalty[inputs.downsideExposure.band],
  ].filter((value): value is number => value !== null);
  const source = Object.values(inputs).some((input) => input.source === "current-user-structured")
    ? "current-user-structured"
    : "unavailable";
  if (values.length < 2) return { band: "unknown", source, knownDimensions: values.length };
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    band: average >= 1.5 ? "strong" : average >= 0.75 ? "developing" : "weak",
    source,
    knownDimensions: values.length,
  };
}

function deriveEvidenceCoverage(input: ProductApplicationBuildInput): ProductApplicationV3["postureEvidenceCoverage"] {
  const canonicalFactors = Object.values(input.fifwm).filter((factor) => factor.score !== null).length;
  const knownSignals = Object.values(input.structuralSignals).filter((signal) => signal.band !== "unknown").length;
  if (canonicalFactors >= 3 && knownSignals >= 4) return "stronger";
  if (knownSignals >= 2) return "partial";
  return "limited";
}

export function derivePostureAssessment(input: ProductApplicationBuildInput): PostureAssessment {
  const scores = Object.values(input.fifwm).map((factor) => factor.score).filter((score): score is 0 | 1 | 2 => score !== null);
  const fifwmSupport = scores.length ? scores.reduce<number>((total, score) => total + score, 0) / scores.length : 1;
  const signals = input.structuralSignals;
  const support = fifwmSupport
    + strengthScore[signals.externalValidation.band] * 2
    + strengthScore[signals.internalReadiness.band] * 2
    + strengthScore[signals.safetyMargin.band]
    + strengthScore[signals.reversibility.band]
    + strengthScore[signals.optionBSupport.band]
    - riskPenalty[signals.structuralRisk.band]
    - loadPenalty[signals.constraintLoad.band]
    - missingPenalty[signals.missingPointImpact.band];
  const candidatePosture: PostureFamily = support >= 8 ? "transition" : support <= 1 ? "reconfigure" : "validate";
  const guardrailApplied = candidatePosture === "transition"
    && signals.safetyMargin.band === "weak"
    && (signals.reversibility.band === "weak" || signals.structuralRisk.band === "high");
  const guardrailTriggers: PostureAssessment["guardrailTriggers"] = guardrailApplied
    ? [
        "weak-safety-margin",
        ...(signals.reversibility.band === "weak" ? ["weak-reversibility" as const] : []),
        ...(signals.structuralRisk.band === "high" ? ["high-structural-risk" as const] : []),
      ]
    : [];
  return {
    support,
    candidatePosture,
    effectivePosture: guardrailApplied ? "validate" : candidatePosture,
    guardrailApplied,
    guardrailTriggers,
  };
}

type CasePresentation = {
  missing: [string, string];
  protects: [string, string];
  opens: [string, string];
  tension: [string, string];
  constraint: [string, string];
  nextTest: [string, string];
};

const casePresentations: Record<string, CasePresentation> = {
  "Corporate Stay vs Exit": {
    missing: ["Skills your current role is not using yet", "현재 직무에서 아직 활용하지 못한 역량"], protects: ["Income and position", "소득과 현재 위치"],
    opens: ["Renewed career value", "새로운 커리어 가치"], tension: ["Internal redesign ↔ exit", "내부 재설계 ↔ 퇴사"],
    constraint: ["Role redesign access", "역할 재설계 가능성"], nextTest: ["Test role redesign", "역할 재설계 검증"],
  },
  "MBA / EMBA / PhD Decision": {
    missing: ["Alternative access routes", "대안 접근 경로"], protects: ["Time and capital", "시간과 자본"],
    opens: ["Credibility and access", "신뢰도와 접근성"], tension: ["Degree value ↔ opportunity cost", "학위 가치 ↔ 기회비용"],
    constraint: ["Time and total cost", "시간과 총비용"], nextTest: ["Validate program advantage", "프로그램 차별성 검증"],
  },
  "Overseas Relocation": {
    missing: ["Whether life and work there fit", "현지에서의 일과 생활"], protects: ["Current operating base", "현재 생활 기반"],
    opens: ["Global career options", "글로벌 커리어 선택지"], tension: ["Career upside ↔ relocation load", "커리어 기회 ↔ 이동 부담"],
    constraint: ["Visa and family fit", "비자와 가족 적합성"], nextTest: ["Validate destination fit", "현지 적합성 검증"],
  },
  Entrepreneurship: {
    missing: ["Customers who pay again", "다시 돈을 내는 고객"], protects: ["Income continuity", "소득 연속성"],
    opens: ["Founder-led value", "창업가 주도 가치"], tension: ["Market upside ↔ income continuity", "시장 기회 ↔ 소득 연속성"],
    constraint: ["Runway and delivery load", "소득 여유와 제공 부담"], nextTest: ["Run a small paid pilot", "작은 유료 시범 운영"],
  },
  "Industry Transition": {
    missing: ["Results that carry over", "새 산업에서도 통하는 기존 성과"], protects: ["Established career capital", "기존 커리어 자산"],
    opens: ["New-market relevance", "새 시장에서의 가치"], tension: ["Proven capital ↔ new access", "검증된 자산 ↔ 새 시장 접근"],
    constraint: ["Recognition in new market", "새 시장의 인정"], nextTest: ["Test market recognition", "시장 인정 가능성 검증"],
  },
  "Role Upgrade / Downgrade": {
    missing: ["Real scope change", "실질적인 역할 변화"], protects: ["Current credibility", "현재의 신뢰 자산"],
    opens: ["Expanded authority", "확장된 권한"], tension: ["Title change ↔ career value", "직급 변화 ↔ 커리어 가치"],
    constraint: ["Authority and workload", "권한과 업무 부담"], nextTest: ["Verify role substance", "역할의 실질 검증"],
  },
  "Burnout-driven Decision": {
    missing: ["Recovery before direction", "방향 결정 전 회복"], protects: ["Recovery capacity", "회복 역량"],
    opens: ["A healthier path", "더 건강한 경로"], tension: ["Recovery need ↔ transition readiness", "회복 필요 ↔ 전환 준비도"],
    constraint: ["Energy and recovery", "에너지와 회복"], nextTest: ["Separate recovery from fit", "회복과 적합성 분리"],
  },
  "Family Constraint-heavy Decision": {
    missing: ["Whether it fits your family's routine", "가족의 일상과 맞는 실행 방법"], protects: ["Family stability", "가족의 안정성"],
    opens: ["Preferred career path", "선호하는 커리어 경로"], tension: ["Career upside ↔ family fit", "커리어 기회 ↔ 가족 적합성"],
    constraint: ["Location and support", "지역과 지원 체계"], nextTest: ["Test family-compatible path", "가족 적합 경로 검증"],
  },
  "General Career Reconfiguration": {
    missing: ["Experience the new field will recognize", "새 분야에서도 인정받을 내 경력"], protects: ["Current stability", "현재의 안정성"],
    opens: ["Future career value", "미래 커리어 가치"], tension: ["Stability ↔ future value", "안정성 ↔ 미래 가치"],
    constraint: ["Evidence before commitment", "확정 전 근거"], nextTest: ["Test the key assumption", "핵심 가정 검증"],
  },
};

function casePresentation(input: ProductApplicationBuildInput) {
  return casePresentations[input.caseType] || casePresentations["General Career Reconfiguration"];
}

function deriveChangingPlays(input: ProductApplicationBuildInput, presentation: CasePresentation, missingValidation: string, optionAProtection: string): ChangingPlay[] {
  const ko = input.language === "ko";
  const optionA = cleanOptionLabel(input.optionA);
  const optionB = cleanOptionLabel(input.optionB);
  const signals = input.structuralSignals;
  const externalNeedsValidation = signals.externalValidation.band === "weak" || signals.externalValidation.band === "developing";
  const safetyNeedsProtection = signals.safetyMargin.band === "weak" || signals.safetyMargin.band === "developing";
  const reversibilityNeedsProtection = signals.reversibility.band === "weak" || signals.reversibility.band === "developing";
  const downsideNeedsProtection = signals.structuralRisk.band === "high";
  const hasKnownTrigger = externalNeedsValidation || safetyNeedsProtection || reversibilityNeedsProtection || downsideNeedsProtection;

  const plays: ChangingPlay[] = [];
  const add = (family: ChangingPlay["family"], title: [string, string], move: [string, string], changes: [string, string], protects: [string, string], needs: [string, string], exposure: [string, string]) => {
    if (plays.some((play) => play.family === family) || plays.length >= 3) return;
    plays.push({
      family, title: title[ko ? 1 : 0], move: move[ko ? 1 : 0], changes: changes[ko ? 1 : 0],
      protects: protects[ko ? 1 : 0], needs: needs[ko ? 1 : 0], exposure: exposure[ko ? 1 : 0],
      optionStrengthened: optionB, evidence: missingValidation, timeExposure: exposure[ko ? 1 : 0],
    });
  };
  const roleScopeEligible = input.caseType === "Corporate Stay vs Exit" || input.caseType === "Role Upgrade / Downgrade";
  const pathwayEligible = input.caseType === "MBA / EMBA / PhD Decision" || input.caseType === "Industry Transition" || input.caseType === "Overseas Relocation";

  // Role Upgrade / Downgrade is a role-level change, not an exit decision.
  const roleChange = input.caseType === "Role Upgrade / Downgrade";
  if (roleScopeEligible && hasKnownTrigger) add("role-scope", ["Adjust your current role", "역할 / 범위 재구성"],
    roleChange
      ? [`Before fully accepting the role change, check whether its scope and authority can be adjusted.`, `역할 변경을 확정하기 전에 ${optionA}의 범위를 조정할 수 있는지 먼저 확인합니다.`]
      : [`Before deciding you have to leave, check whether your current role can be redesigned.`, `${withKoreanParticle(optionA, "을/를")} 유지하면서 역할과 범위를 다시 짤 수 있는지 먼저 확인합니다.`],
    roleChange
      ? ["Full role change → scope adjustment check", "역할 전면 변경 → 범위 조정 확인"]
      : ["Exit decision → role redesign check", "퇴사 결정 → 역할 재설계 확인"], presentation.protects, ["A concrete scope proposal", "구체적인 역할 범위 제안"], ["One internal decision cycle", "한 번의 내부 결정 주기"]);
  else if (pathwayEligible && (externalNeedsValidation || reversibilityNeedsProtection)) add("pathway", ["Try an intermediate route", "경로 재구성"], [`Before moving fully, try an intermediate route that builds evidence for the new path.`, `${withKoreanParticle(optionB, "으로/로")} 완전히 전환하기 전에, 근거를 만들 수 있는 중간 경로를 먼저 확인합니다.`], ["Direct conversion → intermediate route", "직접 전환 → 중간 경로"], presentation.protects, ["Comparable outcome evidence", "비교 가능한 결과 근거"], ["One intermediate step only", "중간 경로 한 번만 확인"]);
  else if (externalNeedsValidation) add("parallel-validation", ["Test it alongside your current job", "병행 검증"], [`Your current role stays the base while the new path is checked against real evidence.`, `${withKoreanParticle(optionA, "을/를")} 유지하면서, ${withKoreanParticle(optionB, "이/가")} 맞는지 실제 근거로 확인합니다.`], ["Assumption → direct check", "가정 → 직접 확인"], presentation.protects, ["External proof", "외부 근거"], ["One short checking period", "한 번의 짧은 확인 기간"]);

  if (safetyNeedsProtection || downsideNeedsProtection) add("resource", ["Build up your safety margin first", "자원 재구성"], ["Build up the room you need to protect before committing more.", "투입을 늘리기 전에 지켜야 할 여유부터 늘립니다."], ["Current room → protected room", "현재 여유 → 지켜야 할 여유"], [optionAProtection, optionAProtection], ["Time, funding, or support", "시간, 자금 또는 지원"], ["No irreversible decisions yet", "되돌릴 수 없는 결정은 아직 하지 않음"]);
  if (reversibilityNeedsProtection) add("timing", ["Adjust the timing", "시기 재구성"], ["The move date stays open until the way back is clearer.", "돌아올 길이 분명해질 때까지 옮기는 시점을 늦춥니다."], ["Fixed date → timing set by evidence", "정해 둔 날짜 → 근거를 보고 정하는 시점"], presentation.protects, ["A clear way back", "분명하게 확인한 돌아올 길"], ["Review before deciding", "확정하기 전에 다시 보기"]);
  return plays;
}

export function buildProductApplicationV3(input: ProductApplicationBuildInput): ProductApplicationV3 {
  const ko = input.language === "ko";
  const optionA = cleanOptionLabel(input.optionA);
  const optionB = cleanOptionLabel(input.optionB);
  const financialRoom = answer(input.answers, 19, ko ? "소득이 이어지는지, 어디까지 시도해 볼 수 있는지 먼저 확인해야 합니다." : "Whether your income continues, and how far you can afford to try, still need to be confirmed.");
  const recoveryPath = answer(input.answers, 20, ko ? "되돌릴 수 있는 순서로 움직이고, 돌아올 길을 남겨 둡니다." : "Move in an order you can undo, and keep a way back.");
  const downside = answer(input.answers, 21, ko ? "확인되기 전에는 되돌리기 어려운 지출이나 결정을 늘리지 않습니다." : "Do not add spending or decisions that are hard to reverse before the path is checked.");
  const missingValidation = answer(input.answers, 14, input.validationFocus);
  const internalReadiness = answer(input.answers, 17, ko ? "필요한 역량과 그것을 보여 줄 근거가 얼마나 준비됐는지 확인합니다." : "The required skills, and the evidence that shows them, still need to be made visible.");
  const constraint = answer(input.answers, 25, answer(input.answers, 3, input.primaryRiskMeaning));
  const optionAProtection = answer(input.answers, 6, ko ? `${withKoreanParticle(input.optionA.trim(), "은/는")} 지금의 기반과 새 경로를 확인할 시간을 지켜 줍니다.` : `Your current role protects your base and the time to check the new path.`);
  const optionBUpside = answer(input.answers, 9, ko ? `${withKoreanParticle(input.optionB.trim(), "은/는")} 새로운 커리어 가치를 열 수 있습니다.` : `The new path may open a new source of career value.`);
  const concise = casePresentation(input);

  // Structure is assembled first. Posture reads only canonical FIFWM and explicit
  // structural bands; wording never changes the result.
  const postureAssessment = derivePostureAssessment(input);
  const postureFamily = postureAssessment.effectivePosture;
  const guardrailConstraints = [
    ko ? "부족한 안전 여유" : "a limited safety margin",
    ...(input.structuralSignals.reversibility.band === "weak" ? [ko ? "돌아가기 어려운 상황" : "a hard way back"] : []),
    ...(input.structuralSignals.structuralRisk.band === "high" ? [ko ? "큰 손실 위험" : "a high potential loss"] : []),
  ];
  const guardrailConstraintText = guardrailConstraints.length > 2
    ? `${guardrailConstraints.slice(0, -1).join(", ")}${ko ? " 및 " : ", and "}${guardrailConstraints.at(-1)}`
    : ko && guardrailConstraints.length === 2
      ? `${withKoreanParticle(guardrailConstraints[0], "과/와")} ${guardrailConstraints[1]}`
      : guardrailConstraints.join(" and ");
  const guardrailExplanation = postureAssessment.guardrailApplied
    ? (ko
        ? `${optionB} 쪽 기회를 뒷받침하는 근거는 있습니다. 다만 ${guardrailConstraintText} 때문에 한 번에 크게 옮기기는 어렵습니다. 지금 판단은 본격적으로 옮기기 전에, 배우고 다시 시도할 여유부터 지키는 쪽입니다.`
        : `There is evidence of opportunity on the new path. But ${guardrailConstraintText} limit how far you can move at once. The current reading is to protect room to learn and try again before moving further.`)
    : "";
  const currentStructuralPosture = postureFamily === "transition"
    ? {
        label: ko ? "더 강해진 전환 근거" : "Stronger Transition Case",
        sentence: ko ? `지금 조건에서는 ${optionB} 쪽 근거가 더 강해졌습니다. 다만 한 번에 옮기기보다 단계적으로 옮겨 가는 편이 가장 잘 뒷받침됩니다.` : `Current conditions give stronger support for the new path. Moving in stages, rather than all at once, is the best-supported way.`,
      }
    : postureFamily === "reconfigure"
      ? {
          label: ko ? "기반을 보호하며 재구성" : "Protect and Reconfigure",
          sentence: ko ? `지금 조건에서는 다시 일어설 여유와 현재 선택지를 지키면서, 작은 변화로 ${optionB}의 핵심 가능성을 확인하도록 경로를 조정하는 편이 더 잘 뒷받침됩니다.` : `Current conditions better support protecting your room to recover and your current options, while adjusting the path to check what matters most on the new path through small changes.`,
        }
      : {
          label: ko ? "보존하며 검증" : "Preserve and Validate",
          sentence: postureAssessment.guardrailApplied
            ? guardrailExplanation
            : ko ? `지금 조건에서는 ${optionA}의 기반을 지키면서 ${optionB}의 외부 근거를 확인하는 방향이 더 잘 뒷받침됩니다.` : `Current conditions better support keeping your current role while checking the outside evidence for the new path.`,
        };

  const decisionSwitches = input.decisionConditions.slice(0, 3).map((signal, index) => ({
    signal,
    direction: postureAssessment.guardrailApplied
      ? (ko
          ? `이 조건이 달라지면 ${optionB} 쪽 기회 근거와 손실 위험을 함께 다시 봅니다. 더 본격적으로 옮기는 것은 근거가 뒷받침하고 ${withKoreanParticle(guardrailConstraintText, "을/를")} 보완할 방법이 확인될 때에야 더 본격적으로 옮기는 것을 검토할 조건이 됩니다.`
          : `If this condition changes, look again at the opportunity evidence for the new path and the potential loss together. Moving further becomes worth considering only once the evidence supports it and a way to cover ${guardrailConstraintText} is confirmed.`)
      : postureFamily === "transition"
      ? (ko ? `${optionB} 쪽 근거가 유지되면 단계적으로 옮겨 가는 쪽이 계속 뒷받침되고, 약해지면 현재 기반을 지키는 쪽으로 판단이 돌아갑니다.` : `If it holds, moving in stages stays better supported; if it weakens, the reading shifts back toward protecting your current base.`)
      : (input.decisionConditionSides?.[index] ? input.decisionConditionSides[index] === "B" : index < 2)
        ? (ko ? `이 조건이 맞으면 ${optionB} 쪽으로 단계적으로 옮겨 가는 데 힘이 실립니다.` : `If this holds, moving in stages becomes better supported.`)
        : (ko ? `이 조건이 맞으면 ${optionA}의 기반을 지키며 확인하는 쪽이 더 잘 뒷받침됩니다.` : `If this holds, keeping your base in your current role is better supported.`),
  }));

  const changingPlays = deriveChangingPlays(input, concise, missingValidation, optionAProtection);

  const safetyReading = input.structuralSignals.safetyMargin.band === "strong"
    ? (ko ? "안전 여유는 다시 방향을 바꿀 수 있는 여지를 지켜 줍니다. 지금 조건에서는 작은 단계로 시도하고, 배우고, 다시 선택할 여유가 있습니다." : "Your safety margin protects room to change course. Under current conditions you have room to try in small steps, learn, recover and choose again.")
    : input.structuralSignals.safetyMargin.band === "weak"
      ? (ko ? "안전 여유는 다시 방향을 바꿀 수 있는 여지를 지켜 줍니다. 지금 조건이 변화를 막지는 않습니다. 다만 일이 틀어져도 다시 시도할 수 있도록, 한 번에 감수할 부담을 작게 잡으세요." : "Your safety margin protects room to change course. Current conditions do not rule out change. But keep the risk you take on at any one time small, so you can recover and try again.")
      : input.structuralSignals.safetyMargin.band === "unknown"
        ? (ko ? "안전 여유가 아직 확인되지 않았습니다. 투입을 늘리기 전에 재정 여유와 일이 틀어져도 버틸 여유를 먼저 확인하세요." : "Your safety margin is not yet established. Before committing more, check your financial room and your room to absorb a setback.")
        : (ko ? "안전 여유는 더 안전한 선택을 고르는 기준이 아닙니다. 다시 방향을 바꿀 수 있는 여지를 지켜 주는 조건입니다." : "Your safety margin is not about picking the safer option. It protects room to change course.");

  return {
    analysisSequence: AMC_ANALYSIS_SEQUENCE,
    presentation: {
      postureKeyword: currentStructuralPosture.label,
      missingPointKeyword: concise.missing[ko ? 1 : 0],
      safetyMarginKeyword: input.structuralSignals.safetyMargin.band === "strong" ? "Strong"
        : input.structuralSignals.safetyMargin.band === "developing" ? "Developing"
          : input.structuralSignals.safetyMargin.band === "weak" ? (ko ? "부족함" : "Limited")
            : (ko ? "아직 확인되지 않음" : "Not Yet Established"),
      coreTradeoffKeyword: concise.tension[ko ? 1 : 0],
      nextTestKeyword: concise.nextTest[ko ? 1 : 0],
      missingPointSummary: input.missingPoint,
      decisionStructure: {
        optionA, optionAProtects: concise.protects[ko ? 1 : 0], optionB, optionBOpens: concise.opens[ko ? 1 : 0],
        coreTension: concise.tension[ko ? 1 : 0], keyConstraint: concise.constraint[ko ? 1 : 0],
        externalEvidence: input.structuralSignals.externalValidation.source === "live-external-evidence"
          ? (ko ? "현재 외부 근거 확인됨" : "Current evidence reviewed") : (ko ? "외부 근거 미확인" : "Evidence not yet verified"),
      },
    },
    decisionStructure: {
      fifwm: input.fifwm,
      fifwmSource: input.fifwmSource,
      insideReality: `${internalReadiness} ${answer(input.answers, 18, "")}`.trim(),
      outsideEvidence: input.externalImplication,
      constraints: constraint,
      tradeOffs: `${optionAProtection} ${optionBUpside}`,
    },
    missingPoint: `${input.missingPoint} ${input.missingPointWhy}`,
    currentStructuralPosture,
    postureEvidenceCoverage: deriveEvidenceCoverage(input),
    postureBasis: input.structuralSignals,
    why: {
      topDrivers: [guardrailExplanation || optionAProtection, input.externalImplication, internalReadiness].filter(Boolean).slice(0, 3),
      biggestRisk: `${input.primaryRisk}: ${input.primaryRiskMeaning}`,
      strongestCounterargument: ko
        ? (postureFamily === "transition" ? `이 판단에 대한 가장 강한 반론: ${optionAProtection}` : `이 판단에 대한 가장 강한 반론: ${optionBUpside}`)
        : postureFamily === "transition"
          ? `The strongest case against this reading is that ${optionAProtection.charAt(0).toLowerCase()}${optionAProtection.slice(1)}`
          : `The strongest case against this reading is that ${optionBUpside.charAt(0).toLowerCase()}${optionBUpside.slice(1)}`,
    },
    changingPlays,
    safetyMargin: {
      band: input.structuralSignals.safetyMargin.band,
      source: input.structuralSignals.safetyMargin.source,
      inputs: input.safetyMarginInputs,
      reading: safetyReading,
      financialRoomReading: financialRoom,
      recoveryReentryReading: recoveryPath,
      downsideExposureReading: downside,
      roomToBeWrong: `${financialRoom} ${recoveryPath}`,
      strongestProtection: optionAProtection,
      weakestMargin: downside,
      protectedCapacity: ko ? "끊기지 않는 소득, 다시 일어설 여유, 배우고 다시 시도할 힘" : "Steady income, room to recover, and the ability to learn and try again",
      exposureBoundary: downside,
    },
    decisionSwitches,
    nextStepExperiment: {
      whatToTest: input.validationFocus,
      buildOrLearn: internalReadiness,
      evidenceToCollect: missingValidation,
      exposureBoundary: downside,
      continueCondition: postureAssessment.guardrailApplied
        ? (ko
            ? `${decisionSwitches[0]?.signal || input.validationFocus} 더 본격적으로 옮기려면 ${withKoreanParticle(guardrailConstraintText, "을/를")} 다시 확인하고 보완할 방법도 갖춰야 합니다.`
            : `${decisionSwitches[0]?.signal || input.validationFocus} Moving further also requires ${guardrailConstraintText} to be rechecked and covered.`)
        : decisionSwitches[0]?.signal || input.validationFocus,
      pauseCondition: postureAssessment.guardrailApplied
        ? (ko
            ? `확인 단계가 미리 정한 한도를 넘거나 다시 일어설 여유를 줄이면, 그 단계를 멈추거나 다시 설계하세요. 지킬 범위가 확인됐다면 그 안에서는 작게 확인하고 배우는 일을 이어 가도 됩니다. 그 범위가 아직 분명하지 않다면 그것부터 정하세요.`
            : `Pause or redesign the step if it goes beyond the limit you set or reduces your room to recover. Small checks and learning can continue within the protection you have confirmed. If that protection is not yet clear, set it first.`)
        : ko ? `근거가 생기기 전에 이 과정이 지켜야 할 여유를 줄이면 멈추거나 다시 설계하세요. 지켜야 할 여유: ${financialRoom}` : `Pause or redesign if this step eats into the room you are protecting before real evidence appears. Room to protect: ${financialRoom}`,
      reassessAt: ko ? "각 확인 단계가 끝날 때와 투입을 늘리기 전에 현재 판단을 다시 봅니다." : "Revisit the current reading at the end of each stage and before committing more.",
      stages: input.plan,
    },
  };
}
