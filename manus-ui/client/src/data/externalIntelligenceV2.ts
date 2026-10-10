import type { V2Language } from "./v2Language";
export type V2Provenance =
  | "USER_STRUCTURED"
  | "EXTERNAL_EVIDENCE"
  | "DERIVED_CORE_RULE"
  | "CASE_TEMPLATE_LABEL";
export type ExternalIntelligenceV2 = {
  status: "live" | "unavailable" | "demo";
  generatedAt: string | null;
  caseType: string;
  evidenceBlocks: Array<{
    dimension: string;
    headline: string;
    direction: "supportive" | "caution" | "mixed";
    fact: string;
    whyItMatters: string;
    sourceLabel: string;
    sourceUrl?: string;
    sourceDate?: string;
    sourceDateKind?: "published" | "updated";
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
        "In this synthetic scenario, a small pilot generated initial conversations, but repeat purchases have not been established.",
        "Interview interest is a prompt for a bounded sales test, not proof of durable demand.",
      ],
      [
        "Alternatives",
        "Substitutes remain easy to overlook",
        "The illustrative buyers describe at least two ways to solve the same task without a new service.",
        "A pilot should compare the proposed offer with the buyers' existing workaround.",
      ],
      [
        "Distribution",
        "Access to first buyers is a condition",
        "The synthetic plan assumes introductions through a professional network; acquisition beyond that circle is untested.",
        "A repeatable route to buyers must be tested before scaling exposure.",
      ],
    ],
    ko: [
      [
        "고객 수요",
        "시범 관심에는 편차가 있습니다",
        "이 합성 사례에서는 초기 대화가 있었지만 반복 구매 여부는 확인되지 않았습니다.",
        "대화의 관심은 수요의 증명이 아니라 작은 판매 실험의 출발점입니다.",
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
        "합성 계획은 지인 소개를 가정하며, 그 밖의 고객 확보 경로는 검증되지 않았습니다.",
        "노출을 늘리기 전에 반복 가능한 접근 경로를 시험해야 합니다.",
      ],
    ],
  },
  industry: {
    en: [
      [
        "Role demand",
        "Transferable skills need proof",
        "The synthetic role sample mentions adjacent skills, but does not establish employer willingness to hire this candidate.",
        "Translate experience into role-specific proof before treating fit as validated.",
      ],
      [
        "Compensation",
        "The move may alter income continuity",
        "The illustrative case has no verified offer or compensation benchmark for the target role.",
        "Protect income while gathering real offer and compensation evidence.",
      ],
      [
        "Geography",
        "Access differs by location",
        "The mock search set spans several locations with different requirements.",
        "Narrow the geography before drawing a market conclusion.",
      ],
    ],
    ko: [
      [
        "직무 수요",
        "전환 가능한 역량을 입증해야 합니다",
        "합성 직무 표본에는 인접 역량이 나오지만, 실제 채용 가능성을 입증하지는 않습니다.",
        "적합성이 검증됐다고 판단하기 전에 직무에 맞는 경험 근거를 정리해야 합니다.",
      ],
      [
        "보상",
        "전환 시 소득 연속성이 달라질 수 있습니다",
        "이 예시에는 대상 직무의 확인된 제안이나 보상 기준이 없습니다.",
        "실제 제안과 보상 근거를 확인하는 동안 소득 기반을 보호해야 합니다.",
      ],
      [
        "지역",
        "지역마다 접근 조건이 다릅니다",
        "가상 검색 표본에는 요구 사항이 다른 여러 지역이 포함됩니다.",
        "시장 판단에 앞서 목표 지역을 좁혀야 합니다.",
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
  return {
    status: "demo",
    generatedAt: "2026-10-09",
    caseType,
    evidenceBlocks: rows.map(
      ([dimension, headline, fact, whyItMatters], i) => ({
        dimension,
        headline,
        direction: (i === 1 ? "caution" : "mixed") as "caution" | "mixed",
        fact,
        whyItMatters,
        sourceLabel:
          language === "ko"
            ? "합성 시나리오 자료"
            : "Synthetic scenario fixture",
        provenance: "EXTERNAL_EVIDENCE" as const,
      })
    ),
    metrics: [],
    opportunitySignals:
      language === "ko"
        ? ["검증할 수 있는 작은 실험"]
        : ["A bounded test is possible"],
    frictionSignals:
      language === "ko"
        ? ["실제 시장 근거 미확인"]
        : ["Real market evidence is not established"],
    uncertainties:
      language === "ko"
        ? ["합성 자료는 실제 수요나 채용 가능성을 증명하지 않습니다."]
        : [
            "Synthetic material cannot establish real demand or hiring outcomes.",
          ],
    implication:
      language === "ko"
        ? "이 자료는 화면 검토용입니다. 실제 판단에는 출처를 확인한 외부 근거가 필요합니다."
        : "This material is for visual review. Real decisions require verified external sources.",
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
    intelligence.evidenceBlocks.length >= 2 &&
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
