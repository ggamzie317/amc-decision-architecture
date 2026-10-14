import type { V2State } from "./amcV2Model";

/**
 * Concrete examples for each level the customer chooses (owner decision
 * 2026-10-14, option B). They explain what a level means so answers are
 * comparable; the levels and the posture formula are unchanged.
 * Pairs are stored [Korean, English].
 */
type Pair = readonly [ko: string, en: string];
type Field = keyof V2State["bands"];

const unknown: Pair = ["확인하지 않음 — 중간값으로 계산합니다", "Not checked — treated as a middle value"];

export const v2BandAnchors: Record<Field, Record<string, Pair>> = {
  internalReadiness: {
    strong: ["목표 요건 대부분을 결과물·경력으로 증명할 수 있음", "Can prove most target requirements with work or experience"],
    developing: ["일부 요건은 갖췄고 일부는 부족함", "Some requirements met, some missing"],
    weak: ["핵심 요건을 아직 갖추지 못함", "Core requirements not yet met"],
    unknown,
  },
  financialRoom: {
    strong: ["소득 없이 6개월 이상 생활할 수 있음", "Could live 6+ months without income"],
    developing: ["소득 없이 3~6개월 생활할 수 있음", "Could live 3–6 months without income"],
    weak: ["소득 없이 3개월 미만", "Less than 3 months without income"],
    unknown,
  },
  downsideExposure: {
    low: ["실패해도 잃는 것이 작고 곧 회복 가능", "Little to lose; quick to recover"],
    moderate: ["소득·경력 손실이 있지만 1년 안에 회복 가능", "Some income or career loss, recoverable within a year"],
    high: ["되돌리기 어려운 지출·퇴사·이주가 포함됨", "Includes hard-to-reverse spending, resignation or relocation"],
    unknown,
  },
  reversibility: {
    strong: ["돌아갈 길이 문서로 확인됨 (휴직·복직·재입사 등)", "A way back is confirmed in writing (leave, return, rehire)"],
    developing: ["돌아갈 가능성은 있지만 확정되지 않음", "A way back is possible but not confirmed"],
    weak: ["돌아가기 어려움", "Hard to go back"],
    unknown,
  },
  optionBSupport: {
    strong: ["이름과 역할까지 정해진 지원자·제도가 있음", "Named people or programmes with defined roles"],
    developing: ["도와줄 사람은 있지만 약속은 아직", "People could help, but nothing is committed"],
    weak: ["실질적인 지원이 거의 없음", "Little real support"],
    unknown,
  },
  constraintLoad: {
    light: ["준비에 주 10시간 이상 쓸 수 있음", "Can spend 10+ hours a week preparing"],
    material: ["준비에 주 3~10시간 정도 쓸 수 있음", "Can spend about 3–10 hours a week"],
    heavy: ["본업·가족·건강 부담으로 주 3시간 미만", "Under 3 hours a week because of work, family or health"],
    unknown,
  },
};

export function v2BandAnchor(field: string, value: string, ko: boolean): string | undefined {
  return (v2BandAnchors as Record<string, Record<string, Pair>>)[field]?.[value]?.[ko ? 0 : 1];
}
