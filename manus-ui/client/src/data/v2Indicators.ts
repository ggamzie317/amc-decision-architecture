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
  evidence?: RegExp;
};

export const v2Indicators: V2Indicator[] = [
  {
    key: "externalValidation", variable: "externalValidation", label: "externalValidation", reference: 2,
    definition: ["공개 자료로 확인된 시장·요건의 뒷받침", "Market and requirement support confirmed by public sources"],
    question: ["목표 경로의 수요와 요건이 공식 자료로 확인되나요?", "Are demand and requirements for the target confirmed by official sources?"],
    how: ["목표 경로의 공식 요건·수요 자료를 확인하고 내 조건과 대조합니다.", "Check official requirements and demand for the target and compare them with your conditions."],
  },
  {
    key: "internalReadiness", variable: "internalReadiness", label: "readinessBand", reference: 2,
    definition: ["새 경로가 요구하는 역량과 결과물을 이미 갖춘 정도", "How far you already have the skills and work the new path needs"],
    question: ["요구 역량 중 지금 증명할 수 있는 것은 무엇이고, 없는 것은 무엇인가요?", "Which required skills can you prove now, and which are missing?"],
    how: ["요구 역량 중 부족한 것을 하나 골라 결과물(과제·자격·포트폴리오)로 만듭니다.", "Pick one missing requirement and turn it into a work sample, credential or portfolio piece."],
    evidence: /역량|자격|요건|요구|skill|qualif|requirement/i,
  },
  {
    key: "safetyMargin", variable: "financialRoom", label: "safety", reference: 1,
    definition: ["계획이 틀려도 버틸 수 있는 돈과 소득의 여유", "Money and income to absorb a plan that goes wrong"],
    question: ["필요한 비용과 소득 공백을 몇 개월 감당할 수 있나요?", "How many months of costs and income gap can you absorb?"],
    how: ["시험 기간의 생활비·비용을 계산하고 그만큼을 따로 확보합니다.", "Calculate living costs and expenses for the test period and set that amount aside."],
    evidence: /(?:HK\$|US\$|S\$|£|€|\$|₩)\s?\d|\d[\d,.]*\s?(?:원|만 ?원|파운드|달러|유로)/,
  },
  {
    key: "reversibility", variable: "reversibility", label: "reversibility", reference: 1,
    definition: ["잘 안 되면 원래 자리로 돌아올 수 있는 정도", "How far you can return if it does not work"],
    question: ["돌아올 길(휴직·복직·재지원)이 문서로 확인되나요?", "Is a way back (leave, return, re-application) confirmed in writing?"],
    how: ["휴직·복직 제도, 재지원, 계약 조건 등 돌아올 길을 문서로 확인합니다.", "Confirm a way back in writing: leave and return, re-application, contract terms."],
    evidence: /원격|시간제|파트타임|병행|휴직|part-time|remote|leave/i,
  },
  {
    key: "optionBSupport", variable: "optionBSupport", label: "supportBand", reference: 1,
    definition: ["새 경로를 실제로 도와줄 사람·제도·시간", "People, programmes and time that will actually help the new path"],
    question: ["이름과 역할까지 말할 수 있는 지원자나 제도가 있나요?", "Can you name the people or programmes that will help, and their roles?"],
    how: ["도와줄 사람과 제도를 이름과 역할까지 구체적으로 확보합니다.", "Secure named people and programmes with specific roles."],
    evidence: /장학|지원|후원|scholar|fund|support|sponsor/i,
  },
  {
    key: "structuralRisk", variable: "downsideExposure", label: "downside", reference: 1,
    definition: ["계획이 틀렸을 때 잃을 수 있는 것의 크기 (낮을수록 유리)", "How much you could lose if the plan is wrong (lower is better)"],
    question: ["되돌릴 수 없는 지출이나 결정이 포함되어 있나요?", "Does the plan include irreversible spending or decisions?"],
    how: ["되돌릴 수 없는 지출·퇴사 같은 결정을 근거가 생길 때까지 미룹니다.", "Defer irreversible spending or resignation until evidence appears."],
  },
  {
    key: "constraintLoad", variable: "constraintLoad", label: "constraint", reference: 1,
    definition: ["본업·가족·건강 등 동시에 감당해야 하는 부담 (가벼울수록 유리)", "Load from work, family or health you carry at the same time (lighter is better)"],
    question: ["새 경로에 쓸 시간을 일정표에서 실제로 비울 수 있나요?", "Can you actually free the time for the new path in your schedule?"],
    how: ["일정과 역할을 재배치해 시험에 쓸 시간을 확보합니다.", "Rearrange schedules and roles to free time for the test."],
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
