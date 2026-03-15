import assert from "node:assert/strict";
import test from "node:test";

import { buildAmcDocxPayload, buildAmcDocxPayloadFromReportPayload } from "../src/buildAmcDocxPayload";
import { assembleAmcReportPayload } from "../src/assembleAmcReportPayload";

function makeRawIntake(caseMode: "single" | "comparative" = "single") {
  return {
    fullName: "Alex Kim",
    email: "alex@example.com",
    mainDecision: "Evaluate a career transition",
    optionsUnderConsideration:
      caseMode === "comparative"
        ? "Option A: continuity path. Option B: transition path."
        : "Evaluate one path under current constraints.",
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

test("raw intake returns meta/reportPayload/templatePayload", () => {
  const fixedNow = () => new Date("2026-03-15T15:00:00.000Z");
  const result = buildAmcDocxPayload(makeRawIntake("single"), { now: fixedNow });

  assert.equal(result.meta.reportType, "amc_docx_payload");
  assert.equal(result.meta.version, "v1");
  assert.ok(result.reportPayload);
  assert.ok(result.templatePayload);
});

test("meta.caseType matches template/report case type", () => {
  const result = buildAmcDocxPayload(makeRawIntake("comparative"));

  assert.equal(result.meta.caseType, "comparative");
  assert.equal(result.templatePayload.case_type, "comparative");
  assert.equal(result.reportPayload.sections[0].caseType, "comparative");
});

test("generatedAt is stable and consistent", () => {
  const fixedNow = () => new Date("2026-03-15T15:00:00.000Z");
  const result = buildAmcDocxPayload(makeRawIntake("single"), { now: fixedNow });

  assert.equal(result.meta.generatedAt, "2026-03-15T15:00:00.000Z");
  assert.equal(result.reportPayload.meta.generatedAt, "2026-03-15T15:00:00.000Z");
  assert.equal(result.templatePayload.meta_generated_at, "2026-03-15T15:00:00.000Z");
});

test("templatePayload contains expected flat keys", () => {
  const result = buildAmcDocxPayload(makeRawIntake("single"));

  assert.ok(Object.prototype.hasOwnProperty.call(result.templatePayload, "executive_overview_title"));
  assert.ok(Object.prototype.hasOwnProperty.call(result.templatePayload, "external_snapshot_market_line"));
  assert.ok(Object.prototype.hasOwnProperty.call(result.templatePayload, "decision_conditions_commitment_condition"));
});

test("comparative raw intake flows through correctly", () => {
  const result = buildAmcDocxPayload(makeRawIntake("comparative"));

  assert.equal(result.meta.caseType, "comparative");
  assert.equal(result.templatePayload.case_type, "comparative");
  assert.ok(result.templatePayload.external_snapshot_comparative_reading.length > 0);
  assert.ok(result.templatePayload.decision_conditions_comparative_reading.length > 0);
});

test("no missing top-level pieces", () => {
  const reportPayload = assembleAmcReportPayload(makeRawIntake("single"), {
    now: () => new Date("2026-03-15T15:00:00.000Z"),
  });
  const result = buildAmcDocxPayloadFromReportPayload(reportPayload);

  assert.ok(result.meta);
  assert.ok(result.reportPayload);
  assert.ok(result.templatePayload);
  assert.equal(result.meta.generatedAt, reportPayload.meta.generatedAt);
});
