import type { ProductApplicationV3 } from "./amcProductApplicationV3";
import type { V2CopyKey } from "./v2Language";

/**
 * The seven structural indicators in one consistent format, used by the
 * dashboard profile, the report and the simulator explanation:
 * definition → current state → interpretation → check question → how to
 * strengthen it. The reference level is the transition baseline derived from
 * the existing posture formula (support 8–10); nothing new is scored.
 * Copy pairs are stored [Korean, English].
 */
export type V2IndicatorKey = keyof ProductApplicationV3["postureBasis"];
type Pair = readonly [ko: string, en: string];

export type V2Indicator = {
  key: V2IndicatorKey;
  /** Simulator variable for the same condition, when one exists. */
  variable?: string;
  label: V2CopyKey;
  reference: number;
  definition: Pair;
  question: Pair;
  how: Pair;
  /** Conditional reading (benchmark: Hogan): when this condition works for you, and when the same condition weakens. */
  worksWhen: Pair;
  weakensWhen: Pair;
  evidence?: RegExp;
};

export const v2Indicators: V2Indicator[] = [
  {
    key: "externalValidation", variable: "externalValidation", label: "externalValidation", reference: 2,
    definition: ["공개 자료로 확인된 시장·요건의 뒷받침", "Market and requirement support confirmed by public sources"],
    question: ["목표 경로의 수요와 요건이 공식 자료로 확인되나요?", "Are demand and requirements for the target confirmed by official sources?"],
    how: ["목표 경로의 공식 요건·수요 자료를 확인하고 내 조건과 대조합니다.", "Check official requirements and demand for the target and compare them with your conditions."],
    worksWhen: ["공개 자료의 지역·직무·시점이 내 목표와 같을 때 판단을 뒷받침합니다.", "It supports the reading when the source matches your target region, role and timing."],
    weakensWhen: ["자료가 시장 전체·평균 기준이면 내 직급·계약 형태에는 그대로 적용되지 않습니다.", "If the source describes the whole market or an average, it does not transfer as is to your level or contract type."],
  },
  {
    key: "internalReadiness", variable: "internalReadiness", label: "readinessBand", reference: 2,
    definition: ["새 경로가 요구하는 역량과 결과물을 이미 갖춘 정도", "How far you already have the skills and work the new path needs"],
    question: ["요구 역량 중 지금 증명할 수 있는 것은 무엇이고, 없는 것은 무엇인가요?", "Which required skills can you prove now, and which are missing?"],
    how: ["요구 역량 중 부족한 것을 하나 골라 결과물(과제·자격·포트폴리오)로 만듭니다.", "Pick one missing requirement and turn it into a work sample, credential or portfolio piece."],
    worksWhen: ["목표 쪽 사람이 인정하는 결과물로 증명될 때 자산으로 작동합니다.", "It works as an asset when it is proven by work the target side recognises."],
    weakensWhen: ["현재 회사의 브랜드·팀·시스템에 기대 만든 성과라면, 밖에서도 같은 결과가 나오는지 따로 확인해야 합니다.", "If the results relied on your current employer's brand, team or systems, check separately that they repeat outside."],
    evidence: /역량|자격|요건|요구|skill|qualif|requirement/i,
  },
  {
    key: "safetyMargin", variable: "financialRoom", label: "safety", reference: 1,
    definition: ["계획이 틀려도 버틸 수 있는 돈과 소득의 여유", "Money and income to absorb a plan that goes wrong"],
    question: ["필요한 비용과 소득 공백을 몇 개월 감당할 수 있나요?", "How many months of costs and income gap can you absorb?"],
    how: ["시험 기간의 생활비·비용을 계산하고 그만큼을 따로 확보합니다.", "Calculate living costs and expenses for the test period and set that amount aside."],
    worksWhen: ["비용과 소득 공백을 계산한 범위 안에서 시험할 때 실제 여유가 됩니다.", "It becomes real room when the test stays within calculated costs and income gaps."],
    weakensWhen: ["준비 기간이 길어지거나 고정 지출이 늘면 같은 금액도 빠르게 줄어듭니다.", "A longer preparation period or higher fixed costs shrink the same amount quickly."],
    evidence: /(?:HK\$|US\$|S\$|£|€|\$|₩)\s?\d|\d[\d,.]*\s?(?:원|만 ?원|파운드|달러|유로)/,
  },
  {
    key: "reversibility", variable: "reversibility", label: "reversibility", reference: 1,
    definition: ["잘 안 되면 원래 자리로 돌아올 수 있는 정도", "How far you can return if it does not work"],
    question: ["돌아올 길(휴직·복직·재지원)이 문서로 확인되나요?", "Is a way back (leave, return, re-application) confirmed in writing?"],
    how: ["휴직·복직 제도, 재지원, 계약 조건 등 돌아올 길을 문서로 확인합니다.", "Confirm a way back in writing: leave and return, re-application, contract terms."],
    worksWhen: ["돌아갈 자리와 조건이 문서로 남아 있을 때 실패 비용을 낮춥니다.", "It lowers the cost of failure when the way back and its terms are in writing."],
    weakensWhen: ["구두 약속이거나 시간이 지나면 사라지는 자리라면 복귀 여지는 생각보다 작습니다.", "If it rests on a verbal promise or a position that lapses, the way back is smaller than it looks."],
    evidence: /원격|시간제|파트타임|병행|휴직|part-time|remote|leave/i,
  },
  {
    key: "optionBSupport", variable: "optionBSupport", label: "supportBand", reference: 1,
    definition: ["새 경로를 실제로 도와줄 사람·제도·시간", "People, programmes and time that will actually help the new path"],
    question: ["이름과 역할까지 말할 수 있는 지원자나 제도가 있나요?", "Can you name the people or programmes that will help, and their roles?"],
    how: ["도와줄 사람과 제도를 이름과 역할까지 구체적으로 확보합니다.", "Secure named people and programmes with specific roles."],
    worksWhen: ["도와줄 사람이 구체적인 시간과 역할을 약속했을 때 실행을 앞당깁니다.", "It speeds execution when helpers have committed specific time and roles."],
    weakensWhen: ["호의적인 반응만 있고 역할이 정해지지 않았다면 실제 지원으로 계산하지 않습니다.", "Friendly interest without a defined role is not counted as real support."],
    evidence: /장학|지원|후원|scholar|fund|support|sponsor/i,
  },
  {
    key: "structuralRisk", variable: "downsideExposure", label: "downside", reference: 1,
    definition: ["계획이 틀렸을 때 잃을 수 있는 것의 크기 (낮을수록 유리)", "How much you could lose if the plan is wrong (lower is better)"],
    question: ["되돌릴 수 없는 지출이나 결정이 포함되어 있나요?", "Does the plan include irreversible spending or decisions?"],
    how: ["되돌릴 수 없는 지출·퇴사 같은 결정을 근거가 생길 때까지 미룹니다.", "Defer irreversible spending or resignation until evidence appears."],
    worksWhen: ["되돌릴 수 없는 결정을 근거가 생길 때까지 미룰 수 있을 때 위험이 낮게 유지됩니다.", "Risk stays low while irreversible decisions can wait for evidence."],
    weakensWhen: ["퇴사·이주·큰 지출이 먼저 일어나면 같은 계획도 손실 위험이 커집니다.", "If resignation, relocation or a large outlay comes first, the same plan carries more downside."],
  },
  {
    key: "constraintLoad", variable: "constraintLoad", label: "constraint", reference: 1,
    definition: ["본업·가족·건강 등 동시에 감당해야 하는 부담 (가벼울수록 유리)", "Load from work, family or health you carry at the same time (lighter is better)"],
    question: ["새 경로에 쓸 시간을 일정표에서 실제로 비울 수 있나요?", "Can you actually free the time for the new path in your schedule?"],
    how: ["일정과 역할을 재배치해 시험에 쓸 시간을 확보합니다.", "Rearrange schedules and roles to free time for the test."],
    worksWhen: ["본업과 가족 일정이 예측 가능할 때 준비 시간이 유지됩니다.", "Preparation time holds while work and family schedules are predictable."],
    weakensWhen: ["마감·돌봄·건강 변수가 겹치면 계획한 시간이 가장 먼저 줄어듭니다.", "When deadlines, care needs or health issues coincide, planned time is the first to go."],
  },
];

/** Favourable reading of a band (risk and load already inverted). */
export const v2BandLevel: Record<string, number | null> = {
  strong: 2, developing: 1, weak: 0,
  low: 2, moderate: 1, high: 0,
  light: 2, material: 1, heavy: 0,
  unknown: null,
};

export function v2IndicatorReading(level: number | null, reference: number, ko: boolean): string {
  if (level === null)
    return ko ? "아직 확인되지 않아 중간값으로 계산했습니다. 확인되면 판단이 달라질 수 있습니다."
      : "Not yet confirmed, so it was treated as a middle value; confirming it may change the reading.";
  if (level >= reference)
    return level === 2
      ? ko ? "판단을 뒷받침하는 강점입니다." : "A strength that supports the reading."
      : ko ? "전환 기준선을 충족합니다. 유지가 중요합니다." : "Meets the transition baseline; keep it there."
  return level === 0
    ? ko ? "판단을 가장 크게 제한하는 조건입니다. 먼저 보강이 필요합니다." : "The condition that limits the reading most; strengthen it first."
    : ko ? "일부 갖춰졌지만 전환 기준선에는 못 미칩니다." : "Partly in place but below the transition baseline.";
}
