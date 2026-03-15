import assert from "node:assert/strict";
import test from "node:test";

import { buildCareerValueStructure } from "../src/buildCareerValueStructure";

type AnyObj = Record<string, any>;

function makeBaseArgs(): { normalized: AnyObj; structuralFlags: AnyObj; inputSummary: AnyObj } {
  const normalized = {
    mainDecision: "a move from current role to a growth-oriented external path",
    optionsUnderConsideration: "Option A: stay in current track. Option B: move externally.",
    topPriorities: ["growth", "stability"],
    nonNegotiable: "income continuity",
    biggestRisks: "execution risk under timing pressure",
  };

  const structuralFlags = {
    highUrgency: false,
    mediumUrgency: true,
    lowUrgency: false,
    urgencyUnclear: false,
    weakSafetyNet: false,
    moderateSafetyNet: true,
    strongSafetyNet: false,
    lowSponsorSupport: false,
    uncertainSponsorSupport: false,
    strongSponsorSupport: true,
    lowDecisionClarity: false,
    mediumDecisionClarity: false,
    highDecisionClarity: true,
    lowCompanyHealthConfidence: false,
    mediumCompanyHealthConfidence: true,
    highCompanyHealthConfidence: false,
    lowCompanyStability: false,
    mediumCompanyStability: true,
    highCompanyStability: false,
    majorRestructuringRisk: false,
    someRestructuringRisk: false,
    noRestructuringSignal: true,
    restructuringUnknown: false,
    highExternalExposure: false,
    manageableExternalExposure: true,
    wellProtectedExternally: false,
    externalExposureUnclear: false,
    lowRiskComfort: false,
    mediumRiskComfort: true,
    highRiskComfort: false,
    downsideProtectiveStyle: false,
    balancedRiskStyle: true,
    upsideMaximizingStyle: true,
    reversibleCommitmentStyle: false,
    gradualCommitmentStyle: true,
    allInCommitmentStyle: false,
    decliningMarketOutlook: false,
    unclearMarketOutlook: true,
    growingMarketOutlook: false,
    lowDifferentiation: false,
    mediumDifferentiation: true,
    highDifferentiation: false,
    structurallyFragileMove: false,
    structurallySupportedMove: false,
    highExecutionRisk: false,
    highInterpretiveNeed: false,
  };

  const inputSummary = {
    decisionSnapshot: {
      optionsUnderConsideration: normalized.optionsUnderConsideration,
    },
  };

  return { normalized, structuralFlags, inputSummary };
}

test("single-case output returns expected shape", () => {
  const args = makeBaseArgs();
  args.normalized.optionsUnderConsideration = "Evaluating one path under current conditions.";
  args.inputSummary.decisionSnapshot.optionsUnderConsideration = args.normalized.optionsUnderConsideration;

  const result = buildCareerValueStructure(args as any);

  assert.equal(result.section, "career_value_structure");
  assert.equal(result.title, "Career Value Structure");
  assert.equal(result.caseType, "single");
  assert.ok(result.primaryValueLine.length > 0);
  assert.ok(result.secondaryValueLine.length > 0);
  assert.ok(result.tensionLine.length > 0);
  assert.ok(result.alignmentLine.length > 0);
});

test("comparative-case output returns expected shape", () => {
  const args = makeBaseArgs();
  const result = buildCareerValueStructure(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(result.primaryValueLine.length > 0);
  assert.ok(result.secondaryValueLine.length > 0);
  assert.ok(result.tensionLine.length > 0);
  assert.ok(result.alignmentLine.length > 0);
});

test("comparative case can include comparativeReading", () => {
  const args = makeBaseArgs();
  const result = buildCareerValueStructure(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(typeof result.comparativeReading === "string");
  assert.ok((result.comparativeReading || "").length > 0);
});

test("wording remains recommendation-free", () => {
  const args = makeBaseArgs();
  const result = buildCareerValueStructure(args as any);
  const text = [
    result.primaryValueLine,
    result.secondaryValueLine,
    result.tensionLine,
    result.alignmentLine,
    result.comparativeReading || "",
  ]
    .join(" ")
    .toLowerCase();

  const banned = ["you should", "follow your values", "be true to yourself", "passion", "dream job", "best option"];
  for (const token of banned) {
    assert.equal(text.includes(token), false);
  }
});

test("weak or missing signal case returns safe fallback text", () => {
  const result = buildCareerValueStructure({
    normalized: {
      mainDecision: "",
      optionsUnderConsideration: "",
      topPriorities: [],
      nonNegotiable: "",
      biggestRisks: "",
    } as any,
    structuralFlags: {
      highUrgency: false,
      mediumUrgency: false,
      lowUrgency: false,
      urgencyUnclear: true,
      weakSafetyNet: false,
      moderateSafetyNet: false,
      strongSafetyNet: false,
      lowSponsorSupport: false,
      uncertainSponsorSupport: false,
      strongSponsorSupport: false,
      lowDecisionClarity: false,
      mediumDecisionClarity: false,
      highDecisionClarity: false,
      lowCompanyHealthConfidence: false,
      mediumCompanyHealthConfidence: false,
      highCompanyHealthConfidence: false,
      lowCompanyStability: false,
      mediumCompanyStability: false,
      highCompanyStability: false,
      majorRestructuringRisk: false,
      someRestructuringRisk: false,
      noRestructuringSignal: false,
      restructuringUnknown: true,
      highExternalExposure: false,
      manageableExternalExposure: false,
      wellProtectedExternally: false,
      externalExposureUnclear: true,
      lowRiskComfort: false,
      mediumRiskComfort: false,
      highRiskComfort: false,
      downsideProtectiveStyle: false,
      balancedRiskStyle: false,
      upsideMaximizingStyle: false,
      reversibleCommitmentStyle: false,
      gradualCommitmentStyle: false,
      allInCommitmentStyle: false,
      decliningMarketOutlook: false,
      unclearMarketOutlook: true,
      growingMarketOutlook: false,
      lowDifferentiation: false,
      mediumDifferentiation: false,
      highDifferentiation: false,
      structurallyFragileMove: false,
      structurallySupportedMove: false,
      highExecutionRisk: false,
      highInterpretiveNeed: true,
    } as any,
    inputSummary: {
      decisionSnapshot: {
        optionsUnderConsideration: "",
      },
    } as any,
  });

  assert.ok(result.primaryValueLine.includes("mixed value structure"));
  assert.ok(result.secondaryValueLine.length > 0);
  assert.ok(result.tensionLine.length > 0);
  assert.ok(result.alignmentLine.length > 0);
});
