import assert from "node:assert/strict";
import test from "node:test";

import { assembleAmcReportPayload } from "../src/assembleAmcReportPayload";
import { buildAmcTemplatePayload } from "../src/buildAmcTemplatePayload";

function makeRawIntake(caseMode: "single" | "comparative" = "single") {
  return {
    fullName: "Alex Kim",
    email: "alex@example.com",
    mainDecision: "Evaluate a career transition",
    optionsUnderConsideration:
      caseMode === "comparative"
        ? "Option A: continuity path. Option B: external transition path."
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

const EXPECTED_KEYS = [
  "meta_report_type",
  "meta_version",
  "meta_generated_at",
  "case_type",
  "executive_overview_title",
  "executive_overview_overview_line",
  "executive_overview_structural_tension",
  "executive_overview_reading_line",
  "executive_overview_implication_line",
  "external_snapshot_title",
  "external_snapshot_market_line",
  "external_snapshot_position_line",
  "external_snapshot_friction_line",
  "external_snapshot_signal_line",
  "external_snapshot_comparative_reading",
  "internal_structural_snapshot_title",
  "internal_structural_snapshot_clarity_line",
  "internal_structural_snapshot_readiness_line",
  "internal_structural_snapshot_support_line",
  "internal_structural_snapshot_strain_line",
  "internal_structural_snapshot_comparative_reading",
  "structural_risk_diagnosis_title",
  "structural_risk_diagnosis_primary_risk",
  "structural_risk_diagnosis_secondary_risk",
  "structural_risk_diagnosis_distortion_risk",
  "structural_risk_diagnosis_handling_line",
  "structural_risk_diagnosis_comparative_reading",
  "career_value_structure_title",
  "career_value_structure_primary_value_line",
  "career_value_structure_secondary_value_line",
  "career_value_structure_tension_line",
  "career_value_structure_alignment_line",
  "career_value_structure_comparative_reading",
  "career_mobility_structure_title",
  "career_mobility_structure_mobility_line",
  "career_mobility_structure_portability_line",
  "career_mobility_structure_burden_line",
  "career_mobility_structure_timing_line",
  "career_mobility_structure_comparative_reading",
  "strategic_temperament_title",
  "strategic_temperament_posture_line",
  "strategic_temperament_evidence_line",
  "strategic_temperament_pace_line",
  "strategic_temperament_discipline_line",
  "strategic_temperament_comparative_reading",
  "decision_conditions_title",
  "decision_conditions_validation_condition",
  "decision_conditions_readiness_condition",
  "decision_conditions_support_condition",
  "decision_conditions_commitment_condition",
  "decision_conditions_comparative_reading",
];

test("all expected flat keys exist", () => {
  const assembled = assembleAmcReportPayload(makeRawIntake("single"), {
    now: () => new Date("2026-03-15T12:00:00.000Z"),
  });

  const flat = buildAmcTemplatePayload(assembled);

  for (const key of EXPECTED_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(flat, key), true, `Missing key: ${key}`);
  }
});

test("comparative fields become empty string when absent", () => {
  const assembled = assembleAmcReportPayload(makeRawIntake("single"));
  const flat = buildAmcTemplatePayload(assembled);

  assert.equal(flat.case_type, "single");
  assert.equal(flat.external_snapshot_comparative_reading, "");
  assert.equal(flat.internal_structural_snapshot_comparative_reading, "");
  assert.equal(flat.structural_risk_diagnosis_comparative_reading, "");
  assert.equal(flat.career_value_structure_comparative_reading, "");
  assert.equal(flat.career_mobility_structure_comparative_reading, "");
  assert.equal(flat.strategic_temperament_comparative_reading, "");
  assert.equal(flat.decision_conditions_comparative_reading, "");
});

test("comparative case maps comparative readings correctly", () => {
  const assembled = assembleAmcReportPayload(makeRawIntake("comparative"));
  const flat = buildAmcTemplatePayload(assembled);

  assert.equal(flat.case_type, "comparative");
  assert.ok(flat.external_snapshot_comparative_reading.length > 0);
  assert.ok(flat.internal_structural_snapshot_comparative_reading.length > 0);
  assert.ok(flat.structural_risk_diagnosis_comparative_reading.length > 0);
  assert.ok(flat.career_value_structure_comparative_reading.length > 0);
  assert.ok(flat.career_mobility_structure_comparative_reading.length > 0);
  assert.ok(flat.strategic_temperament_comparative_reading.length > 0);
  assert.ok(flat.decision_conditions_comparative_reading.length > 0);
});

test("missing required section throws clearly", () => {
  const assembled = assembleAmcReportPayload(makeRawIntake("single"));
  assembled.sections = assembled.sections.filter((s: any) => s.section !== "executive_overview");

  assert.throws(() => buildAmcTemplatePayload(assembled), /Missing required section: executive_overview/);
});

test("case_type is populated correctly", () => {
  const single = buildAmcTemplatePayload(assembleAmcReportPayload(makeRawIntake("single")));
  const comparative = buildAmcTemplatePayload(assembleAmcReportPayload(makeRawIntake("comparative")));

  assert.equal(single.case_type, "single");
  assert.equal(comparative.case_type, "comparative");
});
