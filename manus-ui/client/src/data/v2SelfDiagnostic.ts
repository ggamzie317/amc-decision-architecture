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
    evidence: ["customer interviews and paid trials", "고객 인터뷰와 유료 시험 결과"],
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
    cost: ["income and time costs of a change", "변경에 따른 소득·시간 비용"],
    evidence: ["written role options and actual workload records", "역할 조정안과 실제 업무량 기록"],
  },
  "Family Constraint-heavy Decision": {
    publicTarget: ["the role's time and location requirements", "목표 경로의 시간·지역 조건"],
    goal: ["a path compatible with family needs", "가족의 필요와 함께 실행할 경로"],
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
    { id: "public", step: 2, title: "외부 요건·수요", question: `${objectWithParticle(target)} 직접 확인했나요? 관심이나 일반 자료와 본인에게 적용되는 조건을 구분해 보세요.`, example: `확인 근거 예: ${c.evidence[i]}`, bands: [] },
    { id: "readiness", step: 3, title: "역량·부족한 자원", question: `${objectWithParticle(goal)} 위해 직접 할 수 있는 일은 무엇인가요? 부족한 역량과 필요한 도움을 구분했나요?`, example: "확인 근거 예: 수행한 일의 결과물과 부족한 역량 목록", bands: ["internalReadiness"] },
    { id: "financial", step: 4, title: "재정·손실", question: `생활비를 포함해 ${cost}까지 구분해 보았나요? 재정 여유와 감당할 손실 위험을 각각 선택하세요.`, example: "확인 근거 예: 생활비·추가 지출·손실 시나리오", bands: ["financialRoom", "downsideExposure"] },
    { id: "recovery", step: 4, title: "중단·복귀", question: `${objectWithParticle(goal)} 중단한다면 정리 비용과 현재 소득·경력으로 돌아갈 경로를 확인했나요?`, example: "확인 근거 예: 중단 시점, 계약 조건, 복귀 가능한 직무", bands: ["reversibility"] },
    { id: "capacity", step: 5, title: "시간·지원", question: `${goal}에 실제로 쓸 수 있는 시간과 도움은 무엇인가요? 제약의 크기와 대안 실행 지원을 따로 선택하세요.`, example: "확인 근거 예: 주간 일정과 도움을 약속한 사람·조직", bands: ["constraintLoad", "optionBSupport"] },
  ];
  return [
    { id: "public", step: 2, title: "Public requirements and demand", question: `Have you directly checked ${target}? Separate general interest or broad data from conditions that apply to your case.`, example: `Basis to review: ${c.evidence[i]}`, bands: [] },
    { id: "readiness", step: 3, title: "Capabilities and gaps", question: `What can you do directly for ${goal}, and what skills or help are still missing?`, example: "Basis to review: completed work and a list of missing capabilities", bands: ["internalReadiness"] },
    { id: "financial", step: 4, title: "Finances and loss", question: `Have you separated living expenses from ${cost}? Select financial room and downside exposure independently.`, example: "Basis to review: living costs, extra spending and loss scenarios", bands: ["financialRoom", "downsideExposure"] },
    { id: "recovery", step: 4, title: "Stopping and re-entry", question: `If ${goal} stops, have you checked the exit costs and a route back to income and career continuity?`, example: "Basis to review: stopping point, contract terms and viable return roles", bands: ["reversibility"] },
    { id: "capacity", step: 5, title: "Time and support", question: `What time and help are actually available for ${goal}? Select constraint load and Option B support independently.`, example: "Basis to review: a weekly schedule and specific support commitments", bands: ["constraintLoad", "optionBSupport"] },
  ];
}

export function selfCheckComplete(card: SelfCheckCard, checks: SelfChecks, selections: Record<keyof V2Bands, boolean>): boolean {
  const answer = checks[card.id];
  return answer.status !== null && (answer.status !== "checked" || !!answer.detail.trim()) && card.bands.every(band => selections[band]);
}
