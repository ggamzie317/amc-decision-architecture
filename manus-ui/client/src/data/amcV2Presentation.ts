import type { V2CaseType } from "./amcV2Model";
import { v2t, type V2Language } from "./v2Language";

type Bilingual = readonly [string, string];
type MissingPoint = { point: Bilingual; why: Bilingual };
// Mirrors the nine established case-family Missing Point concepts in the core
// presentation. Wording for the V2 explanation stays outside the core engine.
const missingByCase: Record<V2CaseType, MissingPoint> = {
  "Corporate Stay vs Exit": {
    point: ["Unused internal value", "현재 직무에서 아직 활용하지 못한 역량"],
    why: [
      "Check whether the current role can be redesigned before treating exit as necessary.",
      "퇴사를 결정하기 전에 현재 역할을 재설계할 수 있는지 확인하세요.",
    ],
  },
  "MBA / EMBA / PhD Decision": {
    point: ["Alternative access routes", "학위 외의 진입 경로"],
    why: [
      "Test what access this degree uniquely adds compared with other routes.",
      "다른 경로와 비교해 이 학위만이 열어 주는 기회를 확인하세요.",
    ],
  },
  "Overseas Relocation": {
    point: ["Destination operating fit", "현지에서의 일과 생활"],
    why: [
      "Check whether work, family and practical living conditions fit at the destination.",
      "목적지의 일·가족·생활 조건이 실제로 맞는지 확인하세요.",
    ],
  },
  Entrepreneurship: {
    point: ["Repeatable paid demand", "고객의 반복 구매 가능성"],
    why: [
      "Test whether customers will pay repeatedly, beyond initial interest.",
      "초기 관심뿐 아니라 고객이 계속 비용을 지불할지 확인하세요.",
    ],
  },
  "Industry Transition": {
    point: ["Transferable proof", "새 산업에서도 통하는 기존 성과"],
    why: [
      "Check whether the target industry recognizes your existing results.",
      "새 산업의 채용 담당자가 기존 성과를 어떻게 평가하는지 확인하세요.",
    ],
  },
  "Role Upgrade / Downgrade": {
    point: ["Real scope change", "실제로 달라지는 역할"],
    why: [
      "Compare actual authority, responsibility and workload, not only the title.",
      "직급뿐 아니라 실제 권한·책임·업무량이 어떻게 달라지는지 확인하세요.",
    ],
  },
  "Burnout-driven Decision": {
    point: ["Recovery before direction", "방향을 정하기 전 필요한 회복"],
    why: [
      "Separate the need to recover from the question of career fit.",
      "회복의 필요성과 경력 방향의 적합성을 구분해 보세요.",
    ],
  },
  "Family Constraint-heavy Decision": {
    point: ["Family operating fit", "가족의 일상과 맞는 실행 방법"],
    why: [
      "Test whether the daily family arrangement can support the chosen path.",
      "이 선택을 가족의 일상과 함께 지속할 수 있는지 확인하세요.",
    ],
  },
  "General Career Reconfiguration": {
    point: ["The real decision condition", "판단을 바꿀 핵심 조건"],
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

// Provider prose can reuse AMC's English labels even in a Korean response.
// Localize only established AMC terms at render time; source titles and the
// evidence snapshot are never rewritten.
const evidenceTerms: Bilingual[] = [
  ...Object.values(missingByCase).map(entry => entry.point),
  ...(["safety", "tradeoff", "posture", "switches", "changing"] as const).map(
    key => [v2t("en", key), v2t("ko", key)] as const
  ),
  ["Missing Point", v2t("ko", "missing")],
];
const evidenceTermLabels = new Map(
  evidenceTerms.map(([english, korean]) => [english.toLowerCase(), korean])
);
const evidenceTermPattern = new RegExp(
  `\\b(?:${evidenceTerms
    .map(([english]) => english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|")})\\b`,
  "gi"
);

export function v2CustomerEvidenceText(
  language: V2Language,
  value: string
): string {
  return language === "ko"
    ? value.replace(
        evidenceTermPattern,
        term => evidenceTermLabels.get(term.toLowerCase()) ?? term
      )
    : value;
}

const koreanNextTest: Record<V2CaseType, string> = {
  "Corporate Stay vs Exit": "퇴사 전에 현재 역할을 조정할 수 있는지 확인",
  "MBA / EMBA / PhD Decision": "학위가 다른 경로보다 더해 주는 기회 확인",
  "Overseas Relocation": "현지의 일·생활 조건 확인",
  Entrepreneurship: "작은 유료 시범 운영으로 실제 구매 수요 확인",
  "Industry Transition": "새 산업에서 기존 성과가 통하는지 확인",
  "Role Upgrade / Downgrade": "직급뿐 아니라 실제 역할과 업무량 확인",
  "Burnout-driven Decision": "회복 필요와 경력 방향을 나누어 확인",
  "Family Constraint-heavy Decision":
    "가족의 일상과 함께 지속할 수 있는 경로 확인",
  "General Career Reconfiguration": "판단을 바꿀 핵심 가정 확인",
};

export function v2CustomerNextTest(
  caseType: V2CaseType,
  language: V2Language,
  coreText: string
): string {
  return language === "ko" ? koreanNextTest[caseType] : coreText;
}
