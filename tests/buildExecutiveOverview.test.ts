import assert from "node:assert/strict";
import test from "node:test";

import { buildExecutiveOverview } from "../src/buildExecutiveOverview";

type AnyObj = Record<string, any>;

function makeBaseArgs(): { normalized: AnyObj; structuralFlags: AnyObj; inputSummary: AnyObj } {
  const normalized = {
    mainDecision: "a move from current role to an external role",
    optionsUnderConsideration: "Option A: stay current path. Option B: external move.",
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
  args.normalized.optionsUnderConsideration = "Reflecting on whether to stay in current path.";
  args.inputSummary.decisionSnapshot.optionsUnderConsideration = args.normalized.optionsUnderConsideration;

  const result = buildExecutiveOverview(args as any);

  assert.equal(result.section, "executive_overview");
  assert.equal(result.title, "이번 결정의 핵심 구조");
  assert.equal(result.caseType, "single");
  assert.ok(result.overviewLine.length > 0);
  assert.ok(result.structuralTension.length > 0);
  assert.ok(result.readingLine.length > 0);
  assert.ok(result.implicationLine.length > 0);
});

test("comparative-case output returns expected shape", () => {
  const args = makeBaseArgs();
  const result = buildExecutiveOverview(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(result.overviewLine.length > 0);
  assert.ok(result.structuralTension.length > 0);
  assert.ok(result.readingLine.length > 0);
  assert.ok(result.implicationLine.length > 0);
});

test("wording stays recommendation-free", () => {
  const args = makeBaseArgs();
  const result = buildExecutiveOverview(args as any);
  const text = [result.overviewLine, result.structuralTension, result.readingLine, result.implicationLine]
    .join(" ")
    .toLowerCase();

  const banned = ["you should", "best option", "right answer", "strong recommendation"];
  for (const token of banned) {
    assert.equal(text.includes(token), false);
  }
});

test("weak signals still return safe fallback text", () => {
  const result = buildExecutiveOverview({
    normalized: { mainDecision: "", optionsUnderConsideration: "" } as any,
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
    inputSummary: { decisionSnapshot: { optionsUnderConsideration: "" } } as any,
  });

  assert.ok(result.overviewLine.length > 0);
  assert.ok(result.structuralTension.length > 0);
  assert.ok(result.readingLine.length > 0);
  assert.ok(result.implicationLine.length > 0);
});
