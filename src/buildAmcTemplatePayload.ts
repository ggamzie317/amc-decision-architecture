export function buildAmcTemplatePayload(reportPayload: any) {
  const meta = reportPayload?.meta || {};
  const sections: any[] = Array.isArray(reportPayload?.sections) ? reportPayload.sections : [];

  const sectionMap = new Map<string, any>();
  for (const section of sections) {
    if (section && typeof section.section === "string") {
      sectionMap.set(section.section, section);
    }
  }

  const executive = requireSection(sectionMap, "executive_overview");
  const external = requireSection(sectionMap, "external_snapshot");
  const internal = requireSection(sectionMap, "internal_structural_snapshot");
  const risk = requireSection(sectionMap, "structural_risk_diagnosis");
  const value = requireSection(sectionMap, "career_value_structure");
  const mobility = requireSection(sectionMap, "career_mobility_structure");
  const temperament = requireSection(sectionMap, "strategic_temperament");
  const conditions = requireSection(sectionMap, "decision_conditions");

  const caseType =
    executive.caseType ||
    external.caseType ||
    internal.caseType ||
    risk.caseType ||
    value.caseType ||
    mobility.caseType ||
    temperament.caseType ||
    conditions.caseType ||
    "single";

  return {
    meta_report_type: valueOrEmpty(meta.reportType),
    meta_version: valueOrEmpty(meta.version),
    meta_generated_at: valueOrEmpty(meta.generatedAt),

    case_type: valueOrEmpty(caseType),

    executive_overview_title: valueOrEmpty(executive.title),
    executive_overview_overview_line: valueOrEmpty(executive.overviewLine),
    executive_overview_structural_tension: valueOrEmpty(executive.structuralTension),
    executive_overview_reading_line: valueOrEmpty(executive.readingLine),
    executive_overview_implication_line: valueOrEmpty(executive.implicationLine),

    external_snapshot_title: valueOrEmpty(external.title),
    external_snapshot_market_line: valueOrEmpty(external.marketLine),
    external_snapshot_position_line: valueOrEmpty(external.positionLine),
    external_snapshot_friction_line: valueOrEmpty(external.frictionLine),
    external_snapshot_signal_line: valueOrEmpty(external.signalLine),
    external_snapshot_comparative_reading: valueOrEmpty(external.comparativeReading),

    internal_structural_snapshot_title: valueOrEmpty(internal.title),
    internal_structural_snapshot_clarity_line: valueOrEmpty(internal.clarityLine),
    internal_structural_snapshot_readiness_line: valueOrEmpty(internal.readinessLine),
    internal_structural_snapshot_support_line: valueOrEmpty(internal.supportLine),
    internal_structural_snapshot_strain_line: valueOrEmpty(internal.strainLine),
    internal_structural_snapshot_comparative_reading: valueOrEmpty(internal.comparativeReading),

    structural_risk_diagnosis_title: valueOrEmpty(risk.title),
    structural_risk_diagnosis_primary_risk: valueOrEmpty(risk.primaryRisk),
    structural_risk_diagnosis_secondary_risk: valueOrEmpty(risk.secondaryRisk),
    structural_risk_diagnosis_distortion_risk: valueOrEmpty(risk.distortionRisk),
    structural_risk_diagnosis_handling_line: valueOrEmpty(risk.handlingLine),
    structural_risk_diagnosis_comparative_reading: valueOrEmpty(risk.comparativeReading),

    career_value_structure_title: valueOrEmpty(value.title),
    career_value_structure_primary_value_line: valueOrEmpty(value.primaryValueLine),
    career_value_structure_secondary_value_line: valueOrEmpty(value.secondaryValueLine),
    career_value_structure_tension_line: valueOrEmpty(value.tensionLine),
    career_value_structure_alignment_line: valueOrEmpty(value.alignmentLine),
    career_value_structure_comparative_reading: valueOrEmpty(value.comparativeReading),

    career_mobility_structure_title: valueOrEmpty(mobility.title),
    career_mobility_structure_mobility_line: valueOrEmpty(mobility.mobilityLine),
    career_mobility_structure_portability_line: valueOrEmpty(mobility.portabilityLine),
    career_mobility_structure_burden_line: valueOrEmpty(mobility.burdenLine),
    career_mobility_structure_timing_line: valueOrEmpty(mobility.timingLine),
    career_mobility_structure_comparative_reading: valueOrEmpty(mobility.comparativeReading),

    strategic_temperament_title: valueOrEmpty(temperament.title),
    strategic_temperament_posture_line: valueOrEmpty(temperament.postureLine),
    strategic_temperament_evidence_line: valueOrEmpty(temperament.evidenceLine),
    strategic_temperament_pace_line: valueOrEmpty(temperament.paceLine),
    strategic_temperament_discipline_line: valueOrEmpty(temperament.disciplineLine),
    strategic_temperament_comparative_reading: valueOrEmpty(temperament.comparativeReading),

    decision_conditions_title: valueOrEmpty(conditions.title),
    decision_conditions_validation_condition: valueOrEmpty(conditions.validationCondition),
    decision_conditions_readiness_condition: valueOrEmpty(conditions.readinessCondition),
    decision_conditions_support_condition: valueOrEmpty(conditions.supportCondition),
    decision_conditions_commitment_condition: valueOrEmpty(conditions.commitmentCondition),
    decision_conditions_comparative_reading: valueOrEmpty(conditions.comparativeReading),
  };
}

function requireSection(map: Map<string, any>, sectionId: string): any {
  const section = map.get(sectionId);
  if (!section) {
    throw new Error(`Missing required section: ${sectionId}`);
  }
  return section;
}

function valueOrEmpty(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}
