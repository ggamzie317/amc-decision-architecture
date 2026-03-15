import assert from "node:assert/strict";
import test from "node:test";

import { buildCareerMobilityStructure } from "../src/buildCareerMobilityStructure";

type AnyObj = Record<string, any>;

function makeBaseArgs(): { normalized: AnyObj; structuralFlags: AnyObj; inputSummary: AnyObj } {
  const normalized = {
    mainDecision: "a move from current role to a new external role",
    optionsUnderConsideration: "Option A: remain in current structure. Option B: external move.",
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
    upsideMaximizingStyle: false,
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
  args.normalized.optionsUnderConsideration = "Evaluating one path under present constraints.";
  args.inputSummary.decisionSnapshot.optionsUnderConsideration = args.normalized.optionsUnderConsideration;

  const result = buildCareerMobilityStructure(args as any);

  assert.equal(result.section, "career_mobility_structure");
  assert.equal(result.title, "Career Mobility Structure");
  assert.equal(result.caseType, "single");
  assert.ok(result.mobilityLine.length > 0);
  assert.ok(result.portabilityLine.length > 0);
  assert.ok(result.burdenLine.length > 0);
  assert.ok(result.timingLine.length > 0);
});

test("comparative-case output returns expected shape", () => {
  const args = makeBaseArgs();
  const result = buildCareerMobilityStructure(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(result.mobilityLine.length > 0);
  assert.ok(result.portabilityLine.length > 0);
  assert.ok(result.burdenLine.length > 0);
  assert.ok(result.timingLine.length > 0);
});

test("comparative case can include comparativeReading", () => {
  const args = makeBaseArgs();
  const result = buildCareerMobilityStructure(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(typeof result.comparativeReading === "string");
  assert.ok((result.comparativeReading || "").length > 0);
});

test("wording remains recommendation-free", () => {
  const args = makeBaseArgs();
  const result = buildCareerMobilityStructure(args as any);

  const text = [
    result.mobilityLine,
    result.portabilityLine,
    result.burdenLine,
    result.timingLine,
    result.comparativeReading || "",
  ]
    .join(" ")
    .toLowerCase();

  const banned = ["you should move", "now is the time", "go for it", "impossible", "guaranteed", "best option"];
  for (const token of banned) {
    assert.equal(text.includes(token), false);
  }
});

test("weak or missing signal case returns safe fallback text", () => {
  const result = buildCareerMobilityStructure({
    normalized: {
      mainDecision: "",
      optionsUnderConsideration: "",
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

  assert.ok(result.mobilityLine.includes("directionally present"));
  assert.ok(result.portabilityLine.length > 0);
  assert.ok(result.burdenLine.length > 0);
  assert.ok(result.timingLine.length > 0);
});
