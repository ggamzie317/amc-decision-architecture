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
}

export interface AmcRenderInput {
  docxPayload: ReturnType<typeof buildAmcDocxPayload>;
  mergePayload: Record<string, string>;
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
  const flags = docxPayload?.reportPayload?.inputs?.structuralFlags || {};
  const caseTypeRaw = String(flat.case_type || "").toLowerCase();
  const mode = caseTypeRaw === "comparative" ? "comparative" : "single";
  const caseType = mode === "comparative" ? "comparative" : "single_path";

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
      verdict_label: valueOrFallback(deriveVerdictLabel(flat)),
      option_a_label: mode === "comparative" ? valueOrFallback(labels.optionA) : "",
      option_b_label: mode === "comparative" ? valueOrFallback(labels.optionB) : "",
    },
    executive_summary: {
      verdict_line: valueOrFallback(flat.executive_overview_overview_line),
      structural_outlook_line: valueOrFallback(flat.executive_overview_reading_line),
      structural_risk_line: valueOrFallback(flat.structural_risk_diagnosis_primary_risk),
      personal_exposure_line: valueOrFallback(flat.career_mobility_structure_burden_line),
      assessment_basis_line: valueOrFallback(
        "Assessment basis: Qualitative structural signals available; interpretation reflects current input depth.",
      ),
    },
    external_snapshot: {
      title: valueOrFallback(flat.external_snapshot_title),
      market_direction: valueOrFallback(flat.external_snapshot_market_line),
      competition_pressure: valueOrFallback(flat.external_snapshot_position_line),
      economic_pressure: valueOrFallback(flat.external_snapshot_signal_line),
      transition_friction: valueOrFallback(flat.external_snapshot_friction_line),
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
      reading: valueOrFallback(flat.external_snapshot_comparative_reading),
      implication: valueOrFallback(flat.decision_conditions_comparative_reading),
    },
    matrix,
    diagnosis: {
      market_outlook: {
        read: valueOrFallback(flat.external_snapshot_market_line),
        risk: valueOrFallback(flat.structural_risk_diagnosis_secondary_risk),
        condition: valueOrFallback(flat.structural_risk_diagnosis_handling_line),
      },
      company_stability: {
        read: valueOrFallback(flat.internal_structural_snapshot_support_line),
        risk: valueOrFallback(flat.structural_risk_diagnosis_secondary_risk),
        condition: valueOrFallback(flat.decision_conditions_support_condition),
      },
      fifwm_risk: {
        read: valueOrFallback(flat.structural_risk_diagnosis_primary_risk),
        risk: valueOrFallback(flat.structural_risk_diagnosis_distortion_risk),
        condition: valueOrFallback(flat.decision_conditions_validation_condition),
      },
      personal_fit: {
        read: valueOrFallback(flat.internal_structural_snapshot_clarity_line),
        risk: valueOrFallback(flat.career_value_structure_tension_line),
        condition: valueOrFallback(flat.career_value_structure_alignment_line),
      },
      upside_downside: {
        read: valueOrFallback(flat.career_mobility_structure_mobility_line),
        risk: valueOrFallback(flat.career_mobility_structure_burden_line),
        condition: valueOrFallback(flat.decision_conditions_commitment_condition),
      },
    },
    exploration_plan: {
      experiment_1: {
        timeline: "Weeks 1–6",
        objective: valueOrFallback(flat.decision_conditions_validation_condition),
        design: valueOrFallback(flat.external_snapshot_signal_line),
        validation_signal: valueOrFallback(flat.external_snapshot_market_line),
        stop_or_scale_rule: valueOrFallback(flat.decision_conditions_commitment_condition),
      },
      experiment_2: {
        timeline: "Weeks 3–8",
        objective: valueOrFallback(flat.decision_conditions_readiness_condition),
        design: valueOrFallback(flat.career_mobility_structure_timing_line),
        validation_signal: valueOrFallback(flat.internal_structural_snapshot_readiness_line),
        stop_or_scale_rule: valueOrFallback(flat.decision_conditions_commitment_condition),
      },
      experiment_3: {
        timeline: "Weeks 6–12",
        objective: valueOrFallback(flat.decision_conditions_support_condition),
        design: valueOrFallback(flat.internal_structural_snapshot_support_line),
        validation_signal: valueOrFallback(flat.strategic_temperament_discipline_line),
        stop_or_scale_rule: valueOrFallback(flat.decision_conditions_commitment_condition),
      },
    },
    execution_map: {
      phase_1: {
        priority_action: valueOrFallback(flat.decision_conditions_validation_condition),
        success_signal: valueOrFallback(flat.external_snapshot_market_line),
      },
      phase_2: {
        priority_action: valueOrFallback(flat.decision_conditions_readiness_condition),
        success_signal: valueOrFallback(flat.internal_structural_snapshot_readiness_line),
      },
      phase_3: {
        priority_action: valueOrFallback(flat.decision_conditions_support_condition),
        success_signal: valueOrFallback(flat.decision_conditions_commitment_condition),
      },
    },
    assumptions_watchlist: {
      assumption_1: {
        statement: valueOrFallback(flat.structural_risk_diagnosis_secondary_risk),
        break_signal: valueOrFallback(flat.structural_risk_diagnosis_distortion_risk),
      },
      assumption_2: {
        statement: valueOrFallback(flat.internal_structural_snapshot_strain_line),
        break_signal: valueOrFallback(flat.career_mobility_structure_burden_line),
      },
      assumption_3: {
        statement: valueOrFallback(flat.career_value_structure_tension_line),
        break_signal: valueOrFallback(flat.decision_conditions_readiness_condition),
      },
    },
    commitment: {
      validation_condition: valueOrFallback(flat.decision_conditions_validation_condition),
      readiness_condition: valueOrFallback(flat.decision_conditions_readiness_condition),
      support_condition: valueOrFallback(flat.decision_conditions_support_condition),
      commitment_condition: valueOrFallback(flat.decision_conditions_commitment_condition),
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

function deriveVerdictLabel(flat: Record<string, string>) {
  const overview = String(flat.executive_overview_overview_line || "").toLowerCase();
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
