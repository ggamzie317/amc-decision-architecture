import type { V2Language } from "./v2Language";

/** Launch-test feedback goes to the product inbox already used for founder notices. */
export const V2_FEEDBACK_ADDRESS = "report@allofmycareer.com";

export function v2FeedbackMailto(language: V2Language, submissionId?: string | null): string {
  const ko = language === "ko";
  const id = submissionId && /^AMC-\d{8}-[A-F0-9]{8}$/.test(submissionId) ? submissionId : "";
  const subject = ko ? `allofmycareer 테스트 의견${id ? ` (${id})` : ""}` : `allofmycareer test feedback${id ? ` (${id})` : ""}`;
  const body = ko
    ? ["1. 가장 도움이 된 부분:", "", "2. 이해하기 어려웠던 부분:", "", "3. 빠졌다고 느낀 근거나 정보:", "", "4. 지인에게 권하고 싶은 정도 (1~5):", "", id ? `기록 ID: ${id}` : ""].join("\n")
    : ["1. What helped most:", "", "2. What was hard to follow:", "", "3. Evidence or information that felt missing:", "", "4. How likely you would recommend it (1–5):", "", id ? `Record ID: ${id}` : ""].join("\n");
  return `mailto:${V2_FEEDBACK_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
