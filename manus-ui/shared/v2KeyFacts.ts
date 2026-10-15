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
  /**
   * Research areas the hint is relevant to (audit L3). A topic search gets the
   * hint only when it covers one of these areas; without a list it is global.
   */
  areas?: readonly string[];
  /** What this situation means the person should check; shown in the analysis. */
  check?: Pair;
};
export type V2KeyFactQuestion = { id: string; question: Pair; options: V2KeyFactOption[] };
type CaseType = V2EvidenceRequest["caseType"];

const timing: V2KeyFactQuestion = {
  id: "timing",
  question: ["언제쯤 옮기려고 하나요?", "When do you want to make the move?"],
  options: [
    { id: "within6", label: ["6개월 안에", "Within 6 months"], hint: "Timeline within 6 months: prioritise processing times and current application windows.",
      check: ["6개월 안에 옮기려면 신청·심사 기간과 마감일부터 거꾸로 일정을 잡으세요.", "To move within 6 months, plan backwards from processing times and deadlines."] },
    { id: "within12", label: ["6~12개월", "6–12 months"], hint: "Timeline 6–12 months." },
    { id: "later", label: ["1년보다 나중에", "In more than a year"], hint: "Timeline over a year: note scheduled rule changes.",
      check: ["1년 넘게 남았다면 그 사이에 바뀔 예정인 제도와 요건을 확인하세요.", "With over a year to go, check rules that are scheduled to change."] },
  ],
};
const nextSeat: V2KeyFactQuestion = {
  id: "offer",
  question: ["옮겨 갈 자리가 정해졌나요?", "Do you have a specific next job lined up?"],
  options: [
    { id: "offer", label: ["제안이나 합격 통보를 받았음", "I have an offer"], hint: "The person already has an offer: focus on onboarding procedures, contract and pay terms.", areas: ["compensation", "hiringDemand", "roleDemand"],
      check: ["제안을 받았다면 먼저 급여·수습·해지 조건을 공개된 시세와 비교하세요.", "With an offer, first compare its pay, probation and termination terms with public benchmarks."] },
    { id: "interviewing", label: ["지원했거나 면접 중", "Applying or interviewing"], hint: "The person is applying or interviewing: focus on requirements and pay benchmarks.", areas: ["requiredSkills", "compensation", "hiringDemand", "roleDemand"] },
    { id: "exploring", label: ["아직 알아보는 중", "Still looking around"], hint: "The person is still exploring: focus on demand and typical entry requirements.", areas: ["hiringDemand", "roleDemand", "requiredSkills"],
      check: ["아직 알아보는 중이라면 실제 채용 공고 3~5개의 요건을 모아 내 조건과 비교해 보세요.", "While you are still looking, collect the requirements of 3–5 real openings and compare them with yours."] },
  ],
};
const incomeChange: V2KeyFactQuestion = {
  id: "income",
  question: ["옮긴 뒤 소득이 줄어든다면 어디까지 괜찮나요?", "If your income drops after the move, how much can you accept?"],
  options: [
    { id: "same", label: ["지금 소득을 유지해야 함", "I need to keep my current income"], hint: "The person needs to keep their current income level: report pay figures with ranges.", areas: ["compensation"],
      check: ["지금 소득을 유지해야 한다면 목표 직무의 급여 중간값과 낮은 쪽 범위를 내 소득과 비교하세요.", "If you must keep your income, compare the target role's median and lower pay range with yours."] },
    { id: "small", label: ["10~20% 줄어드는 것까지 괜찮음", "A drop of up to 10–20% is fine"] },
    { id: "large", label: ["그보다 더 줄어도 괜찮음", "A bigger drop is fine"] },
  ],
};

const sets: Partial<Record<CaseType, V2KeyFactQuestion[]>> = {
  "Overseas Relocation": [
    {
      id: "offer",
      question: ["현지에서 일할 자리는 어디까지 진행됐나요?", "How far along are you with a job there?"],
      options: [
        { id: "offer", label: ["채용 제안이나 계약이 있음", "I have an offer or contract"], hint: "The person already has a job offer: focus on the work-pass application steps, who applies, processing time and fees.", areas: ["visaMobility"],
          check: ["제안을 받았다면 회사가 취업비자를 신청해 주는지, 제안 급여가 비자 최소 급여를 넘는지 먼저 확인하세요.", "With an offer, first check that the employer applies for your work visa and that the pay meets the visa minimum."] },
        { id: "interviewing", label: ["지원했거나 면접 중", "Applying or interviewing"], hint: "The person is applying or interviewing there: focus on hiring demand, pay benchmarks and work-pass thresholds.", areas: ["hiringDemand", "compensation", "visaMobility"] },
        { id: "exploring", label: ["아직 알아보는 중", "Still looking around"], hint: "The person is still exploring: focus on hiring demand in the field and typical work-pass eligibility.", areas: ["hiringDemand", "roleDemand", "visaMobility"],
          check: ["아직 알아보는 중이라면 현지 공고의 급여가 취업비자 최소 급여를 넘는지부터 확인하세요.", "While you are still looking, first check whether local pay for the role meets the work visa minimum."] },
      ],
    },
    {
      id: "route",
      question: ["어떤 방법으로 현지에 머물 계획인가요?", "How do you plan to get the right to live there?"],
      options: [
        { id: "employer", label: ["현지 회사를 통해 취업비자 받기", "A work visa through a local employer"], hint: "Route: employer-sponsored work pass.", areas: ["visaMobility"] },
        { id: "transfer", label: ["지금 회사에서 주재원·전보로 가기", "A transfer or posting by my current company"], hint: "Route: intra-company transfer or posting.", areas: ["visaMobility"],
          check: ["전보라면 현지 급여와 체류 비용을 누가 내는지, 돌아올 조건이 문서로 있는지 확인하세요.", "For a transfer, confirm who covers local pay and costs, and whether return terms are in writing."] },
        { id: "pr", label: ["영주권이나 이민 제도로 가기", "Permanent residence or a migration programme"], hint: "Route: permanent residence; cover the published path and minimum period to PR.", areas: ["visaMobility"],
          check: ["영주권이 목표라면 취업비자에서 영주권까지 가는 공식 경로와 최소 기간을 따로 확인하세요.", "If permanent residence is the goal, check the official path and minimum time from work visa to permanent residence."] },
        { id: "spouse", label: ["배우자·가족 비자로 가기", "A spouse or family visa"], hint: "Route: dependant or family visa; cover work rights for dependants.", areas: ["visaMobility"] },
        { id: "unsure", label: ["아직 정하지 않음", "Not decided yet"] },
      ],
    },
    {
      id: "family",
      question: ["누구와 함께 가나요?", "Who is moving with you?"],
      options: [
        { id: "alone", label: ["혼자 감", "Just me"] },
        { id: "partner", label: ["배우자나 파트너와 함께", "With my spouse or partner"], hint: "Family: spouse or partner moves too; cover dependant pass conditions and spouse work rights.", areas: ["visaMobility"],
          check: ["배우자와 함께 간다면 가족 비자 조건과 배우자가 현지에서 일할 수 있는지 확인하세요.", "With a partner, check family visa conditions and whether your partner may work there."] },
        { id: "children", label: ["배우자와 자녀와 함께", "With my partner and children"], hint: "Family: partner and school-age children move too; cover dependant passes and published international or local school fees.", areas: ["visaMobility", "geography"],
          check: ["자녀와 함께 간다면 가족 비자와 국제학교·현지학교 학비를 생활비와 따로 예산에 넣으세요.", "With children, budget family visas and international or local school fees separately from living costs."] },
      ],
    },
    {
      id: "language",
      question: ["현지에서 일할 때 쓰는 언어를 얼마나 잘하나요?", "How well do you speak the language used at work there?"],
      options: [
        { id: "fluent", label: ["업무에 문제없음", "Well enough for any work task"] },
        { id: "working", label: ["업무는 가능하지만 힘이 듦", "I can work in it, but it takes effort"] },
        { id: "basic", label: ["기초 수준", "Basic level"], hint: "The person has basic proficiency in the local working language: cover language requirements or tests where published.", areas: ["visaMobility", "requiredSkills", "hiringDemand"],
          check: ["업무 언어가 기초 수준이라면 목표 공고가 요구하는 언어 수준과 인정하는 어학 성적을 확인하세요.", "With basic language skills, check the language level and accepted language certificates in target openings."] },
      ],
    },
    timing,
  ],
  "Industry Transition": [
    {
      id: "experience",
      question: ["목표 직무와 관련된 일을 해 본 적이 있나요?", "Have you done work related to the target role?"],
      options: [
        { id: "direct", label: ["같은 일을 해 봤음", "I have done the same work"] },
        { id: "adjacent", label: ["비슷한 일을 해 봤음", "I have done similar work"], hint: "The person has adjacent experience: cover which skills transfer and typical bridging roles.", areas: ["requiredSkills", "roleDemand"],
          check: ["비슷한 일을 해 봤다면 실제 공고를 보고 그대로 쓸 수 있는 역량과 부족한 역량을 나눠 보세요.", "With similar experience, use real openings to separate skills you can carry over from skills you lack."] },
        { id: "none", label: ["관련된 일을 해 본 적 없음", "No related experience"], hint: "The person has no direct experience: cover entry-level routes, retraining and certifications.", areas: ["requiredSkills", "roleDemand"],
          check: ["관련 경험이 없다면 교육·자격증·인턴처럼 처음 들어가는 경로의 기간과 비용을 먼저 확인하세요.", "Without related experience, first check the time and cost of entry routes such as training, certificates or internships."] },
      ],
    },
    {
      id: "route",
      question: ["어떤 방법으로 옮기려고 하나요?", "How do you plan to make the move?"],
      options: [
        { id: "direct", label: ["경력직으로 바로 지원", "Apply directly as an experienced hire"], hint: "Route: direct experienced hire.", areas: ["hiringDemand", "roleDemand", "requiredSkills"] },
        { id: "internal", label: ["지금 회사 안에서 부서 이동", "Move to another team in my current company"], hint: "Route: internal transfer.", areas: ["roleDemand", "requiredSkills", "compensation"],
          check: ["사내 이동이라면 사내 공모 조건과 옮긴 뒤의 직급·급여를 확인하세요.", "For an internal move, check the internal posting rules and your grade and pay after the move."] },
        { id: "retraining", label: ["교육을 받거나 자격증을 딴 뒤 지원", "Train or get certified first, then apply"], hint: "Route: retraining or certification first; cover published programmes, duration and cost.", areas: ["requiredSkills"] },
      ],
    },
    incomeChange,
    timing,
  ],
  "MBA / EMBA / PhD Decision": [
    {
      id: "admission",
      question: ["입학은 어디까지 진행됐나요?", "Where are you with admission?"],
      options: [
        { id: "admitted", label: ["합격했음", "I have been admitted"], hint: "The person is admitted: focus on enrolment steps, tuition payment and funding deadlines.", areas: ["funding", "opportunityCost"],
          check: ["합격했다면 등록 마감일, 학비 납부 일정, 장학금 신청 기한을 먼저 확인하세요.", "If admitted, first check enrolment deadlines, tuition payment dates and funding application dates."] },
        { id: "applying", label: ["지원을 준비하거나 지원했음", "Preparing to apply or applied"], hint: "The person is applying: cover admission requirements and deadlines.", areas: ["programOutcomes"] },
        { id: "exploring", label: ["아직 알아보는 중", "Still looking around"] },
      ],
    },
    {
      id: "format",
      question: ["어떤 방식으로 다닐 계획인가요?", "How do you plan to study?"],
      options: [
        { id: "fulltime", label: ["일을 그만두고 전일제로", "Full-time, stopping work"], hint: "Format: full-time study; cover total cost including living costs.", areas: ["opportunityCost", "funding", "geographyMobility"],
          check: ["전일제라면 학비에 더해 공부하는 동안의 생활비와 줄어드는 소득까지 모두 계산하세요.", "For full-time study, add living costs and the income you give up to the tuition."] },
        { id: "parttime", label: ["일하면서 파트타임·주말로", "Part-time or weekends, while working"], hint: "Format: part-time or weekend while working; cover schedule and workload.", areas: ["opportunityCost", "programOutcomes"],
          check: ["일과 함께 한다면 수업 일정과 과제량이 지금 근무 시간과 맞는지 확인하세요.", "If you keep working, check the class schedule and workload against your working hours."] },
        { id: "online", label: ["온라인으로", "Online"], hint: "Format: online or remote; cover recognition of the degree.", areas: ["programOutcomes", "employmentRelevance", "geographyMobility"] },
      ],
    },
    {
      id: "funding",
      question: ["학비는 어떻게 마련할 계획인가요?", "How will you pay for it?"],
      options: [
        { id: "scholarship", label: ["장학금이나 지원금", "A scholarship or grant"], hint: "Funding: scholarship; cover published scholarships and their conditions.", areas: ["funding"] },
        { id: "employer", label: ["회사가 지원해 줌", "My employer pays"], hint: "Funding: employer sponsorship.", areas: ["funding"],
          check: ["회사가 지원한다면 꼭 다녀야 하는 기간과 중간에 그만둘 때 돌려줘야 하는 조건을 확인하세요.", "If your employer pays, check how long you must stay and what you repay if you leave early."] },
        { id: "self", label: ["내 돈으로", "With my own money"], hint: "Funding: self-funded; report total cost clearly.", areas: ["funding", "opportunityCost"] },
        { id: "unsure", label: ["아직 정하지 않음", "Not decided yet"] },
      ],
    },
    timing,
  ],
  Entrepreneurship: [
    {
      id: "validation",
      question: ["고객이 정말 원하는지 어디까지 확인했나요?", "How far have you checked that customers really want it?"],
      options: [
        { id: "paying", label: ["돈을 낸 고객이 있음", "I have paying customers"] },
        { id: "interviews", label: ["인터뷰나 시범 사용까지 해 봤음", "Interviews or trials only"], hint: "Validation: interviews or trials only; cover pricing benchmarks and paid-demand indicators.", areas: ["pricing", "customerDemand"],
          check: ["인터뷰 단계라면 다음에는 선결제나 계약처럼 실제로 돈을 내는 행동을 확인하세요.", "At the interview stage, next check for real payment, such as a pre-order or a contract."] },
        { id: "idea", label: ["아직 아이디어 단계", "Still an idea"], hint: "Validation: idea stage; cover market size, competitors and substitutes.", areas: ["marketGrowth", "competition", "customerDemand"],
          check: ["아이디어 단계라면 경쟁 서비스와 대안, 고객이 지금 그 문제에 쓰는 돈부터 확인하세요.", "At the idea stage, first check competitors, alternatives and what customers spend on the problem today."] },
      ],
    },
    {
      id: "funding",
      question: ["시작할 돈은 어떻게 마련하나요?", "How will you fund the start?"],
      options: [
        { id: "self", label: ["내 돈으로", "With my own money"], check: ["내 돈으로 시작한다면 잃어도 괜찮은 최대 금액부터 정하세요.", "With your own money, first set the most you can afford to lose."] },
        { id: "external", label: ["투자나 지원금을 받았음", "I have secured investment or a grant"] },
        { id: "none", label: ["아직 마련하지 못함", "Not secured yet"], hint: "Funding: none yet; cover public start-up support programmes, grants and loans.", areas: ["barriers"] },
      ],
    },
    {
      id: "job",
      question: ["지금 하는 일은 어떻게 할 계획인가요?", "What will you do about your current job?"],
      options: [
        { id: "keep", label: ["지금 일을 하면서 시작", "Start while keeping my job"], hint: "The person keeps their job while starting; cover rules on side businesses where published.", areas: ["regulation"],
          check: ["지금 일을 계속한다면 회사의 겸업 규정과 계약상 제한을 확인하세요.", "If you keep your job, check your employer's side-business rules and contract limits."] },
        { id: "quit", label: ["그만두고 사업에만 집중", "Quit and work on it full-time"] },
      ],
    },
    timing,
  ],
  "Family Constraint-heavy Decision": [
    {
      id: "care",
      question: ["돌봐야 하는 가족은 누구인가요?", "Who in your family needs your care?"],
      options: [
        { id: "children", label: ["자녀", "My children"], hint: "Care need: children; cover childcare availability and published costs.", areas: ["geography"],
          check: ["자녀를 돌봐야 한다면 어린이집·돌봄 서비스의 이용 시간과 비용을 확인하세요.", "If you care for children, check childcare hours and costs."] },
        { id: "elder", label: ["부모님이나 다른 가족", "My parents or other relatives"], hint: "Care need: elderly relatives; cover care services and leave rights.", areas: ["geography"] },
        { id: "both", label: ["자녀와 부모님 모두", "Both children and parents"] },
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

/**
 * Server side: ids → fixed hints. Unknown ids are rejected by the request
 * parser. With `areas`, a hint tied to other research areas is left out, so a
 * visa-only search is not told to look at pay benchmarks (audit L3).
 */
export function v2KeyFactHints(caseType: CaseType, ids: readonly string[], areas?: readonly string[]): string[] {
  const questions = v2KeyFactQuestions(caseType);
  return ids.flatMap(id => {
    const [qid, oid] = id.split(":");
    const option = questions.find(q => q.id === qid)?.options.find(o => o.id === oid);
    if (!option?.hint) return [];
    if (areas && option.areas && !option.areas.some(area => areas.includes(area))) return [];
    return [option.hint];
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
