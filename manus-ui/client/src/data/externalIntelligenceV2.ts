import { v2t, type V2CopyKey, type V2Language } from "./v2Language.js";
export type V2Provenance =
  | "USER_STRUCTURED"
  | "EXTERNAL_EVIDENCE"
  | "DERIVED_CORE_RULE"
  | "CASE_TEMPLATE_LABEL";
export type ExternalIntelligenceV2 = {
  status: "live" | "unavailable" | "demo";
  generatedAt: string | null;
  caseType: string;
  /** Partial means at least one cited source failed the public body check. */
  sourceCoverage?: "complete" | "partial";
  /** Provider confidence in bounded public context, never personal fit.
   * Absent for older snapshots and removed when a cited source is excluded. */
  contextConfidence?: "low" | "medium" | "high";
  /** Same search and cards in the other UI language (en/ko); never a new search. */
  translation?: ExternalIntelligenceV2;
  /** Client-only, set by the browser while a progressive search runs: research
   * area IDs whose topic search is still in flight, so their absence must read
   * as "still collecting", not "no evidence". Removed when every topic has
   * finished. Never sent to or accepted from the server. */
  pendingAreas?: string[];
  evidenceBlocks: Array<{
    /** Existing public-research ID; presentation routing only, never a score. */
    area?: string;
    dimension: string;
    headline: string;
    direction: "supportive" | "caution" | "mixed";
    fact: string;
    whyItMatters: string;
    /** One preparation step this fact implies for the customer; optional. */
    action?: string;
    sourceLabel: string;
    sourceUrl?: string;
    sourceDate?: string;
    sourceDateKind?: "published" | "updated";
    /** Reference period stated on the source page, in the card language; optional. */
    period?: string;
    provenance: "EXTERNAL_EVIDENCE";
  }>;
  metrics: Array<{
    label: string;
    value: number;
    unit: string;
    sourceLabel: string;
    sourceUrl?: string;
  }>;
  opportunitySignals: string[];
  frictionSignals: string[];
  uncertainties: string[];
  implication: string;
};
export const unavailableIntelligence = (
  caseType: string,
  language: V2Language
): ExternalIntelligenceV2 => ({
  status: "unavailable",
  generatedAt: null,
  caseType,
  evidenceBlocks: [],
  metrics: [],
  opportunitySignals: [],
  frictionSignals: [],
  uncertainties: [],
  implication:
    language === "ko"
      ? "현재 외부 근거가 확인되지 않았습니다."
      : "Current external evidence is not verified.",
});
const demoText = {
  entrepreneurship: {
    en: [
      [
        "Customer demand",
        "Pilot interest appears uneven",
        "In this example, a small pilot led to first conversations, but repeat purchases are not yet confirmed.",
        "Interest in interviews is a starting point for selling on a small scale, not proof of lasting demand.",
      ],
      [
        "Alternatives",
        "Substitutes remain easy to overlook",
        "The example buyers describe at least two ways to solve the same task without a new service.",
        "A pilot should compare the proposed offer with the buyers' existing workaround.",
      ],
      [
        "Distribution",
        "You need a way to reach first buyers",
        "The example plan assumes introductions through a professional network; reaching customers beyond that circle is not yet checked.",
        "Before investing more, find a route that reaches customers repeatedly and check it on a small scale.",
      ],
    ],
    ko: [
      [
        "고객 수요",
        "시범 관심에는 편차가 있습니다",
        "이 예시에서는 초기 대화가 있었지만 반복 구매 여부는 아직 확인 전입니다.",
        "대화에서 보인 관심은 수요의 증명이 아니라 작게 팔아 보며 확인할 출발점입니다.",
      ],
      [
        "대안",
        "기존 해결 방식과 비교해야 합니다",
        "가상의 구매자는 새 서비스 없이도 같은 문제를 해결하는 방법을 두 가지 이상 언급합니다.",
        "시범 제안을 기존 해결 방식과 비교해야 합니다.",
      ],
      [
        "고객 확보",
        "첫 구매자에게 닿는 경로가 필요합니다",
        "예시 계획은 지인 소개를 가정하며, 그 밖에 고객을 만날 경로는 아직 확인 전입니다.",
        "투입을 늘리기 전에 고객에게 반복해서 닿을 경로를 작게 확인하세요.",
      ],
    ],
  },
  industry: {
    en: [
      [
        "Role demand",
        "Skills that carry over need evidence",
        "The example role listing mentions related skills, but does not show that an employer would hire you.",
        "Before treating the fit as confirmed, turn your experience into evidence for this specific role.",
      ],
      [
        "Compensation",
        "The move may interrupt your income",
        "This example has no confirmed offer or pay benchmark for the target role.",
        "Keep your income steady while you collect real offers and pay information.",
      ],
      [
        "Geography",
        "Access differs by location",
        "The example search results cover several locations with different requirements.",
        "Narrow the geography before drawing a market conclusion.",
      ],
    ],
    ko: [
      [
        "직무 수요",
        "옮겨 갈 수 있는 역량을 보여 줘야 합니다",
        "예시 직무 공고에는 비슷한 역량이 나오지만, 실제로 채용될지는 보여 주지 않습니다.",
        "맞는다고 판단하기 전에, 이 직무에 맞는 경험 근거부터 정리하세요.",
      ],
      [
        "보상",
        "옮기면 소득이 끊길 수 있습니다",
        "이 예시에는 목표 직무의 확인된 제안이나 보상 기준이 없습니다.",
        "실제 제안과 보상 수준을 확인하는 동안 지금 소득을 지키세요.",
      ],
      [
        "지역",
        "지역마다 접근 조건이 다릅니다",
        "예시 검색 결과에는 요구 사항이 다른 여러 지역이 섞여 있습니다.",
        "시장을 판단하기 전에 목표 지역을 좁히세요.",
      ],
    ],
  },
} as const;
export function demoIntelligence(
  kind: "entrepreneurship" | "industry",
  language: V2Language,
  caseType: string
): ExternalIntelligenceV2 {
  const rows = demoText[kind][language];
  // Fixed research area per row, so KO and EN map the same card to the same condition
  // and the label always matches the current label table (language audit P1).
  const areas = kind === "entrepreneurship" ? ["customerDemand", "competition", "distribution"] : ["roleDemand", "compensation", "geography"];
  return {
    status: "demo",
    generatedAt: "2026-10-09",
    caseType,
    evidenceBlocks: rows.map(
      ([, headline, fact, whyItMatters], i) => ({
        area: areas[i],
        dimension: v2t(language, areas[i] as V2CopyKey),
        headline,
        direction: (i === 1 ? "caution" : "mixed") as "caution" | "mixed",
        fact,
        whyItMatters,
        sourceLabel:
          language === "ko"
            ? "예시 자료"
            : "Example data",
        provenance: "EXTERNAL_EVIDENCE" as const,
      })
    ),
    metrics: [],
    opportunitySignals:
      language === "ko"
        ? ["작게 확인해 볼 수 있음"]
        : ["A small check is possible"],
    frictionSignals:
      language === "ko"
        ? ["실제 시장 근거는 확인 전"]
        : ["Real market evidence is not yet confirmed"],
    uncertainties:
      language === "ko"
        ? ["예시 자료는 실제 수요나 채용 가능성을 보여 주지 않습니다."]
        : [
            "Example data cannot show real demand or hiring outcomes.",
          ],
    implication:
      language === "ko"
        ? "실제 판단에는 출처를 확인한 공개 자료가 필요합니다."
        : "Real decisions need public sources you have checked.",
  };
}
export function customerEvidence(
  intelligence: ExternalIntelligenceV2,
  demoMode: boolean
) {
  if (intelligence.status === "unavailable") return intelligence;
  if (intelligence.status === "demo" && demoMode) return intelligence;
  if (
    intelligence.status === "live" &&
    !demoMode &&
    intelligence.evidenceBlocks.length >= 1 &&
    intelligence.evidenceBlocks.length <= 4 &&
    intelligence.evidenceBlocks.every(
      block =>
        block.provenance === "EXTERNAL_EVIDENCE" &&
        typeof block.sourceUrl === "string" &&
        block.sourceUrl.startsWith("https://")
    )
  )
    return intelligence;
  return unavailableIntelligence(intelligence.caseType, "en");
}
