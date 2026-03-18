import assert from "node:assert/strict";
import test from "node:test";

import { assembleAmcReportPayload } from "../src/assembleAmcReportPayload";

const EXPECTED_ORDER = [
  "executive_overview",
  "external_snapshot",
  "internal_structural_snapshot",
  "structural_risk_diagnosis",
  "career_value_structure",
  "career_mobility_structure",
  "strategic_temperament",
  "decision_conditions",
];

function makeBaseRawIntake() {
  return {
    fullName: "Alex Kim",
    email: "alex@example.com",
    mainDecision: "Evaluate transition from current role to external role",
    optionsUnderConsideration: "Option A: stay in current path. Option B: move externally.",
    urgency: "Within 3 months",
    planBStrength: "I have some alternatives or savings.",
    sponsorSupport: "Maybe – some goodwill, but not sure about real backing",
    decisionLineClarity: "Somewhat clear",
    companyStability: "Somewhat stable, but with noticeable changes or uncertainty",
    externalShockExposure: "Some exposure, but manageable",
    marketDemandOutlook: "Unclear / mixed",
    profileDifferentiation: "Some differentiation, but still competitive",
    riskOptimizationStyle: "Balancing risk and reward",
    visibleRiskComfort: "Somewhat comfortable",
    commitmentStyle: "I commit gradually but can change direction if needed.",
  };
}

test("assembler returns meta, inputs, and sections", () => {
  const fixedNow = () => new Date("2026-03-15T10:00:00.000Z");
  const result = assembleAmcReportPayload(makeBaseRawIntake(), { now: fixedNow });

  assert.equal(result.meta.reportType, "amc_report_payload");
  assert.equal(result.meta.version, "v1");
  assert.equal(result.meta.generatedAt, "2026-03-15T10:00:00.000Z");

  assert.ok(result.inputs.normalized);
  assert.ok(result.inputs.structuralFlags);
  assert.ok(result.inputs.inputSummary);
  assert.ok(result.inputs.nativeMetadata);
  assert.equal(typeof result.inputs.nativeMetadata.inputCompletenessScore, "number");
  assert.ok(Array.isArray(result.sections));
});

test("sections are returned in the correct order", () => {
  const result = assembleAmcReportPayload(makeBaseRawIntake(), {
    now: () => new Date("2026-03-15T10:00:00.000Z"),
  });

  const order = result.sections.map((s: any) => s.section);
  assert.deepEqual(order, EXPECTED_ORDER);
});

test("section count matches current implemented builders", () => {
  const result = assembleAmcReportPayload(makeBaseRawIntake());
  assert.equal(result.sections.length, 8);
});

test("comparative raw intake flows through and returns comparative sections", () => {
  const comparativeRaw = {
    ...makeBaseRawIntake(),
    optionsUnderConsideration: "Option A: continuity path. Option B: transition path.",
  };

  const result = assembleAmcReportPayload(comparativeRaw);
  const caseTypes = result.sections.map((s: any) => s.caseType);

  assert.equal(caseTypes.length, 8);
  for (const caseType of caseTypes) {
    assert.equal(caseType, "comparative");
  }
});

test("generatedAt exists and no unexpected section omissions", () => {
  const result = assembleAmcReportPayload(makeBaseRawIntake());

  assert.ok(typeof result.meta.generatedAt === "string");
  assert.ok(result.meta.generatedAt.length > 0);

  const sections = new Set(result.sections.map((s: any) => s.section));
  for (const name of EXPECTED_ORDER) {
    assert.equal(sections.has(name), true);
  }
});
