import type { CurrentCaseStructuredSelections } from "./amcCurrentCaseStructuralSignals";
export const INTAKE_V4_SCHEMA = "AMC-INTAKE-V4-15";
export const EXPERIENCE_VERSION = "interactive-v1";
export const intake15Questions = [
  {
    id: 1,
    category: "Current Situation",
    text: "Why has this decision become important now, and what pressure, trigger, or opportunity is making it more urgent?",
    ko: "왜 지금 이 결정이 중요해졌으며, 어떤 압박·계기·기회가 결정을 더 시급하게 만들고 있나요?",
    sample: "",
  },
  {
    id: 2,
    category: "Current Situation",
    text: "What would change if you delayed this decision for 6 to 12 months?",
    ko: "이 결정을 6~12개월 미룬다면 무엇이 달라질까요?",
    sample: "",
  },
  {
    id: 3,
    category: "Option A / Option B",
    text: "What does Option A protect, and what does it limit or strain?",
    ko: "Option A는 무엇을 보호하고, 무엇을 제한하거나 부담스럽게 만드나요?",
    sample: "",
  },
  {
    id: 4,
    category: "Option A / Option B",
    text: "What does Option B open up, and what does it put at risk?",
    ko: "Option B는 어떤 가능성을 열고, 무엇을 위험에 노출시키나요?",
    sample: "",
  },
  {
    id: 5,
    category: "External Pressure",
    text: "What external market, industry, policy, company, or role changes affect this decision, which option do they appear to support, and what evidence do you have?",
    ko: "시장·산업·정책·회사·직무의 어떤 변화가 이 결정에 영향을 주며, 어느 선택지와 더 맞아 보이고 그 근거는 무엇인가요?",
    sample: "",
  },
  {
    id: 6,
    category: "External Pressure",
    text: "What external validation is still missing before Option B becomes more defensible?",
    ko: "Option B를 더 구체적으로 검토하기 전에 아직 어떤 외부 검증이 부족한가요?",
    sample: "",
  },
  {
    id: 7,
    category: "Internal Readiness",
    text: "Which option better fits your long-term identity, and what personal reconfiguration would Option B require?",
    ko: "어느 선택지가 장기적인 정체성에 더 맞으며, Option B를 위해 어떤 개인적 재구성이 필요할까요?",
    sample: "",
  },
  {
    id: 8,
    category: "Internal Readiness",
    text: "What skills, credentials, proof points, or execution capacity are still missing, and what personal load would Option B create?",
    ko: "아직 부족한 역량·자격·성과 근거·실행 능력은 무엇이며, Option B는 어떤 개인적 부담을 만들까요?",
    sample: "",
  },
  {
    id: 9,
    category: "Safety Margin",
    text: "How much financial or income room can you protect while testing this decision?",
    ko: "이 결정을 시험하는 동안 어느 정도의 재정·소득 여유를 보호할 수 있나요?",
    sample: "",
  },
  {
    id: 10,
    category: "Safety Margin",
    text: "What recovery or re-entry path remains if the test does not work?",
    ko: "실험이 기대대로 되지 않을 경우 어떤 회복·복귀·재진입 경로가 남아 있나요?",
    sample: "",
  },
  {
    id: 11,
    category: "Safety Margin",
    text: "What downside would reduce your room to test, recover, or try again?",
    ko: "어떤 하방 위험이 실험·회복·재시도할 수 있는 여지를 줄일까요?",
    sample: "",
  },
  {
    id: 12,
    category: "Support System",
    text: "What people, network, family, mentor, or institutional support exists across your options, and what support is still missing?",
    ko: "두 선택지에 활용할 수 있는 사람·네트워크·가족·멘토·기관의 지원은 무엇이며, 아직 부족한 지원은 무엇인가요?",
    sample: "",
  },
  {
    id: 13,
    category: "Timing and Constraints",
    text: "What deadlines, age, visa, family, company, or market constraints matter, and how would waiting make either option harder or safer?",
    ko: "어떤 마감·나이·비자·가족·회사·시장 제약이 중요하며, 기다리는 것이 각 선택지를 어떻게 더 어렵거나 안전하게 만들까요?",
    sample: "",
  },
  {
    id: 14,
    category: "Decision Switches",
    text: "What condition would make deeper commitment to Option B more defensible?",
    ko: "어떤 조건이 충족되면 Option B에 더 깊게 전념하는 것이 더 타당해질까요?",
    sample: "",
  },
  {
    id: 15,
    category: "Decision Switches",
    text: "What condition would make staying with Option A more defensible?",
    ko: "어떤 조건이 충족되면 Option A에 머무는 것이 더 타당해질까요?",
    sample: "",
  },
] as const;
export const intake15Groups = Array.from(
  new Set(intake15Questions.map(q => q.category))
).map(title => ({
  title,
  questions: intake15Questions.filter(q => q.category === title),
}));
export const intake15LegacyMap: Record<number, number[]> = {
  1: [2, 3],
  2: [4],
  3: [6, 7],
  4: [9, 10],
  5: [11, 12, 13],
  6: [14],
  7: [15, 16],
  8: [17, 18],
  9: [19],
  10: [20],
  11: [21],
  12: [22, 23, 24],
  13: [25, 26, 27],
  14: [28],
  15: [29],
};
export const intake15SelectorMap: Partial<
  Record<number, keyof CurrentCaseStructuredSelections>
> = { 8: 17, 9: 19, 10: 20, 11: 21, 12: 23, 13: 25 };
/** Engine-only expansion. Never persist this representation as raw answers. */
export function adaptIntake15(
  preview: { decision: string; optionA: string; optionB: string },
  answers: Record<number, string>
): Record<number, string> {
  const legacy: Record<number, string> = {
    1: preview.decision,
    5: preview.optionA,
    8: preview.optionB,
  };
  for (const [id, targets] of Object.entries(intake15LegacyMap))
    for (const target of targets) legacy[target] = answers[Number(id)] || "";
  return legacy;
}
export function completedIntake15(
  answers: Record<number, string>,
  selections: CurrentCaseStructuredSelections
) {
  return intake15Questions.filter(
    q =>
      answers[q.id]?.trim() &&
      (intake15SelectorMap[q.id] === undefined ||
        selections[intake15SelectorMap[q.id]!] !== null)
  ).length;
}
