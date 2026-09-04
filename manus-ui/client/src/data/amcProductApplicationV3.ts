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
  move: string;
  changes: string;
  optionStrengthened: string;
  evidence: string;
  timeExposure: string;
};

export type ProductApplicationV3 = {
  analysisSequence: typeof AMC_ANALYSIS_SEQUENCE;
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
  changingMoves: string[];
  primaryRisk: string;
  primaryRiskMeaning: string;
  decisionConditions: string[];
  validationFocus: string;
  externalImplication: string;
  plan: Array<{ period: string; title: string; action: string; output: string }>;
};

const answer = (answers: Record<number, string>, id: number, fallback: string) =>
  answers[id]?.trim() || fallback;

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

export function buildProductApplicationV3(input: ProductApplicationBuildInput): ProductApplicationV3 {
  const ko = input.language === "ko";
  const financialRoom = answer(input.answers, 19, ko ? "소득 연속성과 감당 가능한 실험 범위를 먼저 확인해야 합니다." : "Income continuity and a tolerable test boundary still need to be confirmed.");
  const recoveryPath = answer(input.answers, 20, ko ? "되돌릴 수 있는 순서와 회복 경로를 유지합니다." : "Keep a reversible sequence and a credible recovery path.");
  const downside = answer(input.answers, 21, ko ? "검증 전에 회복하기 어려운 노출을 늘리지 않습니다." : "Do not increase hard-to-recover exposure before validation.");
  const missingValidation = answer(input.answers, 14, input.validationFocus);
  const internalReadiness = answer(input.answers, 17, ko ? "필요한 역량과 증거의 준비 수준을 확인합니다." : "The required capability and proof still need to be made visible.");
  const constraint = answer(input.answers, 25, answer(input.answers, 3, input.primaryRiskMeaning));
  const optionAProtection = answer(input.answers, 6, ko ? `${input.optionA}는 현재 기반과 검증 시간을 보호합니다.` : `${input.optionA} protects the current base and time to validate.`);
  const optionBUpside = answer(input.answers, 9, ko ? `${input.optionB}는 새로운 커리어 가치를 열 수 있습니다.` : `${input.optionB} may open a new source of career value.`);

  // Structure is assembled first. Posture reads only canonical FIFWM and explicit
  // structural bands; wording never changes the result.
  const postureFamily = derivePostureFamily(input);
  const currentStructuralPosture = postureFamily === "transition"
    ? {
        label: ko ? "더 강해진 전환 근거" : "Stronger Transition Case",
        sentence: ko ? `현재 구조에서는 ${input.optionB}의 근거가 더 강해졌지만, 노출을 한 번에 늘리기보다 단계적으로 전환하는 자세가 가장 잘 뒷받침됩니다.` : `The current structure supports a stronger case for ${input.optionB}, with commitment increasing in stages rather than all at once.`,
      }
    : postureFamily === "reconfigure"
      ? {
          label: ko ? "유지하며 재구성" : "Stay and Reconfigure",
          sentence: ko ? `현재 구조는 ${input.optionA}를 유지하되, ${input.optionB}의 핵심 가능성을 내부 역할과 제한된 실험으로 재구성하는 자세를 더 강하게 뒷받침합니다.` : `The current structure better supports retaining ${input.optionA} while reconfiguring it to test the most valuable elements of ${input.optionB}.`,
        }
      : {
          label: ko ? "보존하며 검증" : "Preserve and Validate",
          sentence: ko ? `현재 구조는 ${input.optionA}의 기반을 보존하면서 ${input.optionB}의 외부 근거를 검증하는 방향을 더 강하게 뒷받침합니다.` : `The current structure better supports preserving ${input.optionA} while validating the external case for ${input.optionB}.`,
        };

  const decisionSwitches = input.decisionConditions.slice(0, 3).map((signal, index) => ({
    signal,
    direction: postureFamily === "transition"
      ? (ko ? `${input.optionB} 근거가 유지되면 단계적 몰입을 계속 뒷받침하고, 약해지면 노출을 줄여 현재 기반을 다시 보호합니다.` : `If it holds, it supports continued staged commitment to ${input.optionB}; if it weakens, reduce exposure and restore protection around the current base.`)
      : index < 2
        ? (ko ? `확인되면 ${input.optionB}에 대한 단계적 몰입이 더 설명 가능해집니다.` : `If observed, a staged increase in commitment to ${input.optionB} becomes more defensible.`)
        : (ko ? `약해지면 현재 자세를 재평가하고 ${input.optionA}의 보호 범위를 넓힙니다.` : `If it weakens, reassess the posture and expand the protection retained in ${input.optionA}.`),
  }));

  const changingPlays = input.changingMoves.map((move) => move.trim()).filter(Boolean).slice(0, 3).map((move) => ({
    move,
    changes: ko ? "현재의 이분법적 선택을 되돌릴 수 있는 증거 생성 과정으로 바꿉니다." : "Changes a binary choice into a reversible evidence-building sequence.",
    optionStrengthened: input.optionB,
    evidence: missingValidation,
    timeExposure: ko ? "현재 기반을 유지하는 제한된 검증 기간" : "A bounded validation period while the current base remains protected",
  }));

  const safetyReading = input.structuralSignals.safetyMargin.band === "strong"
    ? (ko ? "Safety Margin은 다시 바꿀 수 있는 공간을 보호합니다. 현재 구조는 제한된 실험을 가능하게 하며, 시도하고 배우고 회복해 다시 선택할 여지를 지킵니다." : "Safety Margin protects the space to change. The current structure enables bounded experimentation by preserving room to try, learn, recover, and choose again.")
    : input.structuralSignals.safetyMargin.band === "weak"
      ? (ko ? "Safety Margin은 다시 바꿀 수 있는 공간을 보호합니다. 현재 구조는 변화를 막지는 않지만, 회복과 재시도 역량을 위해 노출 경계를 좁혀야 합니다." : "Safety Margin protects the space to change. The current structure does not prohibit experimentation, but it constrains exposure so recovery and retry capacity remain protected.")
      : input.structuralSignals.safetyMargin.band === "unknown"
        ? (ko ? "Safety Margin은 다시 바꿀 수 있는 공간을 보호합니다. 현재 사례의 재정 여유, 회복 경로, 재시도 역량이 구조적으로 확인되지 않았으므로 안전하다고 가정하지 않습니다." : "Safety Margin protects the space to change. Financial room, recovery path, and retry capacity are not yet available as structured current-case evidence, so Safety Margin is not assumed safe.")
        : (ko ? "Safety Margin은 더 안전한 선택을 고르는 것이 아니라 다시 바꿀 수 있는 공간을 보호합니다." : "Safety Margin protects the space to change; it does not simply identify the safer option.");

  return {
    analysisSequence: AMC_ANALYSIS_SEQUENCE,
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
