import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  AMC_ANALYSIS_SEQUENCE,
  buildFifwmFromReportPayload,
  buildProductApplicationV3,
  type FifwmStructure,
  type ProductApplicationBuildInput,
} from "../client/src/data/amcProductApplicationV3";
import { AMC_FRAMEWORK_VERSION, AMC_PRODUCT_VERSION } from "../server/founderOpsTypes";

const fifwm = (score: 0 | 1 | 2 = 1): FifwmStructure => ({
  formal: { score, reading: "Formal authority and decision rights are mapped." },
  informal: { score, reading: "Informal sponsor and relationship support are mapped." },
  framework: { score, reading: "The operating framework is mapped." },
  workflow: { score, reading: "The day-to-day workflow is mapped." },
  marketPolicy: { score, reading: "Market and policy exposure are mapped." },
});

const baseSignals: ProductApplicationBuildInput["structuralSignals"] = {
  externalValidation: "developing",
  internalReadiness: "developing",
  safetyMargin: "strong",
  reversibility: "developing",
  optionBSupport: "developing",
  structuralRisk: "moderate",
  constraintLoad: "material",
  missingPointImpact: "material",
};

const input = (overrides: Partial<ProductApplicationBuildInput> = {}): ProductApplicationBuildInput => ({
  language: "en",
  caseType: "Entrepreneurship",
  optionA: "current role",
  optionB: "advisory practice",
  answers: {},
  fifwm: fifwm(),
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
  it("changes posture when structured FIFWM, Safety Margin, and validation signals change under identical wording", () => {
    const weak = buildProductApplicationV3(input({
      fifwm: fifwm(0),
      structuralSignals: {
        ...baseSignals,
        externalValidation: "weak",
        internalReadiness: "weak",
        safetyMargin: "weak",
        reversibility: "weak",
        optionBSupport: "weak",
        structuralRisk: "high",
        constraintLoad: "heavy",
        missingPointImpact: "critical",
      },
    }));
    const strong = buildProductApplicationV3(input({
      fifwm: fifwm(2),
      structuralSignals: {
        ...baseSignals,
        externalValidation: "strong",
        internalReadiness: "strong",
        safetyMargin: "strong",
        reversibility: "strong",
        optionBSupport: "strong",
        structuralRisk: "low",
        constraintLoad: "light",
        missingPointImpact: "resolved",
      },
    }));
    expect(weak.currentStructuralPosture.label).toBe("Stay and Reconfigure");
    expect(strong.currentStructuralPosture.label).toBe("Stronger Transition Case");
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
      structuralSignals: { ...baseSignals, safetyMargin: "weak" },
    }));
    expect(result.currentStructuralPosture.label).toBe("Preserve and Validate");
    expect(result.safetyMargin.reading).toContain("constrains exposure");
  });

  it("allows zero to three Changing Plays and never forces Option C", () => {
    expect(buildProductApplicationV3(input({ changingMoves: [] })).changingPlays).toHaveLength(0);
    const plays = buildProductApplicationV3(input({ changingMoves: ["Capability test", "Positioning test", "Resource recombination", "Ignored fourth"] })).changingPlays;
    expect(plays).toHaveLength(3);
    expect(plays.map((play) => play.move).join(" ")).not.toContain("Option C");
  });

  it("uses one corrected intelligence object for dashboard and detailed report and preserves V3 operations", () => {
    const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());
    const page = fs.readFileSync(path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx"), "utf8");
    expect(page.match(/<ProductApplicationSections intelligence=\{productApplicationV3\}/g)).toHaveLength(2);
    expect(page).toContain("buildFifwmFromReportPayload(reportPayload");
    expect(page).toContain("productApplicationV3.decisionStructure.fifwm");
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
