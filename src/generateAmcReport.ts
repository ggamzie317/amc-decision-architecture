import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildAmcDocxPayload } from "./buildAmcDocxPayload";

export interface GenerateAmcReportOptions {
  templatePath: string;
  outPath: string;
  payloadPath?: string;
  pythonBin?: string;
  now?: () => Date;
  strictUndeclared?: boolean;
}

export interface AmcRenderInput {
  docxPayload: ReturnType<typeof buildAmcDocxPayload>;
  mergePayload: Record<string, unknown>;
}

export function buildAmcRenderInput(rawIntake: any, options: { now?: () => Date } = {}): AmcRenderInput {
  const docxPayload = buildAmcDocxPayload(rawIntake, options);
  const mergePayload = buildNestedTemplateContext(rawIntake, docxPayload);
  return { docxPayload, mergePayload };
}

export function generateAmcReport(rawIntake: any, options: GenerateAmcReportOptions) {
  const pythonBin = options.pythonBin || "python3";
  const payloadPath = options.payloadPath || path.join("output", "amc_docx_payload_latest.json");
  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFile);
  const mergeScriptPath = path.join(thisDir, "merge_docx.py");

  const { docxPayload, mergePayload } = buildAmcRenderInput(rawIntake, {
    now: options.now,
  });

  fs.mkdirSync(path.dirname(payloadPath), { recursive: true });
  fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
  fs.writeFileSync(payloadPath, JSON.stringify(mergePayload, null, 2) + "\n", "utf-8");

  execFileSync(
    pythonBin,
    [
      mergeScriptPath,
      "--template",
      options.templatePath,
      "--payload",
      payloadPath,
      "--out",
      options.outPath,
      ...(options.strictUndeclared ? ["--strict-undeclared"] : []),
    ],
    { stdio: "pipe" },
  );

  return {
    payloadPath,
    outPath: options.outPath,
    docxPayload,
  };
}

function buildNestedTemplateContext(rawIntake: any, docxPayload: ReturnType<typeof buildAmcDocxPayload>) {
  const flat = docxPayload.templatePayload || {};
  const sections = indexSections(docxPayload?.reportPayload?.sections);
  const executive = sections.executive_overview || {};
  const external = sections.external_snapshot || {};
  const internal = sections.internal_structural_snapshot || {};
  const risk = sections.structural_risk_diagnosis || {};
  const value = sections.career_value_structure || {};
  const mobility = sections.career_mobility_structure || {};
  const temperament = sections.strategic_temperament || {};
  const conditions = sections.decision_conditions || {};
  const flags = docxPayload?.reportPayload?.inputs?.structuralFlags || {};
  const normalized = docxPayload?.reportPayload?.inputs?.normalized || {};
  const caseTypeRaw = String(executive.caseType || flat.case_type || "").toLowerCase();
  const mode = caseTypeRaw === "comparative" ? "comparative" : "single";
  const caseType = mode === "comparative" ? "comparative" : "single_path";
  const completenessScore = computeIntakeCompletenessScore(normalized);

  const labels = extractOptionLabels(rawIntake);

  const matrix = {
    market_outlook: { visual: visualFromBand(pickBand(flags.growingMarketOutlook, flags.decliningMarketOutlook)) },
    company_stability: {
      visual: visualFromBand(pickBand(flags.highCompanyStability, flags.lowCompanyStability)),
    },
    fifwm_risk: { visual: visualFromBand(pickBand(flags.strongSafetyNet, flags.weakSafetyNet)) },
    personal_fit: {
      visual: visualFromBand(
        pickBand(
          !!flags.highDecisionClarity && !!flags.highRiskComfort,
          !!flags.lowDecisionClarity || !!flags.lowRiskComfort,
        ),
      ),
    },
    upside_downside: {
      visual: visualFromBand(pickBand(flags.structurallySupportedMove, flags.structurallyFragileMove)),
    },
  };

  const nested = {
    meta: {
      report_type: valueOrFallback(docxPayload?.meta?.reportType),
      version: valueOrFallback(docxPayload?.meta?.version),
      generated_at: valueOrFallback(docxPayload?.meta?.generatedAt),
    },
    mode,
    case: {
      case_type: caseType,
      verdict_label: valueOrFallback(deriveVerdictLabel(executive, flat)),
      option_a_label: mode === "comparative" ? valueOrFallback(labels.optionA) : "",
      option_b_label: mode === "comparative" ? valueOrFallback(labels.optionB) : "",
    },
    executive_summary: {
      verdict_line: valueOrFallback(executive.overviewLine || flat.executive_overview_overview_line),
      structural_outlook_line: valueOrFallback(executive.readingLine || flat.executive_overview_reading_line),
      structural_risk_line: valueOrFallback(risk.primaryRisk || flat.structural_risk_diagnosis_primary_risk),
      personal_exposure_line: valueOrFallback(internal.strainLine || flat.internal_structural_snapshot_strain_line),
      assessment_basis_line: valueOrFallback(buildAssessmentBasisLine(completenessScore)),
    },
    external_snapshot: {
      title: valueOrFallback(external.title || flat.external_snapshot_title),
      market_direction: valueOrFallback(external.marketLine || flat.external_snapshot_market_line),
      competition_pressure: valueOrFallback(external.positionLine || flat.external_snapshot_position_line),
      economic_pressure: valueOrFallback(external.signalLine || flat.external_snapshot_signal_line),
      transition_friction: valueOrFallback(external.frictionLine || flat.external_snapshot_friction_line),
    },
    comparative_snapshot: {
      option_a: {
        market_status: "◆ Mixed",
        competition_status: "◐ Moderate",
        economic_status: "◐ Moderate",
        transition_status: "◐ Moderate",
      },
      option_b: {
        market_status: "◆ Mixed",
        competition_status: "◐ Moderate",
        economic_status: "◐ Moderate",
        transition_status: "● Elevated",
      },
      reading: valueOrFallback(external.comparativeReading || flat.external_snapshot_comparative_reading),
      implication: valueOrFallback(conditions.comparativeReading || flat.decision_conditions_comparative_reading),
    },
    matrix,
    diagnosis: {
      market_outlook: {
        read: valueOrFallback(external.marketLine || flat.external_snapshot_market_line),
        risk: valueOrFallback(risk.secondaryRisk || flat.structural_risk_diagnosis_secondary_risk),
        condition: valueOrFallback(risk.handlingLine || flat.structural_risk_diagnosis_handling_line),
      },
      company_stability: {
        read: valueOrFallback(internal.supportLine || flat.internal_structural_snapshot_support_line),
        risk: valueOrFallback(risk.secondaryRisk || flat.structural_risk_diagnosis_secondary_risk),
        condition: valueOrFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
      },
      fifwm_risk: {
        read: valueOrFallback(risk.primaryRisk || flat.structural_risk_diagnosis_primary_risk),
        risk: valueOrFallback(risk.distortionRisk || flat.structural_risk_diagnosis_distortion_risk),
        condition: valueOrFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
      },
      personal_fit: {
        read: valueOrFallback(internal.clarityLine || flat.internal_structural_snapshot_clarity_line),
        risk: valueOrFallback(value.tensionLine || flat.career_value_structure_tension_line),
        condition: valueOrFallback(value.alignmentLine || flat.career_value_structure_alignment_line),
      },
      upside_downside: {
        read: valueOrFallback(mobility.mobilityLine || flat.career_mobility_structure_mobility_line),
        risk: valueOrFallback(mobility.burdenLine || flat.career_mobility_structure_burden_line),
        condition: valueOrFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
    },
    exploration_plan: {
      experiment_1: {
        timeline: "Weeks 1–6",
        objective: valueOrFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
        design: valueOrFallback("Run structured market and portability checks against target path assumptions."),
        validation_signal: valueOrFallback(external.marketLine || flat.external_snapshot_market_line),
        stop_or_scale_rule: valueOrFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
      experiment_2: {
        timeline: "Weeks 3–8",
        objective: valueOrFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
        design: valueOrFallback("Test execution readiness under explicit workload, pace, and sequencing constraints."),
        validation_signal: valueOrFallback(internal.readinessLine || flat.internal_structural_snapshot_readiness_line),
        stop_or_scale_rule: valueOrFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
      experiment_3: {
        timeline: "Weeks 6–12",
        objective: valueOrFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
        design: valueOrFallback("Validate sponsor, fallback, and support durability before commitment."),
        validation_signal: valueOrFallback(temperament.disciplineLine || flat.strategic_temperament_discipline_line),
        stop_or_scale_rule: valueOrFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
    },
    execution_map: {
      phase_1: {
        priority_action: valueOrFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
        success_signal: valueOrFallback(external.marketLine || flat.external_snapshot_market_line),
      },
      phase_2: {
        priority_action: valueOrFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
        success_signal: valueOrFallback(internal.readinessLine || flat.internal_structural_snapshot_readiness_line),
      },
      phase_3: {
        priority_action: valueOrFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
        success_signal: valueOrFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
    },
    assumptions_watchlist: {
      assumption_1: {
        statement: valueOrFallback(risk.secondaryRisk || flat.structural_risk_diagnosis_secondary_risk),
        break_signal: valueOrFallback(risk.distortionRisk || flat.structural_risk_diagnosis_distortion_risk),
      },
      assumption_2: {
        statement: valueOrFallback(internal.strainLine || flat.internal_structural_snapshot_strain_line),
        break_signal: valueOrFallback(mobility.burdenLine || flat.career_mobility_structure_burden_line),
      },
      assumption_3: {
        statement: valueOrFallback(value.tensionLine || flat.career_value_structure_tension_line),
        break_signal: valueOrFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
      },
    },
    commitment: {
      validation_condition: valueOrFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
      readiness_condition: valueOrFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
      support_condition: valueOrFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
      commitment_condition: valueOrFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      reassessment_trigger: valueOrFallback(
        "Reassessment is required if key structural signals deteriorate before commitment conditions close.",
      ),
    },
  };

  return applyNullFallbacks(nested);
}

function valueOrFallback(value: unknown): string {
  if (value === null || value === undefined) {
    return "[Not applicable]";
  }
  const text = String(value).trim();
  return text ? text : "[Not applicable]";
}

function applyNullFallbacks(value: any): any {
  if (value === null || value === undefined) {
    return "[Not applicable]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyNullFallbacks(item));
  }
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = applyNullFallbacks(v);
    }
    return out;
  }
  if (typeof value === "string") {
    return value.trim() ? value : "[Not applicable]";
  }
  return value;
}

function deriveVerdictLabel(executive: Record<string, unknown>, flat: Record<string, string>) {
  const overview = String(executive.overviewLine || flat.executive_overview_overview_line || "").toLowerCase();
  if (overview.includes("comparative") || overview.includes("comparison")) {
    return "Comparative Structural Reading";
  }
  return "Structural Reading";
}

function pickBand(strong: unknown, weak: unknown): "strong" | "partial" | "weak" {
  if (strong) {
    return "strong";
  }
  if (weak) {
    return "weak";
  }
  return "partial";
}

function visualFromBand(band: "strong" | "partial" | "weak"): string {
  if (band === "strong") {
    return "▲ Supportive";
  }
  if (band === "weak") {
    return "▼ Constrained";
  }
  return "◆ Mixed";
}

function extractOptionLabels(rawIntake: any): { optionA: string; optionB: string } {
  const optionsText = String(rawIntake?.optionsUnderConsideration || "");
  const optionA = extractLabeledOption(optionsText, "A") || "Option A";
  const optionB = extractLabeledOption(optionsText, "B") || "Option B";
  return { optionA, optionB };
}

function extractLabeledOption(source: string, label: "A" | "B"): string | null {
  const m = source.match(new RegExp(`Option\\\\s*${label}\\\\s*:\\\\s*([^\\\\n.]+)`));
  if (!m || !m[1]) {
    return null;
  }
  const value = m[1].trim();
  return value || null;
}

function indexSections(sections: any[] | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  if (!Array.isArray(sections)) {
    return out;
  }
  for (const section of sections) {
    const id = section?.section;
    if (typeof id === "string" && id) {
      out[id] = section;
    }
  }
  return out;
}

function computeIntakeCompletenessScore(normalized: Record<string, unknown>): number {
  const fields = [
    "fullName",
    "email",
    "location",
    "currentRoleCompany",
    "yearsExperience",
    "mainDecision",
    "urgency",
    "optionsUnderConsideration",
    "forcedChoiceToday",
    "topPriorities",
    "nonNegotiable",
    "biggestRisks",
    "marketDemandOutlook",
    "marketDemandReason",
    "profileDifferentiation",
    "companyHealthConfidence",
    "companyStability",
    "restructuringHistory",
    "sponsorSupport",
    "decisionLineClarity",
    "workflowPace",
    "externalShockExposure",
    "riskOptimizationStyle",
    "visibleRiskComfort",
    "commitmentStyle",
    "energizingWorkStyle",
    "stayScenario12to18m",
    "planBStrength",
    "reportValueExpectation",
    "mustAnswerQuestion",
  ] as const;

  let present = 0;
  for (const field of fields) {
    const value = normalized[field];
    if (Array.isArray(value)) {
      if (value.length > 0) {
        present += 1;
      }
      continue;
    }
    if (typeof value === "string") {
      if (value.trim()) {
        present += 1;
      }
      continue;
    }
    if (value !== null && value !== undefined) {
      present += 1;
    }
  }

  return present / fields.length;
}

function buildAssessmentBasisLine(completenessScore: number): string {
  if (completenessScore >= 0.85) {
    return "Assessment basis: Qualitative structural signals with sufficient input depth for decision framing.";
  }
  return "Assessment basis: Qualitative structural signals available; quantitative depth limited - interpretation reflects available input.";
}
