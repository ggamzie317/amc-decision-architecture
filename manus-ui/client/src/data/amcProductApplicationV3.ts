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
    fifwmSource: "canonical-current-case" | "unavailable";
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
  fifwmSource: "canonical-current-case" | "unavailable";
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

function fifwmScore(value: unknown): 0 | 1 | 2 | null {
  const numeric = typeof value === "number" ? value : Number(value);
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

function derivePostureFamily(input: ProductApplicationBuildInput) {
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
  if (support >= 8) return "transition" as const;
  if (support <= 1) return "reconfigure" as const;
  return "validate" as const;
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
    missing: ["Unused internal value", "활용하지 않은 내부 가치"], protects: ["Income and position", "소득과 현재 위치"],
    opens: ["Renewed career value", "새로운 커리어 가치"], tension: ["Internal redesign ↔ exit", "내부 재설계 ↔ 퇴사"],
    constraint: ["Role redesign access", "역할 재설계 가능성"], nextTest: ["Test role redesign", "역할 재설계 검증"],
  },
  "MBA / EMBA / PhD Decision": {
    missing: ["Alternative access routes", "대안 접근 경로"], protects: ["Time and capital", "시간과 자본"],
    opens: ["Credibility and access", "신뢰도와 접근성"], tension: ["Degree value ↔ opportunity cost", "학위 가치 ↔ 기회비용"],
    constraint: ["Time and total cost", "시간과 총비용"], nextTest: ["Validate program advantage", "프로그램 차별성 검증"],
  },
  "Overseas Relocation": {
    missing: ["Destination operating fit", "현지 생활 적합성"], protects: ["Current operating base", "현재 생활 기반"],
    opens: ["Global career options", "글로벌 커리어 선택지"], tension: ["Career upside ↔ relocation load", "커리어 기회 ↔ 이동 부담"],
    constraint: ["Visa and family fit", "비자와 가족 적합성"], nextTest: ["Validate destination fit", "현지 적합성 검증"],
  },
  Entrepreneurship: {
    missing: ["Repeatable paid demand", "반복 가능한 지불 수요"], protects: ["Income continuity", "소득 연속성"],
    opens: ["Founder-led value", "창업가 주도 가치"], tension: ["Market upside ↔ income continuity", "시장 기회 ↔ 소득 연속성"],
    constraint: ["Runway and delivery load", "소득 여유와 제공 부담"], nextTest: ["Run a bounded paid pilot", "제한된 유료 Pilot 검증"],
  },
  "Industry Transition": {
    missing: ["Transferable proof", "전환 가능한 성과 근거"], protects: ["Established career capital", "기존 커리어 자산"],
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
    missing: ["Family operating fit", "가족 생활 적합성"], protects: ["Family stability", "가족의 안정성"],
    opens: ["Preferred career path", "선호하는 커리어 경로"], tension: ["Career upside ↔ family fit", "커리어 기회 ↔ 가족 적합성"],
    constraint: ["Location and support", "지역과 지원 체계"], nextTest: ["Test family-compatible path", "가족 적합 경로 검증"],
  },
  "General Career Reconfiguration": {
    missing: ["The real decision condition", "실제 결정 조건"], protects: ["Current stability", "현재의 안정성"],
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

  if (roleScopeEligible && hasKnownTrigger) add("role-scope", ["Role / Scope Reconfiguration", "역할 / 범위 재구성"], [`Test whether ${optionA} can be redesigned before treating departure as necessary.`, `${optionA}를 유지하면서 역할과 범위를 재설계할 수 있는지 먼저 검증합니다.`], ["Exit decision → role redesign test", "퇴사 결정 → 역할 재설계 검증"], presentation.protects, ["A concrete scope proposal", "구체적인 역할 범위 제안"], ["One internal decision cycle", "한 번의 내부 결정 주기"]);
  else if (pathwayEligible && (externalNeedsValidation || reversibilityNeedsProtection)) add("pathway", ["Pathway Reconfiguration", "경로 재구성"], [`Test an intermediate route that can create evidence for ${optionB} before full conversion.`, `${optionB}로 완전히 전환하기 전에 근거를 만들 수 있는 중간 경로를 검증합니다.`], ["Direct conversion → intermediate route", "직접 전환 → 중간 경로"], presentation.protects, ["Comparable outcome evidence", "비교 가능한 결과 근거"], ["One bounded pathway test", "한 번의 제한된 경로 검증"]);
  else if (externalNeedsValidation) add("parallel-validation", ["Parallel Validation", "병행 검증"], [`Keep ${optionA} as the base while testing ${optionB} with real evidence.`, `${optionA}를 기반으로 유지하면서 실제 근거로 ${optionB}를 검증합니다.`], ["Assumption → observable test", "가정 → 관찰 가능한 검증"], presentation.protects, ["External proof", "외부 근거"], ["One bounded validation cycle", "한 번의 제한된 검증 주기"]);

  if (safetyNeedsProtection || downsideNeedsProtection) add("resource", ["Resource Reconfiguration", "자원 재구성"], ["Increase protected capacity before increasing commitment.", "몰입을 늘리기 전에 보호된 여력을 강화합니다."], ["Current capacity → protected capacity", "현재 여력 → 보호된 여력"], [optionAProtection, optionAProtection], ["Time, funding, or support", "시간, 자금 또는 지원"], ["No irreversible exposure yet", "아직 되돌릴 수 없는 노출 없음"]);
  if (reversibilityNeedsProtection) add("timing", ["Timing Reconfiguration", "시기 재구성"], ["Move the commitment point until the recovery path is clearer.", "회복 경로가 명확해질 때까지 확정 시점을 조정합니다."], ["Fixed date → evidence-led timing", "고정된 시점 → 근거 기반 시기"], presentation.protects, ["A clear recovery path", "명확한 회복 경로"], ["Review before commitment", "확정 전 재검토"]);
  return plays;
}

export function buildProductApplicationV3(input: ProductApplicationBuildInput): ProductApplicationV3 {
  const ko = input.language === "ko";
  const optionA = cleanOptionLabel(input.optionA);
  const optionB = cleanOptionLabel(input.optionB);
  const financialRoom = answer(input.answers, 19, ko ? "소득 연속성과 감당 가능한 실험 범위를 먼저 확인해야 합니다." : "Income continuity and a tolerable test boundary still need to be confirmed.");
  const recoveryPath = answer(input.answers, 20, ko ? "되돌릴 수 있는 순서와 회복 경로를 유지합니다." : "Keep a reversible sequence and a credible recovery path.");
  const downside = answer(input.answers, 21, ko ? "검증 전에 회복하기 어려운 노출을 늘리지 않습니다." : "Do not increase hard-to-recover exposure before validation.");
  const missingValidation = answer(input.answers, 14, input.validationFocus);
  const internalReadiness = answer(input.answers, 17, ko ? "필요한 역량과 증거의 준비 수준을 확인합니다." : "The required capability and proof still need to be made visible.");
  const constraint = answer(input.answers, 25, answer(input.answers, 3, input.primaryRiskMeaning));
  const optionAProtection = answer(input.answers, 6, ko ? `${input.optionA}는 현재 기반과 검증 시간을 보호합니다.` : `${input.optionA} protects the current base and time to validate.`);
  const optionBUpside = answer(input.answers, 9, ko ? `${input.optionB}는 새로운 커리어 가치를 열 수 있습니다.` : `${input.optionB} may open a new source of career value.`);
  const concise = casePresentation(input);

  // Structure is assembled first. Posture reads only canonical FIFWM and explicit
  // structural bands; wording never changes the result.
  const postureFamily = derivePostureFamily(input);
  const currentStructuralPosture = postureFamily === "transition"
    ? {
        label: ko ? "더 강해진 전환 근거" : "Stronger Transition Case",
        sentence: ko ? `현재 구조에서는 ${optionB}의 근거가 더 강해졌지만, 노출을 한 번에 늘리기보다 단계적으로 전환하는 자세가 가장 잘 뒷받침됩니다.` : `The current structure supports a stronger case for ${optionB}, with commitment increasing in stages rather than all at once.`,
      }
    : postureFamily === "reconfigure"
      ? {
          label: ko ? "유지하며 재구성" : "Stay and Reconfigure",
          sentence: ko ? `현재 구조는 ${optionA}를 유지하되, ${optionB}의 핵심 가능성을 내부 역할과 제한된 실험으로 재구성하는 자세를 더 강하게 뒷받침합니다.` : `The current structure better supports Option A — ${optionA} — while reconfiguring it to test the most valuable elements of ${optionB}.`,
        }
      : {
          label: ko ? "보존하며 검증" : "Preserve and Validate",
          sentence: ko ? `현재 구조는 ${optionA}의 기반을 보존하면서 ${optionB}의 외부 근거를 검증하는 방향을 더 강하게 뒷받침합니다.` : `The current structure better supports Option A — ${optionA} — while validating the external case for ${optionB}.`,
        };

  const decisionSwitches = input.decisionConditions.slice(0, 3).map((signal, index) => ({
    signal,
    direction: postureFamily === "transition"
      ? (ko ? `${optionB} 근거가 유지되면 단계적 몰입을 계속 뒷받침하고, 약해지면 노출을 줄여 현재 기반을 다시 보호합니다.` : `If it holds, it supports continued staged commitment to ${optionB}; if it weakens, reduce exposure and restore protection around the current base.`)
      : index < 2
        ? (ko ? `확인되면 ${optionB}에 대한 단계적 몰입이 더 설명 가능해집니다.` : `If observed, a staged increase in commitment to ${optionB} becomes more defensible.`)
        : (ko ? `약해지면 현재 자세를 재평가하고 ${optionA}의 보호 범위를 넓힙니다.` : `If it weakens, reassess the posture and expand the protection retained in ${optionA}.`),
  }));

  const changingPlays = deriveChangingPlays(input, concise, missingValidation, optionAProtection);

  const safetyReading = input.structuralSignals.safetyMargin.band === "strong"
    ? (ko ? "Safety Margin은 다시 바꿀 수 있는 공간을 보호합니다. 현재 구조는 제한된 실험을 가능하게 하며, 시도하고 배우고 회복해 다시 선택할 여지를 지킵니다." : "Safety Margin protects the space to change. The current structure enables bounded experimentation by preserving room to try, learn, recover, and choose again.")
    : input.structuralSignals.safetyMargin.band === "weak"
      ? (ko ? "Safety Margin은 다시 바꿀 수 있는 공간을 보호합니다. 현재 구조는 변화를 막지는 않지만, 회복과 재시도 역량을 위해 노출 경계를 좁혀야 합니다." : "Safety Margin protects the space to change. The current structure does not prohibit experimentation, but it constrains exposure so recovery and retry capacity remain protected.")
      : input.structuralSignals.safetyMargin.band === "unknown"
        ? (ko ? "Safety Margin이 아직 확인되지 않았습니다. 노출을 늘리기 전에 재정 여유와 회복 역량을 명확히 하세요. Safety Margin은 다시 바꿀 수 있는 공간을 보호합니다." : "Safety Margin is not yet established. Clarify financial room and recovery capacity before increasing exposure. Safety Margin protects the space to change.")
        : (ko ? "Safety Margin은 더 안전한 선택을 고르는 것이 아니라 다시 바꿀 수 있는 공간을 보호합니다." : "Safety Margin protects the space to change; it does not simply identify the safer option.");

  return {
    analysisSequence: AMC_ANALYSIS_SEQUENCE,
    presentation: {
      postureKeyword: currentStructuralPosture.label,
      missingPointKeyword: concise.missing[ko ? 1 : 0],
      safetyMarginKeyword: input.structuralSignals.safetyMargin.band === "strong" ? "Strong"
        : input.structuralSignals.safetyMargin.band === "developing" ? "Developing"
          : input.structuralSignals.safetyMargin.band === "weak" ? (ko ? "제약됨" : "Constrained")
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
      topDrivers: [optionAProtection, input.externalImplication, internalReadiness].filter(Boolean).slice(0, 3),
      biggestRisk: `${input.primaryRisk}: ${input.primaryRiskMeaning}`,
      strongestCounterargument: ko
        ? (postureFamily === "transition" ? `이 자세에 대한 가장 강한 반론은 ${optionAProtection}` : `이 자세에 대한 가장 강한 반론은 ${optionBUpside}`)
        : postureFamily === "transition"
          ? `The strongest case against this posture is that ${optionAProtection.charAt(0).toLowerCase()}${optionAProtection.slice(1)}`
          : `The strongest case against this posture is that ${optionBUpside.charAt(0).toLowerCase()}${optionBUpside.slice(1)}`,
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
      protectedCapacity: ko ? "소득 연속성, 회복 가능성, 학습과 재시도 역량" : "Income continuity, recovery capacity, and the ability to learn and retry",
      exposureBoundary: downside,
    },
    decisionSwitches,
    nextStepExperiment: {
      whatToTest: input.validationFocus,
      buildOrLearn: internalReadiness,
      evidenceToCollect: missingValidation,
      exposureBoundary: downside,
      continueCondition: decisionSwitches[0]?.signal || input.validationFocus,
      pauseCondition: ko ? `근거가 생기기 전에 ${financialRoom}을 약화시키는 경우 중단하거나 재설계합니다.` : `Pause or redesign if the test weakens this protected room before credible evidence appears: ${financialRoom}`,
      reassessAt: ko ? "각 검증 단계가 끝날 때, 그리고 노출을 확대하기 전에 현재 구조적 자세를 다시 봅니다." : "Reassess the Current Structural Posture at the end of each stage and before increasing exposure.",
      stages: input.plan,
    },
  };
}
