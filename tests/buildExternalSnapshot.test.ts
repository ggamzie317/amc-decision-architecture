import assert from "node:assert/strict";
import test from "node:test";

import { buildExternalSnapshot } from "../src/buildExternalSnapshot";

type AnyObj = Record<string, any>;

function makeBaseArgs(): { normalized: AnyObj; structuralFlags: AnyObj; inputSummary: AnyObj } {
  const normalized = {
    mainDecision: "a transition from current role to external path",
    optionsUnderConsideration: "Option A: remain on current path. Option B: external move.",
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
  args.normalized.optionsUnderConsideration = "Evaluating one external path under current constraints.";
  args.inputSummary.decisionSnapshot.optionsUnderConsideration = args.normalized.optionsUnderConsideration;

  const result = buildExternalSnapshot(args as any);

  assert.equal(result.section, "external_snapshot");
  assert.equal(result.title, "External Snapshot");
  assert.equal(result.caseType, "single");
  assert.ok(result.marketLine.length > 0);
  assert.ok(result.positionLine.length > 0);
  assert.ok(result.frictionLine.length > 0);
  assert.ok(result.signalLine.length > 0);
});

test("comparative-case output returns expected shape", () => {
  const args = makeBaseArgs();
  const result = buildExternalSnapshot(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(result.marketLine.length > 0);
  assert.ok(result.positionLine.length > 0);
  assert.ok(result.frictionLine.length > 0);
  assert.ok(result.signalLine.length > 0);
});

test("comparative case can include comparativeReading", () => {
  const args = makeBaseArgs();
  const result = buildExternalSnapshot(args as any);

  assert.equal(result.caseType, "comparative");
  assert.ok(typeof result.comparativeReading === "string");
  assert.ok((result.comparativeReading || "").length > 0);
});

test("wording remains recommendation-free", () => {
  const args = makeBaseArgs();
  const result = buildExternalSnapshot(args as any);
  const text = [
    result.marketLine,
    result.positionLine,
    result.frictionLine,
    result.signalLine,
    result.comparativeReading || "",
  ]
    .join(" ")
    .toLowerCase();

  const banned = ["you should", "best option", "right choice", "guaranteed", "take the leap", "follow your passion"];
  for (const token of banned) {
    assert.equal(text.includes(token), false);
  }
});

test("weak or missing signals return safe fallback text", () => {
  const result = buildExternalSnapshot({
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

  assert.ok(result.marketLine.includes("not yet fully consolidated"));
  assert.ok(result.positionLine.length > 0);
  assert.ok(result.frictionLine.length > 0);
  assert.ok(result.signalLine.length > 0);
});
