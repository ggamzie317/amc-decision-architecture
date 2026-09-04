import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  AMC_ANALYSIS_SEQUENCE,
  buildFifwmFromReportPayload,
  buildProductApplicationV3,
  buildUnavailableFifwm,
  deriveSafetyMarginCore,
  type FifwmStructure,
  type ProductApplicationBuildInput,
  type SafetyMarginInputs,
  type StructuralSignal,
} from "../client/src/data/amcProductApplicationV3";
import { AMC_FRAMEWORK_VERSION, AMC_PRODUCT_VERSION } from "../server/founderOpsTypes";

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
    expect(weak.currentStructuralPosture.label).toBe("Stay and Reconfigure");
    expect(strong.currentStructuralPosture.label).toBe("Stronger Transition Case");
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
    expect(currentCase("weak", "weak", "weak", "high").currentStructuralPosture.label).toBe("Stay and Reconfigure");
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
    expect(result.safetyMargin.reading).toContain("not assumed safe");
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

  it("allows zero to three Changing Plays and never forces Option C", () => {
    expect(buildProductApplicationV3(input({ changingMoves: [] })).changingPlays).toHaveLength(0);
    const plays = buildProductApplicationV3(input({ changingMoves: ["Capability test", "Positioning test", "Resource recombination", "Ignored fourth"] })).changingPlays;
    expect(plays).toHaveLength(3);
    expect(plays.map((play) => play.move).join(" ")).not.toContain("Option C");
  });

  it("uses live-case or explicit unknown wiring with no historical fixture or fixed posture bands", () => {
    const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());
    const page = fs.readFileSync(path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx"), "utf8");
    expect(page.match(/<ProductApplicationSections intelligence=\{productApplicationV3\}/g)).toHaveLength(2);
    expect(page).not.toMatch(/import\s+reportPayload\s+from/);
    expect(page).not.toContain("buildFifwmFromReportPayload(reportPayload");
    expect(page).toContain("buildUnavailableFifwm(language)");
    expect(page).toContain("externalValidationSignal(displayedExternalSnapshot)");
    for (const fixedBand of [
      'internalReadiness: "developing"', 'safetyMargin: "strong"', 'reversibility: "developing"',
      'optionBSupport: "developing"', 'structuralRisk: "high"', 'constraintLoad: "material"',
      'missingPointImpact: "material"',
    ]) expect(page).not.toContain(fixedBand);
    expect(page).toContain("productApplicationV3.decisionStructure.fifwm");
    expect(page).toContain("structuralOutputJson: structuralOutput");
    expect(page).toContain("answersJson:");
    expect(page).toContain("safetyMarginInputs: productApplicationV3.safetyMargin.inputs");
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
