import type { V2State } from "./amcV2Model";

/**
 * Concrete examples for each level the customer chooses (owner decision
 * 2026-10-14, option B). They explain what a level means so answers are
 * comparable; the levels and the posture formula are unchanged.
 * Pairs are stored [Korean, English].
 */
type Pair = readonly [ko: string, en: string];
type Field = keyof V2State["bands"];

const unknown: Pair = ["아직 확인하지 않음. 중간 수준으로 계산합니다", "Not checked yet. Counted as the middle level"];

export const v2BandAnchors: Record<Field, Record<string, Pair>> = {
  internalReadiness: {
    strong: ["목표 직무 요건 대부분을 경력이나 결과물로 보여 줄 수 있음", "I can show most of the target requirements through my experience or work"],
    developing: ["갖춘 요건도 있고 부족한 요건도 있음", "I meet some requirements but not others"],
    weak: ["핵심 요건을 아직 갖추지 못함", "I do not yet meet the core requirements"],
    unknown,
  },
  financialRoom: {
    strong: ["소득 없이 6개월 이상 생활할 수 있음", "I could live 6 months or more without income"],
    developing: ["소득 없이 3~6개월 생활할 수 있음", "I could live 3–6 months without income"],
    weak: ["소득 없이는 3개월도 버티기 어려움", "I could not last 3 months without income"],
    unknown,
  },
  downsideExposure: {
    low: ["잘 안되어도 잃는 것이 적고 금방 회복할 수 있음", "If it fails, I lose little and recover quickly"],
    moderate: ["소득이나 경력에 손해가 있지만 1년 안에 회복할 수 있음", "I would lose some income or career ground but recover within a year"],
    high: ["큰 지출·퇴사·이주처럼 되돌리기 어려운 일이 포함됨", "It involves hard-to-undo steps such as big spending, resigning or relocating"],
    unknown,
  },
  reversibility: {
    strong: ["휴직·복직·재입사처럼 돌아갈 길이 문서로 정해져 있음", "A way back, such as leave, return or rehire, is agreed in writing"],
    developing: ["돌아갈 수도 있지만 정해진 것은 없음", "I might be able to go back, but nothing is agreed"],
    weak: ["한번 떠나면 돌아가기 어려움", "Once I leave, it is hard to go back"],
    unknown,
  },
  optionBSupport: {
    strong: ["누가 어떻게 도울지 구체적으로 정해져 있음", "Specific people or programmes have agreed how they will help"],
    developing: ["도와줄 사람은 있지만 아직 약속받지는 않음", "People could help, but nobody has promised yet"],
    weak: ["실제로 도움받을 곳이 거의 없음", "I have almost no real help"],
    unknown,
  },
  constraintLoad: {
    light: ["준비에 일주일에 10시간 넘게 쓸 수 있음", "I can spend more than 10 hours a week preparing"],
    material: ["준비에 일주일에 3~10시간 정도 쓸 수 있음", "I can spend about 3–10 hours a week preparing"],
    heavy: ["일·가족·건강 때문에 일주일에 3시간도 내기 어려움", "Under 3 hours a week, because of work, family or health"],
    unknown,
  },
};

export function v2BandAnchor(field: string, value: string, ko: boolean): string | undefined {
  return (v2BandAnchors as Record<string, Record<string, Pair>>)[field]?.[value]?.[ko ? 0 : 1];
}
