import {
  buildUnavailableFifwm,
  type FifwmStructure,
  type ProductApplicationBuildInput,
} from "./amcProductApplicationV3";
import type { V2CaseType } from "./amcV2Model";
import type { V2Language } from "./v2Language";

/**
 * Case-adapted structure assessment (owner approval 2026-10-14, design in
 * docs/v2_case_fifwm_question_design.md). Same five factors and the same
 * 0/1/2 scale as the original Q18–22; a separate source label so it is never
 * presented as the original organization assessment. Unanswered, unsure and
 * not-applicable stay null.
 */
type Factor = keyof FifwmStructure;
type Bi = readonly [en: string, ko: string];
export type CaseFifwmQuestion = {
  field: string;
  factor: Factor;
  question: Bi;
  /** Ordered 0, 1, 2 like the original choice tables. */
  choices: readonly [Bi, Bi, Bi];
};
export type CaseFifwmSet = { target: Bi; questions: readonly CaseFifwmQuestion[] };

const q = (factor: Factor, question: Bi, c0: Bi, c1: Bi, c2: Bi): CaseFifwmQuestion => ({
  field: `case_${factor}`,
  factor,
  question,
  choices: [c0, c1, c2],
});

const sets: Partial<Record<V2CaseType, CaseFifwmSet>> = {
  Entrepreneurship: {
    target: ["Do you have a specific business idea and a first group of customers?", "구체적인 사업 아이템과 첫 고객층이 정해져 있나요?"],
    questions: [
      q("formal", ["Do you know what you need to sell to your first customers, such as licenses, contracts or their buying process?", "첫 고객에게 팔려면 필요한 인허가·계약·구매 절차를 알고 있나요?"],
        ["Some requirement looks hard to meet", "맞추기 어려운 요건이 있음"], ["I know some of it, or I am not sure how to meet it", "일부만 알거나, 어떻게 맞출지 아직 모름"], ["I have checked, and I know how to meet it", "확인했고 맞출 방법도 있음"]),
      q("informal", ["Is there someone who can introduce you directly to first customers or key partners?", "첫 고객이나 핵심 파트너를 직접 소개해 줄 사람이 있나요?"],
        ["No one", "없음"], ["Only someone who knows someone", "건너서 아는 사람만 있음"], ["Yes, a specific person", "구체적으로 소개해 줄 사람이 있음"]),
      q("framework", ["Have you settled who your co-founders and key people are, and who decides what?", "공동창업자와 핵심 인력, 누가 무엇을 결정할지 정해졌나요?"],
        ["Not settled, or we disagree", "정해지지 않았거나 의견이 갈림"], ["Partly settled", "일부만 정해짐"], ["Settled", "정해져 있음"]),
      q("workflow", ["With your current time and skills, can you keep making and delivering the product or service?", "지금의 시간과 역량으로 제품이나 서비스를 계속 만들어 전달할 수 있나요?"],
        ["Hard for now", "지금은 어려움"], ["Possible with some changes", "일부 조정하면 가능함"], ["Yes, I can keep it going", "계속 해낼 수 있음"]),
      q("marketPolicy", ["Over the next 1–2 years, how much could regulation, platform rules or market shocks hurt the business?", "앞으로 1~2년 동안 규제, 플랫폼 정책, 시장 변화가 사업에 얼마나 영향을 줄 것 같나요?"],
        ["A lot", "영향이 클 것 같음"], ["Somewhat", "어느 정도 영향이 있을 것 같음"], ["Very little", "영향이 작을 것 같음"]),
    ],
  },
  "MBA / EMBA / PhD Decision": {
    target: ["Do you have a specific school and program in mind?", "구체적으로 정한 학교와 과정이 있나요?"],
    questions: [
      q("formal", ["In your current situation, can you meet the admission, attendance and graduation requirements?", "지금 상황에서 입학·출석·졸업 요건을 맞출 수 있나요?"],
        ["Some requirement looks hard to meet", "맞추기 어려운 요건이 있음"], ["Some of it is unclear", "일부가 불확실함"], ["I have checked that I can meet them", "맞출 수 있음을 확인함"]),
      q("informal", ["Is there someone, such as your employer, an adviser or alumni, who would actively back you during and after the program?", "회사, 지도교수, 동문처럼 과정 중과 졸업 후를 적극 도와줄 사람이 있나요?"],
        ["No one", "없음"], ["Only loose or indirect help", "느슨하거나 건너서 받는 도움만 있음"], ["Yes, specific active help", "구체적으로 도와줄 사람이 있음"]),
      q("framework", ["Does your employer count the degree for evaluation, promotion or moving roles?", "회사가 평가·승진·직무 이동에서 이 학위를 인정하나요?"],
        ["No", "인정하지 않음"], ["Partly, or unclear", "일부만 인정하거나 불확실함"], ["Yes, clearly", "분명히 인정함"]),
      q("workflow", ["Can you fit weekly classes and coursework around your work and life?", "매주 수업과 과제를 지금의 일과 생활에 맞춰 해낼 수 있나요?"],
        ["Hard to fit in", "함께 하기 어려움"], ["Possible with changes", "조정하면 가능함"], ["Yes, it fits", "함께 할 수 있음"]),
      q("marketPolicy", ["How likely is it that the degree's value or its funding, such as employer support, scholarships or loans, will change?", "학위의 가치나 회사 지원·장학금·대출 같은 학비 지원이 바뀔 가능성은 어느 정도인가요?"],
        ["Quite likely", "바뀔 가능성이 큼"], ["Somewhat likely", "어느 정도 있음"], ["Unlikely", "바뀔 가능성이 작음"]),
    ],
  },
  "Overseas Relocation": {
    target: ["Do you have a specific destination and job?", "구체적으로 정한 나라·도시와 할 일이 있나요?"],
    questions: [
      q("formal", ["How far have you checked the requirements and steps to live and work there?", "현지에서 살고 일하기 위한 요건과 절차를 어디까지 확인했나요?"],
        ["Some requirement looks hard to meet", "맞추기 어려운 요건이 있음"], ["I have checked some of it", "일부만 확인함"], ["I have checked, and I know how to meet them", "확인했고 맞출 방법도 있음"]),
      q("informal", ["Is there a person or organization that would actively help you settle and work there?", "현지에 정착하고 일하는 것을 적극 도와줄 사람이나 기관이 있나요?"],
        ["No one", "없음"], ["Only loose or indirect help", "느슨하거나 건너서 받는 도움만 있음"], ["Yes, specific active help", "구체적으로 도와줄 사람이나 기관이 있음"]),
      q("framework", ["Is it confirmed how you will be employed there: who you report to and on what contract?", "현지에서 어떤 계약으로, 누구 밑에서 일할지 확인됐나요?"],
        ["Not confirmed", "확인되지 않음"], ["Partly confirmed", "일부만 확인됨"], ["Confirmed", "확인됨"]),
      q("workflow", ["Do you think you can adapt to the language, the way of working and daily life there?", "현지의 언어, 일하는 방식, 생활에 적응할 수 있을 것 같나요?"],
        ["It would be very hard", "부담이 클 것 같음"], ["It would take some effort", "어느 정도 부담이 있을 것 같음"], ["I can adapt", "적응할 수 있을 것 같음"]),
      q("marketPolicy", ["How much could changes in immigration rules, exchange rates or the local economy affect you?", "이민 정책, 환율, 현지 경기 변화가 나에게 얼마나 영향을 줄 것 같나요?"],
        ["A lot", "영향이 클 것 같음"], ["Somewhat", "어느 정도 영향이 있을 것 같음"], ["Very little", "영향이 작을 것 같음"]),
    ],
  },
  "Burnout-driven Decision": {
    target: ["Do you have a specific workplace in mind: your current one if you stay, or the new one if you move?", "생각하는 일터가 구체적인가요? 머문다면 지금 일터, 옮긴다면 새 일터를 떠올려 주세요."],
    questions: [
      q("formal", ["Does that workplace have a formal way to reduce workload or change your role, such as leave or a role change?", "그 일터에 휴직이나 역할 조정처럼 업무량을 공식적으로 줄일 수 있는 제도가 있나요?"],
        ["No", "없음"], ["Yes, but it is hard to use", "있지만 쓰기 어려움"], ["Yes, and I can use it", "있고 쓸 수 있음"]),
      q("informal", ["Is there a manager or colleague who would actively help you recover and adjust your work?", "회복하고 업무를 조정하도록 적극 도와줄 상사나 동료가 있나요?"],
        ["No one", "없음"], ["Some help, but not much", "도움이 있지만 크지 않음"], ["Yes", "있음"]),
      q("framework", ["Have restructuring or leadership changes in the last 2–3 years added to your workload?", "최근 2~3년 동안 조직 개편이나 리더십 변화로 업무 부담이 커졌나요?"],
        ["Several big changes", "큰 변화가 여러 차례 있었음"], ["Some change", "어느 정도 변화가 있었음"], ["No big change", "큰 변화는 없었음"]),
      q("workflow", ["Is your day-to-day pace and intensity of work something you can recover from?", "매일 하는 일의 속도와 강도가 쉬면 회복할 수 있는 수준인가요?"],
        ["Hard to recover from", "회복하기 어려움"], ["Borderline", "겨우 버틸 만함"], ["I can recover", "회복할 수 있음"]),
      q("marketPolicy", ["How likely are changes in your industry or company to add to the load?", "업계나 회사 상황이 바뀌어 부담이 더 커질 가능성은 어느 정도인가요?"],
        ["Quite likely", "가능성이 큼"], ["Somewhat likely", "어느 정도 있음"], ["Unlikely", "가능성이 작음"]),
    ],
  },
  "Family Constraint-heavy Decision": {
    target: ["Do you know concretely what your work and family schedule would look like after the choice?", "선택한 뒤의 일과 가족 일정이 구체적으로 그려지나요?"],
    questions: [
      q("formal", ["Can you actually use formal arrangements such as flexible hours, remote work or leave?", "유연근무, 재택, 휴가 같은 제도를 실제로 쓸 수 있나요?"],
        ["I can't use them", "쓸 수 없음"], ["Only to a limited degree", "제한적으로만 쓸 수 있음"], ["Yes, I can use them", "쓸 수 있음"]),
      q("informal", ["Can family or people around you help with care or scheduling?", "가족이나 주변 사람이 돌봄이나 일정을 도와줄 수 있나요?"],
        ["No", "없음"], ["Some help", "어느 정도 있음"], ["Yes, reliably", "꾸준히 도와줄 사람이 있음"]),
      q("framework", ["Has your family agreed on decisions and who does what?", "가족 안에서 결정 방식과 역할 분담이 합의됐나요?"],
        ["Not agreed", "합의되지 않음"], ["Partly agreed", "일부만 합의됨"], ["Agreed", "합의됨"]),
      q("workflow", ["Can your daily schedule cover both work and family responsibilities?", "하루 일정 안에서 일과 가족을 함께 챙길 수 있나요?"],
        ["Hard", "어려움"], ["Tight", "빠듯함"], ["Manageable", "감당할 수 있음"]),
      q("marketPolicy", ["How much could changes in care, education or housing costs and rules affect you?", "돌봄·교육·주거 비용이나 제도가 바뀌면 나에게 얼마나 영향이 있나요?"],
        ["A lot", "영향이 큼"], ["Somewhat", "어느 정도 있음"], ["Very little", "영향이 작음"]),
    ],
  },
};

export function v2CaseFifwmSet(caseType: V2CaseType): CaseFifwmSet | null {
  return sets[caseType] ?? null;
}

/** Score only exact choice indexes ("0" | "1" | "2"); anything else stays unassessed. */
export function buildV2CaseFifwm(
  caseType: V2CaseType,
  language: V2Language,
  assessment?: { targetRoleStatus: string | null; answers: Record<string, string | null | undefined> },
): Pick<ProductApplicationBuildInput, "fifwm" | "fifwmSource"> | null {
  const set = v2CaseFifwmSet(caseType);
  if (!set || assessment?.targetRoleStatus !== "known") return null;
  const ko = language === "ko";
  const fifwm = buildUnavailableFifwm(language);
  let answered = 0;
  for (const question of set.questions) {
    const raw = assessment.answers[question.field];
    if (raw !== "0" && raw !== "1" && raw !== "2") continue;
    const score = Number(raw) as 0 | 1 | 2;
    const label = question.choices[score][ko ? 1 : 0];
    fifwm[question.factor] = {
      score,
      reading: ko
        ? `본인 응답 (외부 확인 전): ${label}.`
        : `Your answer (not externally checked): ${label}.`,
    };
    answered++;
  }
  return answered ? { fifwm, fifwmSource: "case-adapted" } : null;
}
