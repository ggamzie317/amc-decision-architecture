import type { V2CaseType } from "./amcV2Model";
import type { V2Language } from "./v2Language";

type Bilingual = readonly [string, string];
type MissingPoint = { point: Bilingual; why: Bilingual };
// Mirrors the nine established case-family Missing Point concepts in the core
// presentation. Wording for the V2 explanation stays outside the core engine.
const missingByCase: Record<V2CaseType, MissingPoint> = {
  "Corporate Stay vs Exit": {
    point: ["Unused internal value", "활용하지 않은 내부 가치"],
    why: [
      "Check whether the current role can be redesigned before treating exit as necessary.",
      "퇴사를 결정하기 전에 현재 역할을 재설계할 수 있는지 확인하세요.",
    ],
  },
  "MBA / EMBA / PhD Decision": {
    point: ["Alternative access routes", "대안 접근 경로"],
    why: [
      "Test what access this degree uniquely adds compared with other routes.",
      "다른 경로와 비교해 이 학위만이 열어 주는 기회를 확인하세요.",
    ],
  },
  "Overseas Relocation": {
    point: ["Destination operating fit", "현지 생활 적합성"],
    why: [
      "Check whether work, family and practical living conditions fit at the destination.",
      "목적지의 일·가족·생활 조건이 실제로 맞는지 확인하세요.",
    ],
  },
  Entrepreneurship: {
    point: ["Repeatable paid demand", "반복 가능한 지불 수요"],
    why: [
      "Test whether customers will pay repeatedly, beyond initial interest.",
      "초기 관심을 넘어 고객의 반복 결제 수요가 있는지 확인하세요.",
    ],
  },
  "Industry Transition": {
    point: ["Transferable proof", "전환 가능한 성과 근거"],
    why: [
      "Check whether the target industry recognizes your existing results.",
      "목표 산업에서 기존 성과를 인정받을 수 있는지 확인하세요.",
    ],
  },
  "Role Upgrade / Downgrade": {
    point: ["Real scope change", "실질적인 역할 변화"],
    why: [
      "Compare actual authority, responsibility and workload, not only the title.",
      "직급뿐 아니라 실제 권한·책임·업무량이 어떻게 달라지는지 확인하세요.",
    ],
  },
  "Burnout-driven Decision": {
    point: ["Recovery before direction", "방향 결정 전 회복"],
    why: [
      "Separate the need to recover from the question of career fit.",
      "회복의 필요성과 경력 방향의 적합성을 구분해 보세요.",
    ],
  },
  "Family Constraint-heavy Decision": {
    point: ["Family operating fit", "가족 생활 적합성"],
    why: [
      "Test whether the daily family arrangement can support the chosen path.",
      "선택한 경로를 가족의 일상 운영이 감당할 수 있는지 확인하세요.",
    ],
  },
  "General Career Reconfiguration": {
    point: ["The real decision condition", "실제 결정 조건"],
    why: [
      "Identify which observable condition would change the decision.",
      "어떤 확인 가능한 조건이 달라지면 판단이 바뀌는지 정하세요.",
    ],
  },
};
export function v2MissingPoint(caseType: V2CaseType, language: V2Language) {
  const entry = missingByCase[caseType];
  const index = language === "ko" ? 1 : 0;
  return { point: entry.point[index], why: entry.why[index] };
}
