import type { V2Bands, V2CaseType } from "./amcV2Model";
import type { V2Language } from "./v2Language";

export type SelfCheckId = "public" | "readiness" | "financial" | "recovery" | "capacity";
export type SelfCheckStatus = "notChecked" | "unsure" | "checked";
export type SelfCheckAnswer = { status: SelfCheckStatus | null; detail: string };
export type SelfChecks = Record<SelfCheckId, SelfCheckAnswer>;
export type SelfCheckCard = {
  id: SelfCheckId;
  step: number;
  title: string;
  question: string;
  example: string;
  bands: readonly (keyof V2Bands)[];
};
type Pair = readonly [string, string];
type Context = { publicTarget: Pair; goal: Pair; cost: Pair; evidence: Pair };

const contexts: Record<V2CaseType, Context> = {
  Entrepreneurship: {
    publicTarget: ["the target customers' problem and actual willingness to pay", "목표 고객의 문제와 실제 지불 반응"],
    goal: ["the business idea", "창업 계획"],
    cost: ["business spending", "사업 비용"],
    evidence: ["customer interviews and paid trials", "고객 인터뷰와 유료 시범 판매 결과"],
  },
  "Industry Transition": {
    publicTarget: ["the target industry's hiring and role requirements", "목표 산업의 채용·직무 요건"],
    goal: ["the new industry role", "새 산업의 직무"],
    cost: ["transition and training costs", "전환·교육 비용"],
    evidence: ["current job postings and hiring feedback", "최근 채용 공고와 채용 담당자 피드백"],
  },
  "MBA / EMBA / PhD Decision": {
    publicTarget: ["the target program's requirements and relevant outcomes", "목표 과정의 지원 요건과 관련 성과"],
    goal: ["the degree path", "학위 진학"],
    cost: ["tuition and foregone income", "학비와 줄어드는 소득"],
    evidence: ["program requirements and graduate outcomes", "과정 모집 요강과 졸업생 성과 자료"],
  },
  "Overseas Relocation": {
    publicTarget: ["the destination's work and relocation requirements", "목표 지역의 취업·이동 요건"],
    goal: ["the overseas move", "해외 이동"],
    cost: ["moving and settlement costs", "이동·정착 비용"],
    evidence: ["official entry rules and local job requirements", "공식 체류 요건과 현지 채용 조건"],
  },
  "Role Upgrade / Downgrade": {
    publicTarget: ["the target role's scope and expectations", "목표 직무의 역할과 요구 사항"],
    goal: ["the role change", "직무 변경"],
    cost: ["compensation and transition costs", "보상 변화와 전환 비용"],
    evidence: ["role descriptions and manager feedback", "직무 설명과 담당자 피드백"],
  },
  "Burnout-driven Decision": {
    publicTarget: ["the available workload or role alternatives", "업무량을 조정하거나 역할을 바꿀 수 있는 경로"],
    goal: ["a less burdensome path", "부담을 줄이는 경로"],
    cost: ["income and time costs of a change", "바꿀 때 드는 소득·시간 비용"],
    evidence: ["written role options and actual workload records", "역할 조정안과 실제 업무량 기록"],
  },
  "Family Constraint-heavy Decision": {
    publicTarget: ["the role's time and location requirements", "목표 경로의 시간·지역 조건"],
    goal: ["a path compatible with family needs", "가족 사정과 함께 갈 수 있는 경로"],
    cost: ["care and income costs", "돌봄·소득 비용"],
    evidence: ["work schedules and available care arrangements", "근무 일정과 실제 가능한 돌봄 분담"],
  },
  "Corporate Stay vs Exit": {
    publicTarget: ["the exit path's actual opportunities and requirements", "퇴사 후 경로의 실제 기회와 요건"],
    goal: ["staying or leaving the organization", "잔류 또는 퇴사"],
    cost: ["income gap and exit costs", "소득 공백과 퇴사 비용"],
    evidence: ["current role terms and verified alternative opportunities", "현재 직무 조건과 확인된 대안 기회"],
  },
  "General Career Reconfiguration": {
    publicTarget: ["the new path's actual requirements", "새 경로의 실제 요건"],
    goal: ["the new career path", "새 경력 경로"],
    cost: ["learning and transition costs", "학습·전환 비용"],
    evidence: ["current requirements and practitioner feedback", "현재 요건과 현업 담당자 피드백"],
  },
};

export const selfCheckIds: readonly SelfCheckId[] = ["public", "readiness", "financial", "recovery", "capacity"];
function objectWithParticle(value: string): string {
  const last = value.at(-1) ?? "";
  const code = last.charCodeAt(0);
  const hasFinal = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${value}${hasFinal ? "을" : "를"}`;
}
export function initialSelfChecks(): SelfChecks {
  return Object.fromEntries(selfCheckIds.map(id => [id, { status: null, detail: "" }])) as SelfChecks;
}

export function selfCheckCards(caseType: V2CaseType, language: V2Language): SelfCheckCard[] {
  const c = contexts[caseType];
  const i = language === "ko" ? 1 : 0;
  const goal = c.goal[i], cost = c.cost[i], target = c.publicTarget[i];
  if (language === "ko") return [
    { id: "public", step: 2, title: "공개 요건과 수요", question: `${objectWithParticle(target)} 직접 확인해 봤나요? 막연한 관심이나 일반 자료가 아니라, 내게 적용되는 조건을 확인했는지 떠올려 보세요.`, example: `확인한 자료 예: ${c.evidence[i]}`, bands: [] },
    { id: "readiness", step: 3, title: "역량과 부족한 것", question: `${objectWithParticle(goal)} 위해 지금 바로 할 수 있는 일은 무엇인가요? 부족한 역량과 필요한 도움을 나눠 보았나요?`, example: "확인한 자료 예: 해 본 일의 결과물, 부족한 역량 목록", bands: ["internalReadiness"] },
    { id: "financial", step: 4, title: "돈과 손실", question: `생활비와 ${objectWithParticle(cost)} 나눠서 계산해 봤나요? 아래에서 재정 여유와 손실 위험을 각각 골라 주세요.`, example: "확인한 자료 예: 생활비, 추가 지출, 잘 안됐을 때의 손실", bands: ["financialRoom", "downsideExposure"] },
    { id: "recovery", step: 4, title: "중단과 복귀", question: `${objectWithParticle(goal)} 중간에 그만둔다면, 정리 비용과 지금의 소득·경력으로 돌아갈 길을 확인해 봤나요?`, example: "확인한 자료 예: 그만둘 시점, 계약 조건, 돌아갈 수 있는 직무", bands: ["reversibility"] },
    { id: "capacity", step: 5, title: "시간과 도움", question: `${goal}에 실제로 쓸 수 있는 시간과 도움은 얼마나 되나요? 아래에서 받을 수 있는 도움과 생활 속 제약을 각각 골라 주세요.`, example: "확인한 자료 예: 일주일 일정, 도와주기로 한 사람이나 기관", bands: ["constraintLoad", "optionBSupport"] },
  ];
  return [
    { id: "public", step: 2, title: "Requirements and demand", question: `Have you checked ${target} yourself? Think about the conditions that apply to you, not general interest or broad data.`, example: `What you might have checked: ${c.evidence[i]}`, bands: [] },
    { id: "readiness", step: 3, title: "Skills and gaps", question: `What can you do right now toward ${goal}? Have you separated the skills you lack from the help you need?`, example: "What you might have checked: results of work you have done, and a list of skills you lack", bands: ["internalReadiness"] },
    { id: "financial", step: 4, title: "Money and possible loss", question: `Have you worked out your living costs separately from ${cost}? Below, rate your financial room and your downside risk separately.`, example: "What you might have checked: living costs, extra spending, and what you would lose if it does not work out", bands: ["financialRoom", "downsideExposure"] },
    { id: "recovery", step: 4, title: "Stopping and going back", question: `If you stop ${goal} partway, have you checked what it would cost and how you would get back to your income and career?`, example: "What you might have checked: when you would stop, contract terms, and roles you could return to", bands: ["reversibility"] },
    { id: "capacity", step: 5, title: "Time and help", question: `How much time and help do you actually have for ${goal}? Below, rate the help available and the limits in your life separately.`, example: "What you might have checked: your weekly schedule, and people or organisations that agreed to help", bands: ["constraintLoad", "optionBSupport"] },
  ];
}

export function selfCheckComplete(card: SelfCheckCard, checks: SelfChecks, selections: Record<keyof V2Bands, boolean>): boolean {
  const answer = checks[card.id];
  return answer.status !== null && (answer.status !== "checked" || !!answer.detail.trim()) && card.bands.every(band => selections[band]);
}
