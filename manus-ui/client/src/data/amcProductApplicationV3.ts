export const AMC_ANALYSIS_SEQUENCE = [
  "User Input",
  "Live External Evidence",
  "FIFWM / Decision Structure",
  "What You May Be Missing",
  "Current Structural Posture",
  "Changing",
  "Safety Margin",
  "Decision Switches",
  "Next Experiment",
] as const;

export type ChangingPlay = {
  move: string;
  changes: string;
  optionStrengthened: string;
  evidence: string;
  timeExposure: string;
};

export type ProductApplicationV3 = {
  analysisSequence: typeof AMC_ANALYSIS_SEQUENCE;
  fifwm: {
    insideReality: string;
    outsideEvidence: string;
    constraints: string;
    tradeOff: string;
  };
  missingPoint: string;
  currentStructuralPosture: { label: string; sentence: string };
  why: {
    topDrivers: string[];
    biggestRisk: string;
    strongestCounterargument: string;
  };
  changingPlays: ChangingPlay[];
  safetyMargin: {
    reading: string;
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
  missingPoint: string;
  missingPointWhy: string;
  changingMove: string;
  primaryRisk: string;
  primaryRiskMeaning: string;
  decisionConditions: string[];
  validationFocus: string;
  externalImplication: string;
  plan: Array<{ period: string; title: string; action: string; output: string }>;
};

const answer = (answers: Record<number, string>, id: number, fallback: string) =>
  answers[id]?.trim() || fallback;

const positiveEvidencePattern = /\b(validated|paid|confirmed|secured|repeatable|credible|funded|ready|sufficient|strong demand|months? (?:of )?runway)\b|검증|유료|확인|확보|충분|준비|반복 가능|수요/i;
const negativeEvidencePattern = /\b(not yet|no |none|unclear|unknown|limited|insufficient|without|missing|weak|unvalidated|need(?:s|ed)? to)\b|아직|없|부족|불확실|미검증|필요/i;

function evidenceSignal(value: string) {
  let signal = 0;
  if (positiveEvidencePattern.test(value)) signal += 1;
  if (negativeEvidencePattern.test(value)) signal -= 1;
  return signal;
}

export function buildProductApplicationV3(input: ProductApplicationBuildInput): ProductApplicationV3 {
  const ko = input.language === "ko";
  const financialRoom = answer(
    input.answers,
    19,
    ko ? "소득 연속성과 감당 가능한 실험 범위를 먼저 확인해야 합니다." : "Income continuity and a tolerable test boundary still need to be confirmed.",
  );
  const recoveryPath = answer(
    input.answers,
    20,
    ko ? "되돌릴 수 있는 순서와 회복 경로를 유지합니다." : "Keep a reversible sequence and a credible recovery path.",
  );
  const downside = answer(
    input.answers,
    21,
    ko ? "검증 전에 회복하기 어려운 노출을 늘리지 않습니다." : "Do not increase hard-to-recover exposure before validation.",
  );
  const missingValidation = answer(input.answers, 14, input.validationFocus);
  const internalReadiness = answer(
    input.answers,
    17,
    ko ? "필요한 역량과 증거의 준비 수준을 확인합니다." : "The required capability and proof still need to be made visible.",
  );
  const constraint = answer(input.answers, 25, answer(input.answers, 3, input.primaryRiskMeaning));
  const optionAProtection = answer(
    input.answers,
    6,
    ko ? `${input.optionA}는 현재 기반과 검증 시간을 보호합니다.` : `${input.optionA} protects the current base and time to validate.`,
  );
  const optionBUpside = answer(
    input.answers,
    9,
    ko ? `${input.optionB}는 새로운 커리어 가치를 열 수 있습니다.` : `${input.optionB} may open a new source of career value.`,
  );

  // Posture is intentionally derived only after the structural inputs above have
  // been assembled. It is a reading of the evidence, never the starting verdict.
  const transitionSupport =
    evidenceSignal(missingValidation) * 2 +
    evidenceSignal(internalReadiness) * 2 +
    evidenceSignal(financialRoom) +
    evidenceSignal(recoveryPath) +
    evidenceSignal(input.externalImplication);
  const postureFamily = transitionSupport >= 5 ? "transition" : transitionSupport <= -4 ? "reconfigure" : "validate";
  const currentStructuralPosture = postureFamily === "transition"
    ? {
        label: ko ? "더 강해진 전환 근거" : "Stronger Transition Case",
        sentence: ko
          ? `현재 구조에서는 ${input.optionB}의 근거가 더 강해졌지만, 노출을 한 번에 늘리기보다 단계적으로 전환하는 자세가 가장 잘 뒷받침됩니다.`
          : `The current structure supports a stronger case for ${input.optionB}, with commitment increasing in stages rather than all at once.`,
      }
    : postureFamily === "reconfigure"
      ? {
          label: ko ? "유지하며 재구성" : "Stay and Reconfigure",
          sentence: ko
            ? `현재 구조는 ${input.optionA}를 유지하되, ${input.optionB}의 핵심 가능성을 내부 역할과 제한된 실험으로 재구성하는 자세를 더 강하게 뒷받침합니다.`
            : `The current structure better supports retaining ${input.optionA} while reconfiguring it to test the most valuable elements of ${input.optionB}.`,
        }
      : {
          label: ko ? "보존하며 검증" : "Preserve and Validate",
          sentence: ko
            ? `현재 구조는 ${input.optionA}의 기반을 보존하면서 ${input.optionB}의 외부 근거를 검증하는 방향을 더 강하게 뒷받침합니다.`
            : `The current structure better supports preserving ${input.optionA} while validating the external case for ${input.optionB}.`,
        };

  const decisionSwitches = input.decisionConditions.slice(0, 3).map((signal, index) => ({
    signal,
    direction:
      postureFamily === "transition"
        ? ko
          ? `유지되면 ${input.optionB}에 대한 단계적 몰입을 계속 뒷받침하고, 약해지면 노출을 줄여 현재 기반을 다시 보호합니다.`
          : `If it holds, it supports continued staged commitment to ${input.optionB}; if it weakens, reduce exposure and restore protection around the current base.`
        : index < 2
        ? ko
          ? `확인되면 ${input.optionB}에 대한 단계적 몰입이 더 설명 가능해집니다.`
          : `If observed, a staged increase in commitment to ${input.optionB} becomes more defensible.`
        : ko
          ? `약해지면 현재 자세를 재평가하고 ${input.optionA}의 보호 범위를 넓힙니다.`
          : `If it weakens, reassess the posture and expand the protection retained in ${input.optionA}.`,
  }));

  return {
    analysisSequence: AMC_ANALYSIS_SEQUENCE,
    fifwm: {
      insideReality: `${internalReadiness} ${answer(input.answers, 18, "")}`.trim(),
      outsideEvidence: input.externalImplication,
      constraints: constraint,
      tradeOff: `${optionAProtection} ${optionBUpside}`,
    },
    missingPoint: `${input.missingPoint} ${input.missingPointWhy}`,
    currentStructuralPosture,
    why: {
      topDrivers: [optionAProtection, input.externalImplication, internalReadiness].filter(Boolean).slice(0, 3),
      biggestRisk: `${input.primaryRisk}: ${input.primaryRiskMeaning}`,
      strongestCounterargument: ko
        ? postureFamily === "transition"
          ? `이 자세에 대한 가장 강한 반론은 ${optionAProtection}`
          : `이 자세에 대한 가장 강한 반론은 ${optionBUpside}`
        : postureFamily === "transition"
          ? `The strongest case against this posture is that ${optionAProtection.charAt(0).toLowerCase()}${optionAProtection.slice(1)}`
          : `The strongest case against this posture is that ${optionBUpside.charAt(0).toLowerCase()}${optionBUpside.slice(1)}`,
    },
    changingPlays: [
      {
        move: input.changingMove,
        changes: ko
          ? "현재의 이분법적 선택을 되돌릴 수 있는 증거 생성 과정으로 바꿉니다."
          : "Changes a binary choice into a reversible evidence-building sequence.",
        optionStrengthened: input.optionB,
        evidence: missingValidation,
        timeExposure: ko
          ? "현재 기반을 유지하는 제한된 검증 기간"
          : "A bounded validation period while the current base remains protected",
      },
    ],
    safetyMargin: {
      reading: ko
        ? transitionSupport >= 2
          ? "현재 Safety Margin은 제한된 실험을 가능하게 합니다. 더 안전한 선택을 고르는 것이 아니라 시도하고 배우고 다시 바꿀 공간을 보호합니다."
          : "Safety Margin은 더 안전한 선택을 고르는 것이 아니라 다시 바꿀 수 있는 공간을 보호합니다."
        : transitionSupport >= 2
          ? "The current Safety Margin enables bounded experimentation by protecting room to try, learn, recover, and change again."
          : "Safety Margin protects the space to change again; it does not simply identify the safer option.",
      roomToBeWrong: `${financialRoom} ${recoveryPath}`,
      strongestProtection: optionAProtection,
      weakestMargin: downside,
      protectedCapacity: ko
        ? "소득 연속성, 회복 가능성, 학습과 재시도 역량"
        : "Income continuity, recovery capacity, and the ability to learn and retry",
      exposureBoundary: downside,
    },
    decisionSwitches,
    nextStepExperiment: {
      whatToTest: input.validationFocus,
      buildOrLearn: internalReadiness,
      evidenceToCollect: missingValidation,
      exposureBoundary: downside,
      continueCondition: decisionSwitches[0]?.signal || input.validationFocus,
      pauseCondition: ko
        ? `근거가 생기기 전에 ${financialRoom}을 약화시키는 경우 중단하거나 재설계합니다.`
        : `Pause or redesign if the test weakens this protected room before credible evidence appears: ${financialRoom}`,
      reassessAt: ko
        ? "각 검증 단계가 끝날 때, 그리고 노출을 확대하기 전에 현재 구조적 자세를 다시 봅니다."
        : "Reassess the Current Structural Posture at the end of each stage and before increasing exposure.",
      stages: input.plan,
    },
  };
}
