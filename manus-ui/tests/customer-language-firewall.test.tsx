import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildProductApplicationV3,
  buildUnavailableFifwm,
  type ProductApplicationBuildInput,
  type SafetyMarginInputs,
  type StructuralSignal,
} from "../client/src/data/amcProductApplicationV3";
import Home from "../client/src/pages/Home";
import ErrorBoundary from "../client/src/components/ErrorBoundary";
import { customerSafeExternalSnapshot } from "../client/src/data/customerLanguageFirewall";
import { ProductApplicationSections } from "../client/src/pages/AmcWebMvp";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const INTERNAL_ONLY_TERMS = [
  "FIFWM",
  "Formal",
  "Informal",
  "Framework",
  "Workflow",
  "Market / Policy",
  "MarketPolicy",
  "canonical scorer",
  "current-user-structured",
  "current-case-derived",
  "FIFWM-SM-V2",
  "AMC-LAUNCH-V3",
  "structured signal",
  "signal provenance",
] as const;

const PRINT_ONLY_TERMS = ["signal", "band", "provenance", "null", "unavailable", "mock"] as const;
const translateEn = (en: string) => en;
const translateKo = (_en: string, ko: string) => ko;
const signal = <TBand extends string>(band: TBand, source: StructuralSignal<TBand>["source"] = "current-case-derived"): StructuralSignal<TBand> => ({ band, source });

function customerText(markup: string) {
  return markup
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|#x27);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expectCustomerSafe(text: string) {
  for (const term of [...INTERNAL_ONLY_TERMS, ...PRINT_ONLY_TERMS]) {
    expect(text, `customer-visible text leaked “${term}”`).not.toMatch(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
  }
}

function buildJourney(
  language: "en" | "ko",
  external: "strong" | "developing" | "weak",
  safety: "strong" | "developing" | "weak",
  reversibility: "strong" | "developing" | "weak",
  downside: "low" | "moderate" | "high",
) {
  const safetyMarginInputs: SafetyMarginInputs = {
    financialRoom: signal(safety, "current-user-structured"),
    reversibility: signal(reversibility, "current-user-structured"),
    downsideExposure: signal(downside, "current-user-structured"),
  };
  const input: ProductApplicationBuildInput = {
    language,
    caseType: "Entrepreneurship",
    optionA: language === "ko" ? "현재 역할 유지" : "Keep the current role",
    optionB: language === "ko" ? "자문 사업 시험" : "Test an advisory business",
    answers: {},
    fifwm: buildUnavailableFifwm(language),
    fifwmSource: "unavailable",
    safetyMarginInputs,
    structuralSignals: {
      externalValidation: signal(external, "live-external-evidence"),
      internalReadiness: signal("unknown", "unavailable"),
      safetyMargin: signal(safety, "current-user-structured"),
      reversibility: signal(reversibility, "current-user-structured"),
      optionBSupport: signal("unknown", "unavailable"),
      structuralRisk: signal(downside, "current-user-structured"),
      constraintLoad: signal("unknown", "unavailable"),
      missingPointImpact: signal("unknown", "unavailable"),
    },
    missingPoint: language === "ko" ? "유료 수요가 아직 확인되지 않았습니다." : "Paid demand has not yet been verified.",
    missingPointWhy: language === "ko" ? "실제 구매 근거가 노출 확대 전에 필요합니다." : "Real buyer evidence is needed before increasing exposure.",
    changingMoves: [language === "ko" ? "보호된 시간 안에서 소규모 유료 시험을 진행합니다." : "Run a small paid test inside a protected time boundary."],
    primaryRisk: language === "ko" ? "이른 전환" : "Premature transition",
    primaryRiskMeaning: language === "ko" ? "수요 확인 전에 소득을 노출할 수 있습니다." : "Income could be exposed before demand is verified.",
    decisionConditions: [language === "ko" ? "구매자 세 명이 예산을 확정합니다." : "Three relevant buyers commit budget."],
    validationFocus: language === "ko" ? "구매자가 시험에 비용을 지불하는지 확인합니다." : "Whether relevant buyers will pay for a test.",
    externalImplication: language === "ko" ? "현재 외부 근거는 제한된 시험을 뒷받침합니다." : "Current external evidence supports a bounded test.",
    plan: [{ period: "30 days", title: "Test", action: "Interview buyers.", output: "Documented buyer evidence." }],
  };
  return buildProductApplicationV3(input);
}

describe("AMC customer-language firewall", () => {
  it("keeps the public landing page free of internal methodology language", () => {
    expectCustomerSafe(customerText(renderToStaticMarkup(<Home />)));
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { hasError: true, error: new Error("FIFWM canonical scorer failed") };
    expectCustomerSafe(customerText(renderToStaticMarkup(boundary.render())));
  });

  it("keeps all eight dashboard and print-report sections customer-safe in English and Korean", () => {
    const journeys = [
      buildJourney("en", "strong", "strong", "strong", "low"),
      buildJourney("en", "weak", "weak", "weak", "high"),
      buildJourney("ko", "developing", "developing", "developing", "moderate"),
    ];
    expect(journeys.map((journey) => journey.currentStructuralPosture.label)).toEqual([
      "Stronger Transition Case",
      "Stay and Reconfigure",
      "보존하며 검증",
    ]);

    for (const journey of journeys) {
      for (const report of [false, true]) {
        const translate = journey === journeys[2] ? translateKo : translateEn;
        const text = customerText(renderToStaticMarkup(
          <ProductApplicationSections
            intelligence={journey}
            translate={translate}
            report={report}
            externalEvidenceUsed
          />,
        ));
        expectCustomerSafe(text);
        for (const section of [
          "Current Structural Posture",
          "Why This Posture",
          "Decision Structure",
          "What You May Be Missing",
          "Changing Plays",
          "Safety Margin",
          "Decision Switches",
          "Next-Step Experiment",
        ]) expect(text).toContain(section);
      }
    }
  });

  it("sanitizes external source text before it reaches customer surfaces", () => {
    const safe = customerSafeExternalSnapshot({
      status: "live",
      confidence: "high",
      generatedAtLabel: "canonical scorer",
      externalSignals: [{ label: "FIFWM signal", direction: "supportive", reading: "Formal Workflow band" }],
      sourceNotes: [{ sourceLabel: "provider API", note: "Market / Policy unavailable", evidenceType: "market" }],
      uncertaintyNotes: ["current-case-derived signal provenance"],
      implication: "AMC-LAUNCH-V3 framework version",
    });
    expectCustomerSafe(JSON.stringify(safe));
  });
});
