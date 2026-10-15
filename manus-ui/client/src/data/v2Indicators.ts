import type { ProductApplicationV3 } from "./amcProductApplicationV3";
import { v2AmountPattern } from "./v2Amounts";
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
    definition: ["목표 경로의 수요와 요건이 공개 자료로 확인된 정도", "How far public sources confirm demand and requirements for the target"],
    question: ["목표 경로의 수요와 요건이 공식 자료로 확인되나요?", "Are demand and requirements for the target confirmed by official sources?"],
    how: ["목표 경로의 공식 요건·수요 자료를 찾아 내 조건과 비교합니다.", "Find official requirement and demand data for the target and compare it with your conditions."],
    worksWhen: ["자료의 지역·직무·시점이 내 목표와 같으면 판단을 뒷받침합니다.", "It supports the reading when the source matches your target region, role and timing."],
    weakensWhen: ["자료가 시장 전체나 평균을 다룬다면, 내 직급과 계약 형태에는 그대로 맞지 않습니다.", "If the source describes the whole market or an average, it does not transfer as is to your level or contract type."],
  },
  {
    key: "internalReadiness", variable: "internalReadiness", label: "readinessBand", reference: 2,
    definition: ["새 경로가 요구하는 역량과 결과물을 이미 갖춘 정도", "How far you already have the skills and work the new path needs"],
    question: ["요구 역량 중 지금 보여 줄 수 있는 것과 아직 없는 것은 무엇인가요?", "Which required skills can you prove now, and which are missing?"],
    how: ["부족한 요건을 하나 골라 과제, 자격, 포트폴리오 같은 결과물로 만듭니다.", "Pick one missing requirement and turn it into a work sample, credential or portfolio piece."],
    worksWhen: ["목표 분야 사람들이 인정하는 결과물로 보여 줄 수 있으면 강점이 됩니다.", "It counts as a strength when you can show it through work the target field recognizes."],
    weakensWhen: ["지금 회사의 이름·팀·시스템 덕분에 낸 성과라면, 밖에서도 같은 결과가 나오는지 따로 확인하세요.", "If the results relied on your current employer's brand, team or systems, check separately that they repeat outside."],
    evidence: /역량|자격|요건|요구|skill|qualif|requirement/i,
  },
  {
    key: "safetyMargin", variable: "financialRoom", label: "safety", reference: 1,
    definition: ["계획대로 되지 않아도 버틸 수 있는 돈과 소득의 여유", "Money and income to absorb a plan that does not work out"],
    question: ["필요한 비용과 소득 공백을 몇 개월 감당할 수 있나요?", "How many months of costs and income gap can you absorb?"],
    how: ["준비 기간에 필요한 생활비와 비용을 계산하고, 그만큼을 따로 떼어 둡니다.", "Work out living costs and expenses for the preparation period and set that amount aside."],
    worksWhen: ["계산해 둔 비용과 소득 공백 안에서 움직이면 실제 여유가 됩니다.", "It is real room when you move within the costs and income gap you have worked out."],
    weakensWhen: ["준비 기간이 길어지거나 고정 지출이 늘면 같은 금액도 빠르게 줄어듭니다.", "A longer preparation period or higher fixed costs shrink the same amount quickly."],
    evidence: v2AmountPattern,
  },
  {
    key: "reversibility", variable: "reversibility", label: "reversibility", reference: 1,
    definition: ["잘 안 되면 원래 자리로 돌아올 수 있는 정도", "How far you can return if it does not work"],
    question: ["휴직 후 복직, 재지원 같은 돌아올 길이 문서로 확인되나요?", "Is a way back, such as leave and return or re-application, confirmed in writing?"],
    how: ["휴직·복직 제도, 재지원, 계약 조건 등 돌아올 길을 문서로 확인합니다.", "Confirm a way back in writing: leave and return, re-application, contract terms."],
    worksWhen: ["돌아갈 자리와 조건이 문서로 남아 있으면, 잘 안 됐을 때 잃는 것이 줄어듭니다.", "When the way back and its terms are in writing, you lose less if it does not work."],
    weakensWhen: ["구두 약속이거나 시간이 지나면 사라지는 자리라면 돌아올 길은 생각보다 좁습니다.", "If it rests on a verbal promise or a position that lapses, the way back is smaller than it looks."],
    // Ways back or part-way routes; plain "leave"/"remote" matched unrelated text (audit L2).
    evidence: /시간제|파트타임|병행|휴직|복직|재입사|part-time|leave of absence|return to work|rehire/i,
  },
  {
    key: "optionBSupport", variable: "optionBSupport", label: "supportBand", reference: 1,
    definition: ["새 경로를 실제로 도와줄 사람·제도·시간", "People, programs and time that will actually help the new path"],
    question: ["이름과 역할까지 말할 수 있는 지원자나 제도가 있나요?", "Can you name the people or programs that will help, and their roles?"],
    how: ["도와줄 사람과 제도를 이름과 역할까지 구체적으로 확보합니다.", "Secure named people and programs with specific roles."],
    worksWhen: ["도와줄 사람이 시간과 역할을 구체적으로 약속했다면 실행이 빨라집니다.", "It speeds execution when helpers have committed specific time and roles."],
    weakensWhen: ["호의적인 반응만 있고 역할이 정해지지 않았다면 실제 지원으로 계산하지 않습니다.", "Friendly interest without a defined role is not counted as real support."],
    // "지원" alone also means "application" (지원서·지원 요건), so only funding words count (audit L2).
    evidence: /장학|지원금|보조금|후원|멘토|scholar|grant|bursary|sponsor|mentor/i,
  },
  {
    key: "structuralRisk", variable: "downsideExposure", label: "downside", reference: 1,
    definition: ["계획대로 되지 않았을 때 잃을 수 있는 것의 크기 · 낮을수록 유리", "How much you could lose if the plan does not work out · lower is better"],
    question: ["되돌릴 수 없는 지출이나 결정이 포함되어 있나요?", "Does the plan include irreversible spending or decisions?"],
    how: ["되돌릴 수 없는 지출·퇴사 같은 결정을 근거가 생길 때까지 미룹니다.", "Defer irreversible spending or resignation until evidence appears."],
    worksWhen: ["되돌릴 수 없는 결정을 근거가 생길 때까지 미룰 수 있으면 위험이 낮게 유지됩니다.", "Risk stays low while irreversible decisions can wait for evidence."],
    weakensWhen: ["퇴사·이주·큰 지출을 먼저 하면 같은 계획이라도 손실 위험이 커집니다.", "If resignation, relocation or a large outlay comes first, the same plan carries more downside."],
  },
  {
    key: "constraintLoad", variable: "constraintLoad", label: "constraint", reference: 1,
    definition: ["본업·가족·건강처럼 함께 감당해야 하는 부담 · 가벼울수록 유리", "Load from work, family or health you carry at the same time · lighter is better"],
    question: ["새 경로에 쓸 시간을 일정표에서 실제로 비울 수 있나요?", "Can you actually free the time for the new path in your schedule?"],
    how: ["일정과 역할을 조정해 새 경로를 준비할 시간을 비워 둡니다.", "Rearrange schedules and roles to free time to prepare for the new path."],
    worksWhen: ["본업과 가족 일정을 예측할 수 있으면 준비 시간이 지켜집니다.", "Preparation time holds while work and family schedules are predictable."],
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
      : ko ? "전환 판단 기준을 충족합니다. 이 수준을 지키세요." : "Meets the level needed for a move. Keep it there."
  return level === 0
    ? ko ? "판단을 가장 크게 제한하는 조건입니다. 이것부터 보강하세요." : "This limits the reading most. Strengthen it first."
    : ko ? "일부 갖췄지만 전환 판단 기준에는 못 미칩니다." : "Partly in place, but below the level needed for a move.";
}

/**
 * Level name for a condition. Market evidence is not something the customer
 * has: its level describes how well public sources support the target, so it
 * reads "일부 확인됨 / 근거가 약함" rather than "일부 갖춤 / 부족함".
 */
const evidenceLevel: Record<string, readonly [string, string]> = {
  strong: ["충분히 확인됨", "Well supported"],
  developing: ["일부 확인됨", "Partly supported"],
  weak: ["근거가 약함", "Weakly supported"],
  unknown: ["근거 확인 전", "Not yet established"],
};
export function v2ConditionLevel(key: string, band: string, language: "ko" | "en", fallback: (band: string) => string): string {
  return key === "externalValidation" && evidenceLevel[band] ? evidenceLevel[band][language === "ko" ? 0 : 1] : fallback(band);
}
