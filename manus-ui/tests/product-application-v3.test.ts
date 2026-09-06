import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AMC_ANALYSIS_SEQUENCE,
  buildFifwmFromReportPayload,
  buildProductApplicationV3,
  buildUnavailableFifwm,
  derivePostureAssessment,
  deriveSafetyMarginCore,
  type FifwmStructure,
  type ProductApplicationBuildInput,
  type SafetyMarginInputs,
  type StructuralSignal,
} from "../client/src/data/amcProductApplicationV3";
import { AMC_FRAMEWORK_VERSION, AMC_PRODUCT_VERSION } from "../server/founderOpsTypes";
import { ProductApplicationDashboard, ProductApplicationReport } from "../client/src/components/ProductApplicationViews";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const fifwm = (score: 0 | 1 | 2 = 1): FifwmStructure => ({
  formal: { score, reading: "Formal authority and decision rights are mapped." },
  informal: { score, reading: "Informal sponsor and relationship support are mapped." },
  framework: { score, reading: "The operating framework is mapped." },
  workflow: { score, reading: "The day-to-day workflow is mapped." },
  marketPolicy: { score, reading: "Market and policy exposure are mapped." },
});

const signal = <TBand extends string>(band: TBand): StructuralSignal<TBand> => ({ band, source: "current-case-derived" });
const unavailableSignal = <TBand extends string>(): StructuralSignal<TBand> => ({ band: "unknown" as TBand, source: "unavailable" });

const baseSignals: ProductApplicationBuildInput["structuralSignals"] = {
  externalValidation: signal("developing"),
  internalReadiness: signal("developing"),
  safetyMargin: signal("strong"),
  reversibility: signal("developing"),
  optionBSupport: signal("developing"),
  structuralRisk: signal("moderate"),
  constraintLoad: signal("material"),
  missingPointImpact: signal("material"),
};
const baseSafetyMarginInputs: SafetyMarginInputs = {
  financialRoom: { band: "strong", source: "current-user-structured" },
  reversibility: { band: "strong", source: "current-user-structured" },
  downsideExposure: { band: "low", source: "current-user-structured" },
};

const webRuntimeSignals = (
  externalValidation: "strong" | "developing" | "weak" | "unknown",
  safetyMargin: "strong" | "developing" | "weak" | "unknown",
  reversibility: "strong" | "developing" | "weak" | "unknown",
  structuralRisk: "low" | "moderate" | "high" | "unknown",
): ProductApplicationBuildInput["structuralSignals"] => ({
  externalValidation: externalValidation === "unknown" ? unavailableSignal() : signal(externalValidation),
  internalReadiness: unavailableSignal(),
  safetyMargin: safetyMargin === "unknown" ? unavailableSignal() : signal(safetyMargin),
  reversibility: reversibility === "unknown" ? unavailableSignal() : signal(reversibility),
  optionBSupport: unavailableSignal(),
  structuralRisk: structuralRisk === "unknown" ? unavailableSignal() : signal(structuralRisk),
  constraintLoad: unavailableSignal(),
  missingPointImpact: unavailableSignal(),
});

const input = (overrides: Partial<ProductApplicationBuildInput> = {}): ProductApplicationBuildInput => ({
  language: "en",
  caseType: "Entrepreneurship",
  optionA: "current role",
  optionB: "advisory practice",
  answers: {},
  fifwm: fifwm(),
  fifwmSource: "canonical-current-case",
  safetyMarginInputs: baseSafetyMarginInputs,
  structuralSignals: baseSignals,
  missingPoint: "The stated choice hides an untested demand assumption.",
  missingPointWhy: "Without buyer evidence, the transition case cannot carry its exposure.",
  changingMoves: ["Package the existing government-project experience into one advisory pilot and test it with real buyers."],
  primaryRisk: "Premature conversion",
  primaryRiskMeaning: "Income and credibility could be exposed before demand is established.",
  decisionConditions: [
    "Three relevant buyers confirm the problem is urgent enough to fund.",
    "A repeatable pilot can be delivered inside the protected weekly time boundary.",
    "The current role stops providing sufficient runway for a bounded test.",
  ],
  validationFocus: "Whether relevant buyers will commit time or budget to a pilot.",
  externalImplication: "The outside evidence supports a bounded test, but not full conversion.",
  plan: [
    { period: "30 days", title: "Frame", action: "Interview relevant buyers.", output: "A documented demand pattern." },
    { period: "60 days", title: "Test", action: "Run one bounded pilot.", output: "Observed delivery and buyer evidence." },
    { period: "90 days", title: "Reassess", action: "Compare evidence with the switches.", output: "A refreshed structural posture." },
  ],
  ...overrides,
});

describe("AMC Product Application Layer V3 correction", () => {
  it("keeps exactly 29 questions and adds structured bands inside the existing Q19-Q21 cards", () => {
    const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());
    const page = fs.readFileSync(path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx"), "utf8");
    const intakeSource = page.slice(page.indexOf("const intakeGroups ="), page.indexOf("const intakeGroupTitlesKo"));
    const ids = [...intakeSource.matchAll(/\bid:\s*(\d+)/g)].map((match) => Number(match[1]));
    expect(ids).toHaveLength(29);
    expect(ids).toEqual(Array.from({ length: 29 }, (_, index) => index + 1));
    expect(page).toContain("const safetyMarginQuestionIds = [19, 20, 21]");
    expect(page).toContain("safetyMarginBandOptions[structuredQuestionId]");
    expect(page).toContain('{ value: "weak", en: "Constrained"');
    expect(page).toContain('{ value: "low", en: "Contained"');
    expect(page).toContain('{ value: "high", en: "Elevated"');
    expect(page).toContain('{ value: "unknown", en: "Not Yet Established"');
    expect(page).toContain('id={`full-intake-${question.id}`}');
  });

  it("derives strong, weak, and unknown Safety Margin only from structured dimensions", () => {
    expect(deriveSafetyMarginCore(baseSafetyMarginInputs)).toMatchObject({ band: "strong", knownDimensions: 3 });
    expect(deriveSafetyMarginCore({
      financialRoom: { band: "weak", source: "current-user-structured" },
      reversibility: { band: "weak", source: "current-user-structured" },
      downsideExposure: { band: "high", source: "current-user-structured" },
    })).toMatchObject({ band: "weak", knownDimensions: 3 });
    expect(deriveSafetyMarginCore({
      financialRoom: { band: "strong", source: "current-user-structured" },
      reversibility: { band: "unknown", source: "current-user-structured" },
      downsideExposure: { band: "unknown", source: "current-user-structured" },
    })).toMatchObject({ band: "unknown", knownDimensions: 1 });
  });

  it("changes posture when structured FIFWM, Safety Margin, and validation signals change under identical wording", () => {
    const weak = buildProductApplicationV3(input({
      fifwm: fifwm(0),
      structuralSignals: {
        ...baseSignals,
        externalValidation: signal("weak"),
        internalReadiness: signal("weak"),
        safetyMargin: signal("weak"),
        reversibility: signal("weak"),
        optionBSupport: signal("weak"),
        structuralRisk: signal("high"),
        constraintLoad: signal("heavy"),
        missingPointImpact: signal("critical"),
      },
    }));
    const strong = buildProductApplicationV3(input({
      fifwm: fifwm(2),
      structuralSignals: {
        ...baseSignals,
        externalValidation: signal("strong"),
        internalReadiness: signal("strong"),
        safetyMargin: signal("strong"),
        reversibility: signal("strong"),
        optionBSupport: signal("strong"),
        structuralRisk: signal("low"),
        constraintLoad: signal("light"),
        missingPointImpact: signal("resolved"),
      },
    }));
    expect(weak.currentStructuralPosture.label).toBe("Protect and Reconfigure");
    expect(strong.currentStructuralPosture.label).toBe("Stronger Transition Case");
  });

  it("guards a transition candidate only when weak Safety Margin combines with weak reversibility or high downside", () => {
    const transitionSignals: ProductApplicationBuildInput["structuralSignals"] = {
      externalValidation: signal("strong"),
      internalReadiness: signal("strong"),
      safetyMargin: signal("strong"),
      reversibility: signal("strong"),
      optionBSupport: signal("strong"),
      structuralRisk: signal("low"),
      constraintLoad: signal("light"),
      missingPointImpact: signal("resolved"),
    };
    const guardedCases = [
      {
        structuralSignals: { ...transitionSignals, safetyMargin: signal("weak"), reversibility: signal("weak"), structuralRisk: signal("high") },
        triggers: ["weak-safety-margin", "weak-reversibility", "high-structural-risk"],
        expectedSupport: 10,
        reason: /weak Safety Margin, weak reversibility, and high downside exposure/,
      },
      {
        structuralSignals: { ...transitionSignals, safetyMargin: signal("weak"), reversibility: signal("weak") },
        triggers: ["weak-safety-margin", "weak-reversibility"],
        expectedSupport: 12,
        reason: /weak Safety Margin and weak reversibility/,
      },
      {
        structuralSignals: { ...transitionSignals, safetyMargin: signal("weak"), structuralRisk: signal("high") },
        triggers: ["weak-safety-margin", "high-structural-risk"],
        expectedSupport: 12,
        reason: /weak Safety Margin and high downside exposure/,
      },
    ] as const;

    for (const guardedCase of guardedCases) {
      const guardedInput = input({ fifwm: fifwm(2), structuralSignals: guardedCase.structuralSignals });
      const assessment = derivePostureAssessment(guardedInput);
      const result = buildProductApplicationV3(guardedInput);
      expect(assessment.candidatePosture).toBe("transition");
      expect(assessment.support).toBe(guardedCase.expectedSupport);
      expect(assessment.effectivePosture).toBe("validate");
      expect(assessment.guardrailApplied).toBe(true);
      expect(assessment.guardrailTriggers).toEqual(guardedCase.triggers);
      expect(result.currentStructuralPosture.label).toBe("Preserve and Validate");
      expect(result.currentStructuralPosture.sentence).toContain("Opportunity evidence for advisory practice remains present");
      expect(result.currentStructuralPosture.sentence).toMatch(guardedCase.reason);
      expect(result.why.topDrivers[0]).toBe(result.currentStructuralPosture.sentence);
    }
  });

  it("does not guard weak Safety Margin alone and preserves normal posture families and exact thresholds", () => {
    const transitionSignals: ProductApplicationBuildInput["structuralSignals"] = {
      externalValidation: signal("strong"),
      internalReadiness: signal("strong"),
      safetyMargin: signal("weak"),
      reversibility: signal("developing"),
      optionBSupport: signal("strong"),
      structuralRisk: signal("moderate"),
      constraintLoad: signal("light"),
      missingPointImpact: signal("resolved"),
    };
    const weakSafetyOnly = derivePostureAssessment(input({ fifwm: fifwm(2), structuralSignals: transitionSignals }));
    expect(weakSafetyOnly.candidatePosture).toBe("transition");
    expect(weakSafetyOnly.support).toBe(12);
    expect(weakSafetyOnly.effectivePosture).toBe("transition");
    expect(weakSafetyOnly.guardrailApplied).toBe(false);

    const atEight = derivePostureAssessment(input({ structuralSignals: { ...baseSignals, externalValidation: signal("strong") } }));
    const atOne = derivePostureAssessment(input({ structuralSignals: {
      ...baseSignals,
      externalValidation: signal("weak"),
      internalReadiness: signal("weak"),
      safetyMargin: signal("weak"),
      structuralRisk: signal("low"),
    } }));
    const allUnknown = derivePostureAssessment(input({
      fifwm: buildUnavailableFifwm("en"),
      fifwmSource: "unavailable",
      structuralSignals: webRuntimeSignals("unknown", "unknown", "unknown", "unknown"),
    }));
    expect(atEight).toMatchObject({ support: 8, candidatePosture: "transition", effectivePosture: "transition" });
    expect(atOne).toMatchObject({ support: 1, candidatePosture: "reconfigure", effectivePosture: "reconfigure" });
    expect(derivePostureAssessment(input())).toMatchObject({ support: 6, candidatePosture: "validate", effectivePosture: "validate" });
    expect(allUnknown).toMatchObject({ support: 5, candidatePosture: "validate", effectivePosture: "validate", guardrailApplied: false });
    expect(buildProductApplicationV3(input({ structuralSignals: transitionSignals })).currentStructuralPosture.label).toBe("Stronger Transition Case");
  });

  it("aligns English and Korean reconfigure language without prescribing employer stay", () => {
    const reconfigureSignals: ProductApplicationBuildInput["structuralSignals"] = {
      externalValidation: signal("weak"),
      internalReadiness: signal("weak"),
      safetyMargin: signal("weak"),
      reversibility: signal("weak"),
      optionBSupport: signal("weak"),
      structuralRisk: signal("high"),
      constraintLoad: signal("heavy"),
      missingPointImpact: signal("critical"),
    };
    const en = buildProductApplicationV3(input({ fifwm: fifwm(0), structuralSignals: reconfigureSignals }));
    const ko = buildProductApplicationV3(input({ language: "ko", fifwm: fifwm(0), structuralSignals: reconfigureSignals }));
    expect(en.currentStructuralPosture.label).toBe("Protect and Reconfigure");
    expect(ko.currentStructuralPosture.label).toBe("기반을 보호하며 재구성");
    expect(en.currentStructuralPosture.sentence).not.toMatch(/stay|employer|current role/i);
    expect(ko.currentStructuralPosture.sentence).not.toMatch(/직장|고용주|남아|유지해야/);
    expect(derivePostureAssessment(input({ fifwm: fifwm(0), structuralSignals: reconfigureSignals })).effectivePosture).toBe("reconfigure");
    expect(derivePostureAssessment(input({ fifwm: fifwm(0), structuralSignals: reconfigureSignals })).support).toBe(-6);
    expect(derivePostureAssessment(input({ language: "ko", fifwm: fifwm(0), structuralSignals: reconfigureSignals })).effectivePosture).toBe("reconfigure");
  });

  it("uses the same guarded posture in Dashboard and Report with safety-consistent switches and experiment", () => {
    const guardedInput = input({
      fifwm: fifwm(2),
      structuralSignals: {
        externalValidation: signal("strong"),
        internalReadiness: signal("strong"),
        safetyMargin: signal("weak"),
        reversibility: signal("weak"),
        optionBSupport: signal("strong"),
        structuralRisk: signal("high"),
        constraintLoad: signal("light"),
        missingPointImpact: signal("resolved"),
      },
    });
    const first = buildProductApplicationV3(guardedInput);
    const second = buildProductApplicationV3(guardedInput);
    const korean = buildProductApplicationV3({ ...guardedInput, language: "ko" });
    expect(second).toEqual(first);
    expect(korean.currentStructuralPosture.label).toBe("보존하며 검증");
    expect(korean.currentStructuralPosture.sentence).toContain("약한 Safety Margin, 약한 가역성 및 높은 하방 노출");
    expect(derivePostureAssessment({ ...guardedInput, language: "ko" }).effectivePosture).toBe(derivePostureAssessment(guardedInput).effectivePosture);
    expect(first.decisionSwitches.every((item) => item.direction.includes("requires weak Safety Margin, weak reversibility, and high downside exposure to be reassessed"))).toBe(true);
    expect(first.nextStepExperiment.continueCondition).toContain("Increasing commitment also requires weak Safety Margin, weak reversibility, and high downside exposure to be reassessed");
    expect(first.nextStepExperiment.pauseCondition).toContain("remain constrained");
    const props = { intelligence: first, translate: (en: string) => en, externalEvidenceUsed: true };
    const dashboard = renderToStaticMarkup(React.createElement(ProductApplicationDashboard, props));
    const report = renderToStaticMarkup(React.createElement(ProductApplicationReport, props));
    expect(dashboard).toContain("Preserve and Validate");
    expect(report).toContain("Preserve and Validate");
    expect(dashboard).toContain("Opportunity evidence for advisory practice remains present");
    expect(report).toContain("Opportunity evidence for advisory practice remains present");
    expect(first.changingPlays.length).toBeLessThanOrEqual(3);
  });

  it("reaches all posture families from live evidence and current-user Safety Margin structure with FIFWM unavailable", () => {
    const currentCase = (
      external: "strong" | "developing" | "weak",
      safety: "strong" | "developing" | "weak",
      reversibility: "strong" | "developing" | "weak",
      downside: "low" | "moderate" | "high",
    ) => buildProductApplicationV3(input({
      fifwm: buildUnavailableFifwm("en"),
      fifwmSource: "unavailable",
      safetyMarginInputs: {
        financialRoom: { band: safety, source: "current-user-structured" },
        reversibility: { band: reversibility, source: "current-user-structured" },
        downsideExposure: { band: downside, source: "current-user-structured" },
      },
      structuralSignals: {
        externalValidation: { band: external, source: "live-external-evidence" },
        internalReadiness: unavailableSignal(),
        safetyMargin: { band: safety, source: "current-user-structured" },
        reversibility: { band: reversibility, source: "current-user-structured" },
        optionBSupport: unavailableSignal(),
        structuralRisk: { band: downside, source: "current-user-structured" },
        constraintLoad: unavailableSignal(),
        missingPointImpact: unavailableSignal(),
      },
    }));

    expect(currentCase("strong", "strong", "strong", "low").currentStructuralPosture.label).toBe("Stronger Transition Case");
    expect(currentCase("weak", "weak", "weak", "high").currentStructuralPosture.label).toBe("Protect and Reconfigure");
    const mixed = currentCase("developing", "developing", "developing", "moderate");
    expect(mixed.currentStructuralPosture.label).toBe("Preserve and Validate");
    expect(mixed.postureEvidenceCoverage).toBe("partial");
  });

  it("keeps posture stable when wording changes but structured signals remain equivalent", () => {
    const first = buildProductApplicationV3(input({ answers: { 14: "Demand wording alpha", 17: "Readiness wording alpha" } }));
    const second = buildProductApplicationV3(input({
      answers: { 14: "Paid validated confirmed secured ready", 17: "missing weak unclear not yet" },
      externalImplication: "Entirely different prose with the same structural band.",
    }));
    expect(second.currentStructuralPosture).toEqual(first.currentStructuralPosture);
  });

  it("maps the canonical real five-factor FIFWM payload", () => {
    const mapped = buildFifwmFromReportPayload({
      F_Formal_Score: 2, F_Formal_Text: "Formal read",
      F_Informal_Score: 1, F_Informal_Text: "Informal read",
      F_Framework_Score: 2, F_Framework_Text: "Framework read",
      F_Workflow_Score: 0, F_Workflow_Text: "Workflow read",
      F_MarketPolicy_Score: 1, F_MarketPolicy_Text: "Market / Policy read",
    });
    expect(Object.keys(mapped)).toEqual(["formal", "informal", "framework", "workflow", "marketPolicy"]);
    expect(mapped.formal).toEqual({ score: 2, reading: "Formal read" });
    expect(mapped.marketPolicy.reading).toBe("Market / Policy read");
  });

  it("keeps all canonical factors explicitly unknown when no current-case scorer output exists", () => {
    const unknown = buildUnavailableFifwm("en");
    expect(Object.keys(unknown)).toEqual(["formal", "informal", "framework", "workflow", "marketPolicy"]);
    expect(Object.values(unknown).every((factor) => factor.score === null)).toBe(true);
    expect(Object.values(unknown).every((factor) => factor.reading.includes("Insufficient current-case evidence"))).toBe(true);
  });

  it("keeps unavailable live-case structure neutral and never treats unknown Safety Margin as safe", () => {
    const result = buildProductApplicationV3(input({
      fifwm: buildUnavailableFifwm("en"),
      fifwmSource: "unavailable",
      safetyMarginInputs: {
        financialRoom: unavailableSignal(),
        reversibility: unavailableSignal(),
        downsideExposure: unavailableSignal(),
      },
      structuralSignals: {
        externalValidation: unavailableSignal(),
        internalReadiness: unavailableSignal(),
        safetyMargin: unavailableSignal(),
        reversibility: unavailableSignal(),
        optionBSupport: unavailableSignal(),
        structuralRisk: unavailableSignal(),
        constraintLoad: unavailableSignal(),
        missingPointImpact: unavailableSignal(),
      },
    }));
    expect(result.currentStructuralPosture.label).toBe("Preserve and Validate");
    expect(result.safetyMargin.reading).toContain("not yet established");
    expect(result.safetyMargin.reading).toContain("before increasing exposure");
    expect(result.decisionStructure.fifwmSource).toBe("unavailable");
    expect(Object.values(result.postureBasis).every((item) => item.source === "unavailable")).toBe(true);
  });

  it("keeps genuine FIFWM and supporting context together without conflating them", () => {
    const result = buildProductApplicationV3(input());
    expect(result.decisionStructure.fifwm).toEqual(fifwm());
    expect(result.decisionStructure.insideReality).toBeTruthy();
    expect(result.decisionStructure.outsideEvidence).toContain("outside evidence");
    expect(result.decisionStructure.constraints).toBeTruthy();
    expect(result.decisionStructure.tradeOffs).toContain("current role");
    expect(result.postureBasis).toEqual(baseSignals);
  });

  it("keeps Missing Point before posture in the structure-first sequence", () => {
    expect(AMC_ANALYSIS_SEQUENCE.indexOf("FIFWM / Decision Structure")).toBeLessThan(AMC_ANALYSIS_SEQUENCE.indexOf("What You May Be Missing"));
    expect(AMC_ANALYSIS_SEQUENCE.indexOf("What You May Be Missing")).toBeLessThan(AMC_ANALYSIS_SEQUENCE.indexOf("Current Structural Posture"));
    expect(buildProductApplicationV3(input()).missingPoint).toContain("untested demand");
  });

  it("allows strong Safety Margin to enable bounded experimentation", () => {
    const result = buildProductApplicationV3(input());
    expect(result.safetyMargin.reading).toContain("enables bounded experimentation");
    expect(result.safetyMargin.roomToBeWrong).toBeTruthy();
  });

  it("uses weak Safety Margin to constrain exposure without automatically forcing stay", () => {
    const result = buildProductApplicationV3(input({
      safetyMarginInputs: {
        financialRoom: { band: "weak", source: "current-user-structured" },
        reversibility: { band: "weak", source: "current-user-structured" },
        downsideExposure: { band: "high", source: "current-user-structured" },
      },
      structuralSignals: { ...baseSignals, safetyMargin: signal("weak") },
    }));
    expect(result.currentStructuralPosture.label).toBe("Preserve and Validate");
    expect(result.safetyMargin.reading).toContain("constrains exposure");
  });

  it("derives zero, one, and two-to-three plays from the actual web-runtime availability shape", () => {
    const zeroPlays = buildProductApplicationV3(input({ structuralSignals: webRuntimeSignals("strong", "strong", "strong", "low") }));
    const onePlay = buildProductApplicationV3(input({ structuralSignals: webRuntimeSignals("developing", "strong", "strong", "low") }));
    const threePlays = buildProductApplicationV3(input({ structuralSignals: webRuntimeSignals("weak", "weak", "developing", "high") }));
    expect(zeroPlays.changingPlays).toHaveLength(0);
    expect(onePlay.changingPlays).toHaveLength(1);
    expect(onePlay.changingPlays[0].family).toBe("parallel-validation");
    expect(threePlays.changingPlays).toHaveLength(3);
    expect(new Set(threePlays.changingPlays.map((play) => play.family)).size).toBe(3);
    expect(threePlays.changingPlays.map((play) => play.move).join(" ")).not.toContain("Option C");
  });

  it("keeps unknown neutral and uses case type only to select a family after a known trigger", () => {
    const cases = ["Corporate Stay vs Exit", "MBA / EMBA / PhD Decision", "Entrepreneurship", "Overseas Relocation"];
    const caseOnly = cases.map((caseType) => buildProductApplicationV3(input({ caseType, structuralSignals: webRuntimeSignals("strong", "strong", "strong", "low") })));
    expect(caseOnly.every((result) => result.changingPlays.length === 0)).toBe(true);
    const allUnknown = buildProductApplicationV3(input({ structuralSignals: webRuntimeSignals("unknown", "unknown", "unknown", "unknown") }));
    expect(allUnknown.changingPlays).toHaveLength(0);
    const zeroState = renderToStaticMarkup(React.createElement(ProductApplicationDashboard, {
      intelligence: allUnknown, translate: (en: string) => en, externalEvidenceUsed: false,
    }));
    expect(zeroState).toContain("No additional configuration is justified by the current structure");
    const firstFamilies = cases.map((caseType) => buildProductApplicationV3(input({ caseType, changingMoves: ["LEGACY STATIC ALTERNATIVE"], structuralSignals: webRuntimeSignals("developing", "strong", "strong", "low") })).changingPlays[0]?.family);
    expect(firstFamilies).toEqual(["role-scope", "pathway", "parallel-validation", "pathway"]);
    expect(firstFamilies.every(Boolean)).toBe(true);
    expect(cases.flatMap((caseType) => buildProductApplicationV3(input({ caseType })).changingPlays.map((play) => play.move))).not.toContain("LEGACY STATIC ALTERNATIVE");
  });

  it("produces distinct visual summaries and reconfigurations for four representative case structures", () => {
    const cases = [
      { caseType: "Corporate Stay vs Exit", safety: "strong", downside: "low", condition: "The redesigned role receives written approval." },
      { caseType: "MBA / EMBA / PhD Decision", safety: "developing", downside: "moderate", condition: "Alumni outcomes show differentiated access." },
      { caseType: "Entrepreneurship", safety: "weak", downside: "high", condition: "Three buyers fund a repeatable pilot." },
      { caseType: "Overseas Relocation", safety: "unknown", downside: "unknown", condition: "Visa and family logistics are workable." },
    ] as const;
    const results = cases.map(({ caseType, safety, downside, condition }) => buildProductApplicationV3(input({
      caseType,
      safetyMarginInputs: {
        financialRoom: { band: safety, source: "current-user-structured" },
        reversibility: { band: safety, source: "current-user-structured" },
        downsideExposure: { band: downside, source: "current-user-structured" },
      },
      structuralSignals: { ...baseSignals, safetyMargin: signal(safety), reversibility: signal(safety), structuralRisk: signal(downside) },
      decisionConditions: [condition],
    })));
    expect(new Set(results.map((result) => result.presentation.missingPointKeyword)).size).toBe(4);
    expect(new Set(results.map((result) => result.presentation.coreTradeoffKeyword)).size).toBe(4);
    expect(new Set(results.map((result) => result.presentation.nextTestKeyword)).size).toBe(4);
    expect(new Set(results.map((result) => result.presentation.safetyMarginKeyword)).size).toBe(4);
    expect(results.map((result) => result.changingPlays[0]?.family)).toEqual(["role-scope", "pathway", "parallel-validation", "pathway"]);
    expect(results.map((result) => result.decisionSwitches[0]?.signal)).toEqual(cases.map((item) => item.condition));
    expect(results.every((result) => result.nextStepExperiment.stages.length === 3)).toBe(true);
  });

  it("builds five explicit dashboard keywords and distinct concise/detailed renderers from one intelligence object", () => {
    const result = buildProductApplicationV3(input());
    expect(Object.keys(result.presentation).filter((key) => key.endsWith("Keyword"))).toEqual([
      "postureKeyword", "missingPointKeyword", "safetyMarginKeyword", "coreTradeoffKeyword", "nextTestKeyword",
    ]);
    const props = { intelligence: result, translate: (en: string) => en, externalEvidenceUsed: true };
    const dashboard = renderToStaticMarkup(React.createElement(ProductApplicationDashboard, props));
    const report = renderToStaticMarkup(React.createElement(ProductApplicationReport, props));
    expect(dashboard).toContain('data-executive-decision-map="true"');
    expect(dashboard).toContain('data-decision-structure-visual="true"');
    expect(dashboard).toContain('data-safety-margin-visual="true"');
    expect(dashboard).toContain("If");
    expect(dashboard).toContain("Then");
    expect(dashboard).toContain("30 days");
    expect(dashboard).not.toMatch(/\d+%/);
    expect(dashboard).not.toContain(result.why.biggestRisk);
    expect(report).toContain('data-report-executive-summary="true"');
    expect(report).toContain('data-report-detail="true"');
    expect(report.length).toBeGreaterThan(dashboard.length);
  });

  it("uses live-case or explicit unknown wiring with no historical fixture or fixed posture bands", () => {
    const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());
    const page = fs.readFileSync(path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx"), "utf8");
    const founderOpsDerived = fs.readFileSync(
      path.join(root, "manus-ui/client/src/data/amcFounderOpsDerived.ts"),
      "utf8",
    );
    expect(page.match(/<ProductApplicationDashboard intelligence=\{productApplicationV3\}/g)).toHaveLength(1);
    expect(page.match(/<ProductApplicationReport intelligence=\{productApplicationV3\}/g)).toHaveLength(1);
    expect(page).not.toContain("ProductApplicationSections");
    expect(page).not.toContain("{false ? <>");
    for (const duplicateSection of [
      "01A / What You May Be Missing", "02 / Decision Snapshot", "Supporting Detail / Changing Play",
      "Supporting Detail / Safety Margin Evidence", "Supporting Detail / Decision Switch Evidence",
      "Supporting Detail / Experiment Stages",
    ]) expect(page).not.toContain(duplicateSection);
    expect(page).not.toMatch(/import\s+reportPayload\s+from/);
    expect(page).not.toContain("buildFifwmFromReportPayload(reportPayload");
    expect(page).not.toContain("launchInterpretation.alternativePath");
    expect(page).not.toContain("changingMoves:");
    expect(page).toContain("buildUnavailableFifwm(language)");
    expect(page).toContain("externalValidationSignal(displayedExternalSnapshot)");
    expect(page).toContain('externalSnapshot ?? (isQaMode ? mockExternalSnapshot : neutralExternalSnapshot)');
    expect(page).toContain('setExternalSnapshot(isQaMode ? mockExternalSnapshot : null)');
    for (const fixedBand of [
      'internalReadiness: "developing"', 'safetyMargin: "strong"', 'reversibility: "developing"',
      'optionBSupport: "developing"', 'structuralRisk: "high"', 'constraintLoad: "material"',
      'missingPointImpact: "material"',
    ]) expect(page).not.toContain(fixedBand);
    expect(page).toContain("buildFounderOpsDerivedPatch({");
    expect(founderOpsDerived).toContain("productApplication.decisionStructure.fifwm");
    expect(founderOpsDerived).toContain("structuralOutputJson: {");
    expect(founderOpsDerived).toContain("changingPlays: productApplication.changingPlays");
    expect(page).toContain("answersJson:");
    expect(founderOpsDerived).toContain("safetyMarginInputs: productApplication.safetyMargin.inputs");
    expect(page).toContain('source: "current-user-structured"');
    expect(AMC_PRODUCT_VERSION).toBe("AMC-LAUNCH-V3");
    expect(AMC_FRAMEWORK_VERSION).toBe("FIFWM-SM-V2");
  });

  it("keeps posture clear and non-imperative and keeps observable switches tied to the experiment", () => {
    const result = buildProductApplicationV3(input());
    expect(result.why.topDrivers.length).toBeLessThanOrEqual(3);
    expect(result.why.strongestCounterargument).toBeTruthy();
    expect(result.currentStructuralPosture.sentence).not.toMatch(/\b(should|choose|recommend|wins?)\b/i);
    expect(result.nextStepExperiment.continueCondition).toBe(result.decisionSwitches[0].signal);
    expect(result.nextStepExperiment.pauseCondition).toContain("Pause or redesign");
    expect(result.nextStepExperiment.reassessAt).toContain("Current Structural Posture");
  });
});
