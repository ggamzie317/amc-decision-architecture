import type { ProductApplicationV3 } from "./amcProductApplicationV3";
import type { V2Language } from "./v2Language";

/**
 * States how much confirmed input the posture rests on. The engine treats an
 * unknown band as a middle value; this note says so instead of letting the
 * posture read as fully established. Display only — no score changes.
 */
export function v2PostureCoverageNote(core: ProductApplicationV3, language: V2Language) {
  const signals = Object.values(core.postureBasis);
  const known = signals.filter(signal => signal.band !== "unknown").length;
  const total = signals.length;
  const fifwmKnown = Object.values(core.decisionStructure.fifwm).filter(factor => factor.score !== null).length;
  const level = core.postureEvidenceCoverage;
  const ko = language === "ko";
  const assumed = known < total
    ? ko
      ? ` 확인되지 않은 ${total - known}개는 중간값으로 가정했습니다. 실제 상태가 확인되면 판단이 달라질 수 있습니다.`
      : ` The ${total - known} unconfirmed inputs were treated as middle values, so the reading may change once they are confirmed.`
    : "";
  const fifwm = fifwmKnown
    ? core.decisionStructure.fifwmSource === "case-adapted"
      ? ko ? ` 다섯 가지 관점 중 ${fifwmKnown}개는 이 사례에 맞춘 질문의 답을 반영했습니다.` : ` ${fifwmKnown} of the five lenses use your answers to questions adapted to this case.`
      : ko ? ` 다섯 가지 관점 중 ${fifwmKnown}개는 옮겨 갈 회사·직무 질문의 답을 반영했습니다.` : ` ${fifwmKnown} of the five lenses use your answers about the company and role you would move to.`
    : "";
  const lead = level === "limited"
    ? ko ? "근거 제한적: " : "Limited basis: "
    : level === "partial"
      ? ko ? "근거 일부 확인: " : "Partly confirmed: "
      : ko ? "근거 비교적 충분: " : "Stronger basis: ";
  const body = ko
    ? `이 판단은 판단에 쓰는 조건 ${total}개 중 ${known}개를 확인한 상태에서 계산했습니다.`
    : `This reading rests on ${known} of ${total} confirmed structural inputs.`;
  return { level, known, total, text: `${lead}${body}${fifwm}${assumed}` };
}
