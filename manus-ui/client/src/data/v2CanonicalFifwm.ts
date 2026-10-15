import rules from "./generated/fifwm-rules.json";
import {
  buildFifwmFromReportPayload,
  buildUnavailableFifwm,
  type ProductApplicationBuildInput,
} from "./amcProductApplicationV3";
import type { V2CaseType } from "./amcV2Model";
import type { V2Language } from "./v2Language";
import { buildV2CaseFifwm, v2CaseFifwmSet } from "./v2CaseFifwm";

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
  // General Career Reconfiguration uses the original questions when a target
  // organization and role exist (owner approval 2026-10-14).
  return caseType === "Industry Transition" ||
    caseType === "General Career Reconfiguration" ||
    caseType === "Role Upgrade / Downgrade" ||
    caseType === "Corporate Stay vs Exit";
}

export const canonicalFifwmFields = rules.fields;

const koQuestions: Record<number, string> = {
  18: "목표 회사나 부서에 최근 2~3년 동안 큰 조직 개편이나 리더십 변화가 있었나요?",
  19: "목표 직무나 팀에서 내가 자리 잡도록 적극 도와줄 상사나 선배가 있나요?",
  20: "목표 직무에서 누가 결정하고 누구에게 보고하는지 얼마나 알고 있나요?",
  21: "목표 직무의 하루 일 흐름과 속도는 어떨 것 같나요?",
  22: "앞으로 3~5년 동안 정책·규제·시장 변화가 목표 직무에 얼마나 영향을 줄 것 같나요?",
};
const choiceLabels: Record<string, readonly [string, string]> = {
  major_changes: ["큰 변화가 여러 차례 있었음", "Several big changes"],
  some_changes: ["어느 정도 변화가 있었거나 앞으로가 불확실함", "Some change, or the future is uncertain"],
  no_changes: ["큰 변화는 없었음", "No big change"],
  none: ["적극적으로 도와줄 사람이 없음", "No one would actively help"],
  weak: ["호의적인 사람은 있지만 적극적으로 도울지는 모름", "Some people are friendly, but I don't know if they would actively help"],
  strong: ["적극적으로 도와줄 상사나 선배가 있음", "A manager or senior colleague would actively help"],
  not_clear: ["누가 결정하고 누구에게 보고하는지 잘 모름", "I don't know who decides or who I would report to"],
  somewhat_clear: ["일부만 알고 있음", "I know some of it"],
  clear: ["분명히 알고 있음", "I know it clearly"],
  very_slow_or_chaotic: ["일이 매우 느리거나 어수선함", "Very slow or chaotic"],
  mixed: ["원활한 부분과 어려운 부분이 섞여 있음", "Some parts run well, others do not"],
  clear_and_sustainable: ["흐름이 분명하고 오래 해 볼 만함", "Clear, and I could keep it up"],
  high_exposure: ["영향이 클 것 같음", "A big effect"],
  medium_exposure: ["어느 정도 영향이 있을 것 같음", "Some effect"],
  low_exposure: ["영향이 작을 것 같음", "Little effect"],
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
  if (v2CaseFifwmSet(caseType)) return buildV2CaseFifwm(caseType, language, assessment) ?? unavailable;
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
      ? `본인 응답 (외부 확인 전): ${canonicalFifwmChoiceLabel(value, language)}.`
      : `Your answer (not externally checked): ${canonicalFifwmChoiceLabel(value, language)}.`;
    validCount++;
  }
  return validCount
    ? { fifwm: buildFifwmFromReportPayload(payload), fifwmSource: "canonical-current-case" }
    : unavailable;
}
