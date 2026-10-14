import type { V2EvidenceRequest } from "./externalIntelligenceV2Request.js";

/**
 * Key facts (owner decision 2026-10-14, option A): a few fixed-choice questions
 * per decision type that make the research and the analysis specific to the
 * person's situation. They are never scored and never change the posture.
 * Only the controlled ids ("questionId:optionId") travel to the server; the
 * server turns them into the fixed English hints below, so no customer prose
 * is sent. Pairs are stored [Korean, English].
 */
type Pair = readonly [ko: string, en: string];
export type V2KeyFactOption = {
  id: string;
  label: Pair;
  /** Fixed research hint sent to the provider (English); omitted when it would not change the search. */
  hint?: string;
  /** What this situation means the person should check; shown in the analysis. */
  check?: Pair;
};
export type V2KeyFactQuestion = { id: string; question: Pair; options: V2KeyFactOption[] };
type CaseType = V2EvidenceRequest["caseType"];

const timing: V2KeyFactQuestion = {
  id: "timing",
  question: ["언제까지 움직이려고 하나요?", "When do you aim to move?"],
  options: [
    { id: "within6", label: ["6개월 안", "Within 6 months"], hint: "Timeline within 6 months: prioritise processing times and current application windows.",
      check: ["6개월 안에 움직이려면 신청·심사 기간과 마감일부터 역산해 일정을 잡아야 합니다.", "To move within 6 months, plan backwards from processing times and deadlines."] },
    { id: "within12", label: ["6~12개월", "6–12 months"], hint: "Timeline 6–12 months." },
    { id: "later", label: ["1년 이후", "More than a year"], hint: "Timeline over a year: note scheduled rule changes.",
      check: ["1년 이상 남았다면 그 사이 바뀔 예정인 제도·기준을 확인하세요.", "With over a year to go, check rules that are scheduled to change."] },
  ],
};
const nextSeat: V2KeyFactQuestion = {
  id: "offer",
  question: ["구체적인 다음 자리가 있나요?", "Is there a concrete next position?"],
  options: [
    { id: "offer", label: ["제안·합격을 받음", "I have an offer"], hint: "The person already has an offer: focus on onboarding procedures, contract and pay terms.",
      check: ["제안이 있다면 계약 조건(급여·수습·해지 조건)을 공개 기준과 비교하는 것이 첫 단계입니다.", "With an offer, compare its terms (pay, probation, termination) with public benchmarks first."] },
    { id: "interviewing", label: ["지원·면접 중", "Applying or interviewing"], hint: "The person is applying or interviewing: focus on requirements and pay benchmarks." },
    { id: "exploring", label: ["아직 탐색 중", "Still exploring"], hint: "The person is still exploring: focus on demand and typical entry requirements.",
      check: ["아직 탐색 단계라면 실제 공고 3~5개의 요건을 모아 내 조건과 비교하는 것부터 시작하세요.", "While exploring, collect the requirements of 3–5 real openings and compare them with yours."] },
  ],
};
const incomeChange: V2KeyFactQuestion = {
  id: "income",
  question: ["감수할 수 있는 소득 변화는?", "What change in income can you accept?"],
  options: [
    { id: "same", label: ["현재 수준 유지가 필요", "I need to keep my current level"], hint: "The person needs to keep their current income level: report pay figures with ranges.",
      check: ["현재 소득 유지가 조건이라면 목표 직무의 급여 중앙값과 하위 구간을 내 소득과 비교하세요.", "If you must keep your income, compare the target's median and lower pay range with yours."] },
    { id: "small", label: ["10~20% 감소까지 가능", "Up to a 10–20% drop"] },
    { id: "large", label: ["그 이상 감소도 가능", "A larger drop is acceptable"] },
  ],
};

const sets: Partial<Record<CaseType, V2KeyFactQuestion[]>> = {
  "Overseas Relocation": [
    {
      id: "offer",
      question: ["현지 채용 상황은?", "Where are you with a job there?"],
      options: [
        { id: "offer", label: ["채용 제안·계약 있음", "I have an offer or contract"], hint: "The person already has a job offer: focus on the work-pass application steps, who applies, processing time and fees.",
          check: ["제안이 있다면 고용주가 취업비자를 신청하는지, 제안 급여가 비자 기준액을 넘는지 먼저 확인하세요.", "With an offer, check that the employer applies for the work pass and that the offered pay clears the threshold."] },
        { id: "interviewing", label: ["지원·면접 중", "Applying or interviewing"], hint: "The person is applying or interviewing there: focus on hiring demand, pay benchmarks and work-pass thresholds." },
        { id: "exploring", label: ["아직 탐색 중", "Still exploring"], hint: "The person is still exploring: focus on hiring demand in the field and typical work-pass eligibility.",
          check: ["아직 탐색 단계라면 현지 공고의 급여가 취업비자 기준액을 넘는지부터 확인하세요.", "While exploring, first check whether local pay for the role clears the work-pass threshold."] },
      ],
    },
    {
      id: "route",
      question: ["어떤 체류 경로를 생각하나요?", "Which residence route are you considering?"],
      options: [
        { id: "employer", label: ["현지 회사 취업비자", "Work visa through a local employer"], hint: "Route: employer-sponsored work pass." },
        { id: "transfer", label: ["현 회사의 주재원·전보", "Transfer or posting by my current company"], hint: "Route: intra-company transfer or posting.",
          check: ["전보라면 현지 급여·체류 비용을 누가 부담하는지, 복귀 조건이 문서에 있는지 확인하세요.", "For a transfer, confirm who pays local pay and costs, and whether return terms are in writing."] },
        { id: "pr", label: ["영주권·이민 프로그램", "Permanent residence or migration programme"], hint: "Route: permanent residence; cover the published path and minimum period to PR.",
          check: ["영주권이 목표라면 취업비자에서 영주권까지 공식 경로와 최소 기간을 따로 확인해야 합니다.", "If PR is the goal, check the official path and minimum time from work visa to PR."] },
        { id: "spouse", label: ["배우자·가족 비자", "Spouse or family visa"], hint: "Route: dependant or family visa; cover work rights for dependants." },
        { id: "unsure", label: ["아직 모름", "Not sure yet"] },
      ],
    },
    {
      id: "family",
      question: ["함께 이동하는 가족은?", "Who moves with you?"],
      options: [
        { id: "alone", label: ["혼자", "Just me"] },
        { id: "partner", label: ["배우자·파트너", "Spouse or partner"], hint: "Family: spouse or partner moves too; cover dependant pass conditions and spouse work rights.",
          check: ["배우자가 함께라면 부양가족 비자 조건과 배우자의 현지 취업 가능 여부를 확인하세요.", "With a partner, check dependant visa conditions and whether your partner may work."] },
        { id: "children", label: ["배우자와 자녀", "Partner and children"], hint: "Family: partner and school-age children move too; cover dependant passes and published international or local school fees.",
          check: ["자녀가 함께라면 부양가족 비자와 학비(국제학교·현지학교)를 생활비와 별도로 예산에 넣으세요.", "With children, budget dependant visas and school fees separately from living costs."] },
      ],
    },
    {
      id: "language",
      question: ["현지 업무 언어 수준은?", "Your level in the local working language?"],
      options: [
        { id: "fluent", label: ["업무에 문제없음", "Fully professional"] },
        { id: "working", label: ["업무 가능하지만 부담", "Workable but effortful"] },
        { id: "basic", label: ["기초 수준", "Basic"], hint: "The person has basic proficiency in the local working language: cover language requirements or tests where published.",
          check: ["업무 언어가 기초 수준이라면 목표 직무 공고의 언어 요건과 인정 시험을 확인하세요.", "With basic language skills, check the language requirements and accepted tests in target openings."] },
      ],
    },
    timing,
  ],
  "Industry Transition": [
    {
      id: "experience",
      question: ["목표 직무와 관련된 경험은?", "Experience related to the target role?"],
      options: [
        { id: "direct", label: ["같은 업무를 해 봄", "I have done this work"] },
        { id: "adjacent", label: ["비슷한 업무를 해 봄", "I have done similar work"], hint: "The person has adjacent experience: cover which skills transfer and typical bridging roles.",
          check: ["비슷한 경험이라면 옮겨 갈 수 있는 역량과 부족한 역량을 공고 기준으로 나눠 보세요.", "With adjacent experience, separate transferable and missing skills using real openings."] },
        { id: "none", label: ["관련 경험 없음", "No related experience"], hint: "The person has no direct experience: cover entry-level routes, retraining and certifications.",
          check: ["관련 경험이 없다면 신입·전환 경로(교육·자격·인턴)의 기간과 비용을 먼저 확인하세요.", "Without related experience, check the time and cost of entry routes (training, certification, internships)."] },
      ],
    },
    {
      id: "route",
      question: ["어떤 경로로 들어가려 하나요?", "How do you plan to get in?"],
      options: [
        { id: "direct", label: ["경력직으로 바로 지원", "Apply directly as an experienced hire"], hint: "Route: direct experienced hire." },
        { id: "internal", label: ["현 회사 안에서 이동", "Move inside my current company"], hint: "Route: internal transfer.",
          check: ["사내 이동이라면 사내 공모 조건과 이동 후 직급·급여 기준을 확인하세요.", "For an internal move, check internal posting rules and the grade and pay after moving."] },
        { id: "retraining", label: ["교육·자격 취득 후 지원", "Retrain or certify first"], hint: "Route: retraining or certification first; cover published programmes, duration and cost." },
      ],
    },
    incomeChange,
    timing,
  ],
  "MBA / EMBA / PhD Decision": [
    {
      id: "admission",
      question: ["입학 상태는?", "Admission status?"],
      options: [
        { id: "admitted", label: ["합격함", "Admitted"], hint: "The person is admitted: focus on enrolment steps, tuition payment and funding deadlines.",
          check: ["합격했다면 등록 마감·학비 납부 일정과 장학금 신청 기한을 먼저 확인하세요.", "If admitted, check enrolment deadlines, tuition payment and funding application dates."] },
        { id: "applying", label: ["지원 준비·지원 중", "Applying"], hint: "The person is applying: cover admission requirements and deadlines." },
        { id: "exploring", label: ["아직 탐색 중", "Still exploring"] },
      ],
    },
    {
      id: "format",
      question: ["어떤 형태로 다닐 계획인가요?", "Which format do you plan?"],
      options: [
        { id: "fulltime", label: ["전일제 (일을 그만둠)", "Full-time (stop working)"], hint: "Format: full-time study; cover total cost including living costs.",
          check: ["전일제라면 학비에 더해 학업 기간의 생활비와 소득 공백 전체를 계산해야 합니다.", "Full-time study means adding living costs and the full income gap to tuition."] },
        { id: "parttime", label: ["파트타임·주말 (일과 병행)", "Part-time or weekend (keep working)"], hint: "Format: part-time or weekend while working; cover schedule and workload.",
          check: ["병행이라면 수업 일정과 과제량이 현재 근무 시간과 맞는지 확인하세요.", "If combining with work, check the class schedule and workload against your hours."] },
        { id: "online", label: ["온라인·원격", "Online or remote"], hint: "Format: online or remote; cover recognition of the degree." },
      ],
    },
    {
      id: "funding",
      question: ["학비는 어떻게 마련하나요?", "How will you fund it?"],
      options: [
        { id: "scholarship", label: ["장학금·지원금", "Scholarship or grant"], hint: "Funding: scholarship; cover published scholarships and their conditions." },
        { id: "employer", label: ["회사 지원", "Employer sponsorship"], hint: "Funding: employer sponsorship.",
          check: ["회사 지원이라면 의무 근무 기간과 중도 퇴사 시 상환 조건을 확인하세요.", "With employer sponsorship, check the service commitment and repayment terms if you leave."] },
        { id: "self", label: ["자비", "Self-funded"], hint: "Funding: self-funded; report total cost clearly." },
        { id: "unsure", label: ["아직 모름", "Not sure yet"] },
      ],
    },
    timing,
  ],
  Entrepreneurship: [
    {
      id: "validation",
      question: ["고객 검증은 어디까지 했나요?", "How far have you validated customers?"],
      options: [
        { id: "paying", label: ["돈을 낸 고객이 있음", "I have paying customers"] },
        { id: "interviews", label: ["인터뷰·시범 사용까지", "Interviews or trials only"], hint: "Validation: interviews or trials only; cover pricing benchmarks and paid-demand indicators.",
          check: ["인터뷰 단계라면 다음 시험은 '돈을 내겠다'는 실제 행동(선결제·계약)을 확인하는 것입니다.", "At the interview stage, the next test is a real commitment to pay (pre-order, contract)."] },
        { id: "idea", label: ["아이디어 단계", "Idea stage"], hint: "Validation: idea stage; cover market size, competitors and substitutes.",
          check: ["아이디어 단계라면 경쟁·대체 서비스와 고객이 지금 쓰는 돈부터 확인하세요.", "At the idea stage, check competitors, substitutes and what customers spend today."] },
      ],
    },
    {
      id: "funding",
      question: ["초기 자금은?", "Initial funding?"],
      options: [
        { id: "self", label: ["자기 자금", "My own money"], check: ["자기 자금이라면 잃어도 되는 금액의 상한을 먼저 정하세요.", "With your own money, set a ceiling on what you can afford to lose."] },
        { id: "external", label: ["투자·지원금 확보", "Investment or grant secured"] },
        { id: "none", label: ["아직 없음", "None yet"], hint: "Funding: none yet; cover public start-up support programmes, grants and loans." },
      ],
    },
    {
      id: "job",
      question: ["본업은 어떻게 하나요?", "What about your current job?"],
      options: [
        { id: "keep", label: ["본업을 유지하며 시작", "Start while keeping my job"], hint: "The person keeps their job while starting; cover rules on side businesses where published.",
          check: ["본업을 유지한다면 회사의 겸업 규정과 계약상 제한을 확인하세요.", "If you keep your job, check your employer's side-business rules and contract limits."] },
        { id: "quit", label: ["퇴사 후 전업", "Quit and go full-time"] },
      ],
    },
    timing,
  ],
  "Family Constraint-heavy Decision": [
    {
      id: "care",
      question: ["돌봄이 필요한 가족은?", "Who needs care?"],
      options: [
        { id: "children", label: ["자녀", "Children"], hint: "Care need: children; cover childcare availability and published costs.",
          check: ["자녀 돌봄이 필요하다면 보육 시설의 이용 가능 시간과 비용을 확인하세요.", "With childcare needs, check provider hours and costs."] },
        { id: "elder", label: ["부모·가족", "Parents or relatives"], hint: "Care need: elderly relatives; cover care services and leave rights." },
        { id: "both", label: ["둘 다", "Both"] },
      ],
    },
    nextSeat,
    incomeChange,
    timing,
  ],
};

export function v2KeyFactQuestions(caseType: CaseType): V2KeyFactQuestion[] {
  return sets[caseType] ?? [nextSeat, incomeChange, timing];
}

export type V2KeyFacts = Record<string, string>;

/** Controlled ids for the request: "question:option", only for answered catalogue entries. */
export function v2KeyFactIds(caseType: CaseType, facts: V2KeyFacts): string[] {
  return v2KeyFactQuestions(caseType).flatMap(q => {
    const option = q.options.find(o => o.id === facts[q.id]);
    return option ? [`${q.id}:${option.id}`] : [];
  });
}

/** Server side: ids → fixed hints. Unknown ids are rejected by the request parser. */
export function v2KeyFactHints(caseType: CaseType, ids: readonly string[]): string[] {
  const questions = v2KeyFactQuestions(caseType);
  return ids.flatMap(id => {
    const [qid, oid] = id.split(":");
    const hint = questions.find(q => q.id === qid)?.options.find(o => o.id === oid)?.hint;
    return hint ? [hint] : [];
  });
}

export function v2ValidKeyFactId(caseType: CaseType, id: unknown): boolean {
  if (typeof id !== "string") return false;
  const [qid, oid, extra] = id.split(":");
  return extra === undefined && !!v2KeyFactQuestions(caseType).find(q => q.id === qid)?.options.some(o => o.id === oid);
}

/** Answered facts with their label and check line, for the analysis and report. */
export function v2KeyFactReadings(caseType: CaseType, facts: V2KeyFacts, ko: boolean) {
  return v2KeyFactQuestions(caseType).flatMap(q => {
    const option = q.options.find(o => o.id === facts[q.id]);
    if (!option) return [];
    return [{ id: q.id, question: q.question[ko ? 0 : 1], answer: option.label[ko ? 0 : 1], check: option.check?.[ko ? 0 : 1] }];
  });
}
