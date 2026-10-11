import rules from "./generated/fifwm-rules.json";
import {
  buildFifwmFromReportPayload,
  buildUnavailableFifwm,
  type ProductApplicationBuildInput,
} from "./amcProductApplicationV3";
import type { V2CaseType } from "./amcV2Model";
import type { V2Language } from "./v2Language";

export type CanonicalFifwmAnswers = Record<string, string | null | undefined>;
export type CanonicalFifwmAssessment = {
  targetRoleStatus: "known" | "not_applicable" | "unsure" | null;
  answers: CanonicalFifwmAnswers;
};
export const initialCanonicalFifwmAssessment = (): CanonicalFifwmAssessment => ({
  targetRoleStatus: null,
  answers: {},
});

// These cases can have a target employer/unit and role. The customer must still
// confirm one exists; a generic industry, startup or degree is not that role.
export function v2CanAskCanonicalFifwm(caseType: V2CaseType): boolean {
  return caseType === "Industry Transition" ||
    caseType === "Role Upgrade / Downgrade" ||
    caseType === "Corporate Stay vs Exit";
}

export const canonicalFifwmFields = rules.fields;

const koQuestions: Record<number, string> = {
  18: "목표 회사나 사업부에 최근 2~3년 동안 큰 조직 개편이나 리더십 변화가 있었나요?",
  19: "목표 직무·팀에서 성과를 내도록 적극적으로 도와줄 관리자나 선임 동료가 있나요?",
  20: "목표 직무의 의사결정 권한과 보고 체계를 얼마나 명확히 알고 있나요?",
  21: "목표 직무의 일상 업무 흐름과 속도를 어떻게 보고 있나요?",
  22: "향후 3~5년 동안 목표 직무가 정책·규제·시장 변화의 영향을 얼마나 받을 것으로 보나요?",
};
const choiceLabels: Record<string, readonly [string, string]> = {
  major_changes: ["큰 변화가 여러 차례 있었음", "Multiple major changes"],
  some_changes: ["눈에 띄는 변화나 불확실성이 있음", "Noticeable change or uncertainty"],
  no_changes: ["큰 변화는 없었음", "No major change"],
  none: ["적극적으로 지원할 사람 없음", "No active sponsor"],
  weak: ["호의는 있지만 적극적 지원은 불확실함", "Some goodwill; active support is uncertain"],
  strong: ["적극적으로 지원할 관리자나 선임 동료가 있음", "Active manager or senior-colleague support"],
  not_clear: ["의사결정·보고 체계가 불명확함", "Decision and reporting lines are unclear"],
  somewhat_clear: ["일부만 파악함", "Partly understood"],
  clear: ["명확히 파악함", "Clearly understood"],
  very_slow_or_chaotic: ["매우 느리거나 혼란스러움", "Very slow or chaotic"],
  mixed: ["원활한 부분과 어려운 부분이 섞여 있음", "Mixed"],
  clear_and_sustainable: ["명확하고 지속 가능해 보임", "Clear and sustainable"],
  high_exposure: ["영향을 크게 받을 것으로 보임", "High exposure"],
  medium_exposure: ["일부 영향을 받을 것으로 보임", "Some exposure"],
  low_exposure: ["영향이 낮을 것으로 보임", "Low exposure"],
};

export function canonicalFifwmQuestion(number: number, language: V2Language): string {
  if (language === "ko") return koQuestions[number] ?? "";
  const original = rules.fields.find(field => field.number === number)?.question ?? "";
  return original.split("\n\n").at(-1)?.replace(/^\d+\.\s*/, "") ?? "";
}
export function canonicalFifwmChoiceLabel(value: string, language: V2Language): string {
  const label = choiceLabels[value];
  return label ? label[language === "ko" ? 0 : 1] : value;
}

/** Only exact canonical choices enter the generated Python result lookup. */
export function buildV2CanonicalFifwm(
  caseType: V2CaseType,
  language: V2Language,
  assessment?: CanonicalFifwmAssessment,
): Pick<ProductApplicationBuildInput, "fifwm" | "fifwmSource"> {
  const unavailable = {
    fifwm: buildUnavailableFifwm(language),
    fifwmSource: "unavailable" as const,
  };
  if (!v2CanAskCanonicalFifwm(caseType) || assessment?.targetRoleStatus !== "known") return unavailable;
  const payload: Record<string, unknown> = {};
  let validCount = 0;
  for (const field of rules.fields) {
    const value = assessment.answers[field.field];
    if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(field.choices, value)) continue;
    const score = Object.entries(field.choices).find(([choice]) => choice === value)?.[1];
    if (score !== 0 && score !== 1 && score !== 2) continue;
    payload[field.outputField] = score;
    payload[field.outputField.replace(/_Score$/, "_Text")] = language === "ko"
      ? `고객 자기보고(외부 검증 전): ${canonicalFifwmChoiceLabel(value, language)}.`
      : `Customer self-report (not externally verified): ${canonicalFifwmChoiceLabel(value, language)}.`;
    validCount++;
  }
  return validCount
    ? { fifwm: buildFifwmFromReportPayload(payload), fifwmSource: "canonical-current-case" }
    : unavailable;
}
