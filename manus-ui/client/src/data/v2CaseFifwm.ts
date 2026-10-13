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
    target: ["Do you have a specific venture and first customer group?", "구체적인 사업과 첫 고객군이 있나요?"],
    questions: [
      q("formal", ["How well do you know the formal requirements to sell to your first customers (licences, contracts, purchasing)?", "첫 고객에게 판매하기 위한 공식 요건(인허가·계약·구매 절차)을 얼마나 알고 있나요?"],
        ["A requirement looks hard to meet", "충족하기 어려운 요건이 있음"], ["Partly known, or the route is uncertain", "일부만 알거나 충족 경로가 불확실"], ["Checked, with a route to meet them", "확인했고 충족 경로가 있음"]),
      q("informal", ["Is there someone who can connect you directly to first customers or key partners?", "첫 고객이나 핵심 파트너에게 직접 연결해 줄 사람이 있나요?"],
        ["No one", "없음"], ["Only indirect connections", "간접적인 연결만 있음"], ["A specific direct connection", "구체적인 연결이 있음"]),
      q("framework", ["Are co-founders, key people and decision rights settled?", "공동창업자·핵심 인력과 의사결정 구조가 정해져 있나요?"],
        ["Not settled, or in dispute", "정해지지 않았거나 이견이 있음"], ["Partly settled", "일부만 정해짐"], ["Settled", "정해져 있음"]),
      q("workflow", ["Can you repeatedly build and deliver the offer with your current time and skills?", "제품·서비스를 만들고 전달하는 일을 지금의 시간·역량으로 반복할 수 있나요?"],
        ["Hard for now", "현재로선 어려움"], ["Needs some adjustment", "일부 조정이 필요함"], ["Repeatable", "반복 가능함"]),
      q("marketPolicy", ["How exposed is the venture to regulation, platform policy or market shocks over the next 1–2 years?", "향후 1~2년 규제·플랫폼 정책·시장 충격의 영향을 얼마나 받을 것으로 보나요?"],
        ["High exposure", "큼"], ["Some exposure", "일부 있음"], ["Low exposure", "낮음"]),
    ],
  },
  "MBA / EMBA / PhD Decision": {
    target: ["Do you have a specific institution and program?", "구체적인 기관과 과정이 있나요?"],
    questions: [
      q("formal", ["Can you meet the admission, attendance and completion requirements under current conditions?", "입학·이수·졸업 요건(학점·출석·논문)을 현재 조건으로 충족할 수 있나요?"],
        ["A requirement looks hard to meet", "충족이 어려운 요건이 있음"], ["Partly uncertain", "일부가 불확실함"], ["Confirmed achievable", "충족 가능함을 확인함"]),
      q("informal", ["Is there someone (employer, adviser, alumni) who would actively support the program and what follows?", "회사·지도교수·동문 등 과정과 이후 경로를 적극 지원할 사람이 있나요?"],
        ["No one", "없음"], ["Weak or indirect", "약하거나 간접적임"], ["Specific active support", "구체적인 지원이 있음"]),
      q("framework", ["Does your employer's evaluation, promotion or mobility system recognise the degree?", "학위 취득이 회사의 평가·승진·직무 이동 체계에서 인정되나요?"],
        ["Not recognised", "인정되지 않음"], ["Partly or unclear", "일부 또는 불확실"], ["Clearly recognised", "명확히 인정됨"]),
      q("workflow", ["Can the weekly class and coursework schedule run alongside your work and life?", "주간 수업·과제 일정이 현재 업무·생활 흐름과 병행 가능한가요?"],
        ["Hard to combine", "병행이 어려움"], ["Needs adjustment", "조정이 필요함"], ["Can be combined", "병행 가능함"]),
      q("marketPolicy", ["How likely is the degree's value or funding (employer support, scholarships, loans) to change?", "학위의 가치나 재원(회사 지원·장학·대출 정책)이 바뀔 위험은 어느 정도인가요?"],
        ["High risk", "큼"], ["Some risk", "일부 있음"], ["Low risk", "낮음"]),
    ],
  },
  "Overseas Relocation": {
    target: ["Do you have a specific destination and work?", "구체적인 목적지와 일이 있나요?"],
    questions: [
      q("formal", ["How far have you checked the residence and work-permit requirements and process?", "체류·취업 자격의 요건과 절차를 얼마나 확인했나요?"],
        ["A requirement looks hard to meet", "충족이 어려운 요건이 있음"], ["Partly checked", "일부만 확인함"], ["Checked, with a route to meet them", "확인했고 충족 경로가 있음"]),
      q("informal", ["Is there a person or organisation that would actively help you settle and work locally?", "현지 정착과 일을 적극 도울 사람이나 조직이 있나요?"],
        ["No one", "없음"], ["Weak or indirect", "약하거나 간접적임"], ["Specific active help", "구체적인 도움이 있음"]),
      q("framework", ["Are the local employment form and reporting line (to whom, on what contract) confirmed?", "현지 고용 형태와 보고 체계(누구에게, 어떤 계약으로)가 확인됐나요?"],
        ["Not confirmed", "확인되지 않음"], ["Partly confirmed", "일부만 확인됨"], ["Confirmed", "확인됨"]),
      q("workflow", ["Do you expect to adapt to the language, work style and daily rhythm?", "언어·업무 방식·생활 리듬에 적응할 수 있다고 보나요?"],
        ["Heavy burden", "큰 부담이 있음"], ["Some burden", "일부 부담이 있음"], ["Can adapt", "적응 가능함"]),
      q("marketPolicy", ["How exposed are you to immigration policy, exchange-rate or local economic changes?", "이민 정책·환율·현지 경기 변화의 영향을 얼마나 받을 것으로 보나요?"],
        ["High exposure", "큼"], ["Some exposure", "일부 있음"], ["Low exposure", "낮음"]),
    ],
  },
  "Burnout-driven Decision": {
    target: ["Is the workplace you are assessing specific (current if staying, new if moving)?", "판단하려는 일터가 구체적인가요? (머무는 경우 현재 일터, 옮기는 경우 새 일터)"],
    questions: [
      q("formal", ["Is there a formal way to adjust workload or role scope (leave, role change) in that workplace?", "그 일터에 업무량·역할 범위를 공식적으로 조정할 수 있는 제도(휴직·역할 조정)가 있나요?"],
        ["None", "없음"], ["Exists but hard to use", "있지만 쓰기 어려움"], ["Exists and usable", "있고 쓸 수 있음"]),
      q("informal", ["Is there a manager or colleague who would actively support recovery and adjustment?", "회복과 업무 조정을 적극 도울 관리자나 동료가 있나요?"],
        ["No one", "없음"], ["Weak", "약함"], ["Yes", "있음"]),
      q("framework", ["Have restructuring or leadership changes in the last 2–3 years affected the workload?", "최근 2~3년 조직 개편·리더십 변화가 업무 부담에 영향을 주었나요?"],
        ["Multiple major changes", "큰 변화가 여러 차례"], ["Some change", "일부 변화"], ["No major change", "큰 변화 없음"]),
      q("workflow", ["Is the daily pace and intensity of work at a recoverable level?", "일상 업무의 속도와 강도가 회복 가능한 수준인가요?"],
        ["Hard to recover", "회복이 어려움"], ["Borderline", "경계 수준"], ["Recoverable", "회복 가능함"]),
      q("marketPolicy", ["How likely are industry or company changes to increase the load?", "업계·회사 상황 변화로 부담이 더 커질 가능성은?"],
        ["High", "큼"], ["Some", "일부 있음"], ["Low", "낮음"]),
    ],
  },
  "Family Constraint-heavy Decision": {
    target: ["Are the work and family schedule after the choice specific?", "선택 후의 일과 가족 일정이 구체적인가요?"],
    questions: [
      q("formal", ["Can you actually use formal arrangements such as flexible hours, remote work or leave?", "유연근무·재택·휴가 같은 공식 제도를 실제로 쓸 수 있나요?"],
        ["Cannot use them", "쓸 수 없음"], ["Limited", "제한적임"], ["Can use them", "쓸 수 있음"]),
      q("informal", ["Is there care or scheduling support from family or people around you?", "가족이나 주변의 돌봄·일정 지원이 있나요?"],
        ["None", "없음"], ["Some", "일부 있음"], ["Stable support", "안정적으로 있음"]),
      q("framework", ["Are decisions and the division of roles within the family agreed?", "가족 안의 의사결정과 역할 분담이 합의되어 있나요?"],
        ["Not agreed", "합의되지 않음"], ["Partly agreed", "일부 합의"], ["Agreed", "합의됨"]),
      q("workflow", ["Can your daily schedule carry both work and family responsibilities?", "일상 일정에서 일과 가족 책임을 함께 감당할 수 있나요?"],
        ["Hard", "어려움"], ["Tight", "빠듯함"], ["Manageable", "감당 가능함"]),
      q("marketPolicy", ["How exposed are you to changes in care, education or housing costs and policy?", "돌봄·교육·주거 비용이나 정책 변화의 영향을 얼마나 받나요?"],
        ["High exposure", "큼"], ["Some exposure", "일부 있음"], ["Low exposure", "낮음"]),
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
        ? `사례 맞춤 구조 평가 · 고객 자기보고(외부 검증 전): ${label}.`
        : `Case-adapted structure assessment · customer self-report (not externally verified): ${label}.`,
    };
    answered++;
  }
  return answered ? { fifwm, fifwmSource: "case-adapted" } : null;
}
