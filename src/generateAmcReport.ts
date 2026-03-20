import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildAmcDocxPayload } from "./buildAmcDocxPayload";
import { getAmcRenderStrings, resolveAmcRenderLocale, type AmcRenderLocale } from "./amc/renderLocale";

export interface GenerateAmcReportOptions {
  templatePath: string;
  outPath: string;
  payloadPath?: string;
  pythonBin?: string;
  now?: () => Date;
  strictUndeclared?: boolean;
  locale?: AmcRenderLocale | string;
}

export interface AmcRenderInput {
  docxPayload: ReturnType<typeof buildAmcDocxPayload>;
  mergePayload: Record<string, unknown>;
}

export function resolveRenderLocale(
  args: { locale?: AmcRenderLocale | string },
  rawIntake: any,
): AmcRenderLocale {
  // Precedence: CLI/options override -> intake.lang -> default locale ("en").
  return resolveAmcRenderLocale(args.locale ?? rawIntake?.lang);
}

export function buildAmcRenderInput(
  rawIntake: any,
  options: { now?: () => Date; locale?: AmcRenderLocale | string } = {},
): AmcRenderInput {
  const docxPayload = buildAmcDocxPayload(rawIntake, options);
  const mergePayload = buildNestedTemplateContextFromDocxPayload(rawIntake, docxPayload, options.locale);
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
    locale: options.locale,
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
    renderWarnings: Array.isArray((mergePayload as any)?.meta?.native_mapping_warnings)
      ? ((mergePayload as any).meta.native_mapping_warnings as string[])
      : [],
  };
}

export function buildNestedTemplateContextFromDocxPayload(
  rawIntake: any,
  docxPayload: ReturnType<typeof buildAmcDocxPayload>,
  localeInput?: AmcRenderLocale | string,
) {
  const warnings: string[] = [];
  const locale = resolveRenderLocale({ locale: localeInput }, rawIntake);
  const strings = getAmcRenderStrings(locale);
  const withFallback = (value: unknown) => valueOrFallback(value, strings.notApplicable);
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
  const upstreamNative = docxPayload?.reportPayload?.inputs?.nativeMetadata || {};
  const caseTypeRaw = String(executive.caseType || flat.case_type || "").toLowerCase();
  const mode = caseTypeRaw === "comparative" ? "comparative" : "single";
  const caseType = mode === "comparative" ? "comparative" : "single_path";
  const completenessScore =
    typeof upstreamNative.inputCompletenessScore === "number"
      ? upstreamNative.inputCompletenessScore
      : computeIntakeCompletenessScore(normalized);

  const labels = resolveOptionLabels(upstreamNative.optionLabels, rawIntake, strings, warnings);
  const nativeComparativeStatus =
    external.comparativeOptionSignals || external.comparativeStatus || {};
  const upstreamMatrixBands = upstreamNative.matrixBands || {};
  const externalCue = buildExternalReadingCue(external.nativeMetadata, strings, warnings);
  const nativeConditionMetadata = conditions.nativeMetadata || {};
  const explorationDesignResolution = resolveExplorationDesigns(
    nativeConditionMetadata.explorationDesignHints,
    strings,
  );
  warnings.push(...explorationDesignResolution.warnings);
  const reassessmentTriggerResolution = resolveReassessmentTrigger(
    nativeConditionMetadata.reassessmentTriggerType,
    strings,
  );
  warnings.push(...reassessmentTriggerResolution.warnings);

  const marketBand = resolveMatrixBand(
    upstreamMatrixBands.marketOutlook,
    pickBand(flags.growingMarketOutlook, flags.decliningMarketOutlook),
    "marketOutlook",
    warnings,
  );
  const companyBand = resolveMatrixBand(
    upstreamMatrixBands.companyStability,
    pickBand(flags.highCompanyStability, flags.lowCompanyStability),
    "companyStability",
    warnings,
  );
  const fifwmBand = resolveMatrixBand(
    upstreamMatrixBands.fifwmRisk,
    pickBand(flags.strongSafetyNet, flags.weakSafetyNet),
    "fifwmRisk",
    warnings,
  );
  const personalBand = resolveMatrixBand(
    upstreamMatrixBands.personalFit,
    pickBand(
      !!flags.highDecisionClarity && !!flags.highRiskComfort,
      !!flags.lowDecisionClarity || !!flags.lowRiskComfort,
    ),
    "personalFit",
    warnings,
  );
  const upsideBand = resolveMatrixBand(
    upstreamMatrixBands.upsideDownside,
    pickBand(flags.structurallySupportedMove, flags.structurallyFragileMove),
    "upsideDownside",
    warnings,
  );

  const matrix = {
    market_outlook: {
      visual: visualFromBand(marketBand, strings),
    },
    company_stability: {
      visual: visualFromBand(companyBand, strings),
    },
    fifwm_risk: { visual: visualFromBand(fifwmBand, strings) },
    personal_fit: {
      visual: visualFromBand(personalBand, strings),
    },
    upside_downside: {
      visual: visualFromBand(upsideBand, strings),
    },
    reading_cue: buildMatrixReadingCue(
      {
        marketOutlook: marketBand,
        companyStability: companyBand,
        fifwmRisk: fifwmBand,
        personalFit: personalBand,
        upsideDownside: upsideBand,
      },
      strings,
    ),
  };

  const nested = {
    meta: {
      report_type: withFallback(docxPayload?.meta?.reportType),
      version: withFallback(docxPayload?.meta?.version),
      generated_at: withFallback(docxPayload?.meta?.generatedAt),
      native_mapping_warnings: warnings,
    },
    mode,
    case: {
      case_type: caseType,
      verdict_label: withFallback(deriveVerdictLabel(executive, flat, strings)),
      option_a_label: mode === "comparative" ? withFallback(labels.optionA) : "",
      option_b_label: mode === "comparative" ? withFallback(labels.optionB) : "",
    },
    executive_summary: {
      verdict_line: withFallback(executive.overviewLine || flat.executive_overview_overview_line),
      structural_outlook_line: withFallback(executive.readingLine || flat.executive_overview_reading_line),
      structural_risk_line: withFallback(risk.primaryRisk || flat.structural_risk_diagnosis_primary_risk),
      personal_exposure_line: withFallback(internal.strainLine || flat.internal_structural_snapshot_strain_line),
      assessment_basis_line: withFallback(buildAssessmentBasisLine(completenessScore, strings)),
    },
    external_snapshot: {
      title: withFallback(external.title || flat.external_snapshot_title),
      market_direction: withFallback(external.marketLine || flat.external_snapshot_market_line),
      competition_pressure: withFallback(external.positionLine || flat.external_snapshot_position_line),
      economic_pressure: withFallback(external.signalLine || flat.external_snapshot_signal_line),
      transition_friction: withFallback(external.frictionLine || flat.external_snapshot_friction_line),
      reading_cue: withFallback(externalCue),
    },
    comparative_snapshot: {
      option_a: {
        market_status: withFallback(nativeComparativeStatus?.optionA?.marketStatus || strings.defaultMarketStatus),
        competition_status: withFallback(
          nativeComparativeStatus?.optionA?.competitionStatus || strings.defaultPressureStatus,
        ),
        economic_status: withFallback(nativeComparativeStatus?.optionA?.economicStatus || strings.defaultPressureStatus),
        transition_status: withFallback(
          nativeComparativeStatus?.optionA?.transitionStatus || strings.defaultPressureStatus,
        ),
      },
      option_b: {
        market_status: withFallback(nativeComparativeStatus?.optionB?.marketStatus || strings.defaultMarketStatus),
        competition_status: withFallback(
          nativeComparativeStatus?.optionB?.competitionStatus || strings.defaultPressureStatus,
        ),
        economic_status: withFallback(nativeComparativeStatus?.optionB?.economicStatus || strings.defaultPressureStatus),
        transition_status: withFallback(
          nativeComparativeStatus?.optionB?.transitionStatus || strings.defaultElevatedPressureStatus,
        ),
      },
      reading: withFallback(external.comparativeReading || flat.external_snapshot_comparative_reading),
      implication: withFallback(conditions.comparativeReading || flat.decision_conditions_comparative_reading),
    },
    matrix,
    diagnosis: {
      market_outlook: {
        read: withFallback(external.marketLine || flat.external_snapshot_market_line),
        risk: withFallback(risk.secondaryRisk || flat.structural_risk_diagnosis_secondary_risk),
        condition: withFallback(risk.handlingLine || flat.structural_risk_diagnosis_handling_line),
      },
      company_stability: {
        read: withFallback(internal.supportLine || flat.internal_structural_snapshot_support_line),
        risk: withFallback(risk.secondaryRisk || flat.structural_risk_diagnosis_secondary_risk),
        condition: withFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
      },
      fifwm_risk: {
        read: withFallback(risk.primaryRisk || flat.structural_risk_diagnosis_primary_risk),
        risk: withFallback(risk.distortionRisk || flat.structural_risk_diagnosis_distortion_risk),
        condition: withFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
      },
      personal_fit: {
        read: withFallback(internal.clarityLine || flat.internal_structural_snapshot_clarity_line),
        risk: withFallback(value.tensionLine || flat.career_value_structure_tension_line),
        condition: withFallback(value.alignmentLine || flat.career_value_structure_alignment_line),
      },
      upside_downside: {
        read: withFallback(mobility.mobilityLine || flat.career_mobility_structure_mobility_line),
        risk: withFallback(mobility.burdenLine || flat.career_mobility_structure_burden_line),
        condition: withFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
    },
    exploration_plan: {
      experiment_1: {
        timeline: strings.experimentTimeline1,
        objective: withFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
        design: withFallback(explorationDesignResolution.designs.experiment1),
        validation_signal: withFallback(external.marketLine || flat.external_snapshot_market_line),
        stop_or_scale_rule: withFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
      experiment_2: {
        timeline: strings.experimentTimeline2,
        objective: withFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
        design: withFallback(explorationDesignResolution.designs.experiment2),
        validation_signal: withFallback(internal.readinessLine || flat.internal_structural_snapshot_readiness_line),
        stop_or_scale_rule: withFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
      experiment_3: {
        timeline: strings.experimentTimeline3,
        objective: withFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
        design: withFallback(explorationDesignResolution.designs.experiment3),
        validation_signal: withFallback(temperament.disciplineLine || flat.strategic_temperament_discipline_line),
        stop_or_scale_rule: withFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
    },
    execution_map: {
      phase_1: {
        priority_action: withFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
        success_signal: withFallback(external.marketLine || flat.external_snapshot_market_line),
      },
      phase_2: {
        priority_action: withFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
        success_signal: withFallback(internal.readinessLine || flat.internal_structural_snapshot_readiness_line),
      },
      phase_3: {
        priority_action: withFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
        success_signal: withFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      },
    },
    assumptions_watchlist: {
      assumption_1: {
        statement: withFallback(risk.secondaryRisk || flat.structural_risk_diagnosis_secondary_risk),
        break_signal: withFallback(risk.distortionRisk || flat.structural_risk_diagnosis_distortion_risk),
      },
      assumption_2: {
        statement: withFallback(internal.strainLine || flat.internal_structural_snapshot_strain_line),
        break_signal: withFallback(mobility.burdenLine || flat.career_mobility_structure_burden_line),
      },
      assumption_3: {
        statement: withFallback(value.tensionLine || flat.career_value_structure_tension_line),
        break_signal: withFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
      },
    },
    commitment: {
      validation_condition: withFallback(conditions.validationCondition || flat.decision_conditions_validation_condition),
      readiness_condition: withFallback(conditions.readinessCondition || flat.decision_conditions_readiness_condition),
      support_condition: withFallback(conditions.supportCondition || flat.decision_conditions_support_condition),
      commitment_condition: withFallback(conditions.commitmentCondition || flat.decision_conditions_commitment_condition),
      reassessment_trigger: withFallback(reassessmentTriggerResolution.value),
    },
  };

  return applyNullFallbacks(nested, strings.notApplicable);
}

function valueOrFallback(value: unknown, fallbackText: string): string {
  if (value === null || value === undefined) {
    return fallbackText;
  }
  const text = String(value).trim();
  return text ? text : fallbackText;
}

function applyNullFallbacks(value: any, fallbackText: string): any {
  if (value === null || value === undefined) {
    return fallbackText;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyNullFallbacks(item, fallbackText));
  }
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = applyNullFallbacks(v, fallbackText);
    }
    return out;
  }
  if (typeof value === "string") {
    return value.trim() ? value : fallbackText;
  }
  return value;
}

function deriveVerdictLabel(
  executive: Record<string, unknown>,
  flat: Record<string, string>,
  strings: { verdictLabelComparative: string; verdictLabelSingle: string },
) {
  const overview = String(executive.overviewLine || flat.executive_overview_overview_line || "").toLowerCase();
  if (overview.includes("comparative") || overview.includes("comparison")) {
    return strings.verdictLabelComparative;
  }
  return strings.verdictLabelSingle;
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

function visualFromBand(
  band: "strong" | "partial" | "weak",
  strings: { matrixVisualStrong: string; matrixVisualPartial: string; matrixVisualWeak: string },
): string {
  if (band === "strong") {
    return strings.matrixVisualStrong;
  }
  if (band === "weak") {
    return strings.matrixVisualWeak;
  }
  return strings.matrixVisualPartial;
}

function resolveOptionLabels(
  nativeOptionLabels: unknown,
  rawIntake: any,
  strings: { optionALabel: string; optionBLabel: string },
  warnings: string[],
): { optionA: string; optionB: string } {
  if (nativeOptionLabels !== null && nativeOptionLabels !== undefined && typeof nativeOptionLabels !== "object") {
    warnings.push("native_metadata.optionLabels expected object; fallback option label parsing applied.");
  }
  if (nativeOptionLabels && typeof nativeOptionLabels === "object") {
    const optionA = String((nativeOptionLabels as any).optionA || "").trim();
    const optionB = String((nativeOptionLabels as any).optionB || "").trim();
    if (optionA && optionB) {
      return { optionA, optionB };
    }
    if (optionA || optionB) {
      warnings.push("native_metadata.optionLabels partially populated; fallback option label parsing applied.");
    }
  }
  return extractOptionLabelsFromRaw(rawIntake, strings);
}

function extractOptionLabelsFromRaw(
  rawIntake: any,
  strings: { optionALabel: string; optionBLabel: string },
): { optionA: string; optionB: string } {
  const optionsText = String(rawIntake?.optionsUnderConsideration || "");
  const optionA = extractLabeledOption(optionsText, "A") || strings.optionALabel;
  const optionB = extractLabeledOption(optionsText, "B") || strings.optionBLabel;
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

function buildAssessmentBasisLine(
  completenessScore: number,
  strings: { assessmentBasisHigh: string; assessmentBasisLow: string },
): string {
  if (completenessScore >= 0.85) {
    return strings.assessmentBasisHigh;
  }
  return strings.assessmentBasisLow;
}

function resolveMatrixBand(
  value: unknown,
  fallbackBand: "strong" | "partial" | "weak",
  field: string,
  warnings: string[],
): "strong" | "partial" | "weak" {
  const raw = String(value || "").trim();
  if (!raw) {
    return fallbackBand;
  }
  if (raw === "strong" || raw === "partial" || raw === "weak") {
    return raw;
  }
  warnings.push(`native_metadata.matrixBands.${field} unsupported value '${raw}'; fallback band applied.`);
  return fallbackBand;
}

function buildExternalReadingCue(
  nativeMetadata: unknown,
  strings: {
    externalCueFallback: string;
    externalCueWeakEvidence: string;
    externalCuePrefix: string;
    externalCueDemandClear: string;
    externalCueDemandMixed: string;
    externalCueDemandWeak: string;
    externalCuePortabilityStrong: string;
    externalCuePortabilityPartial: string;
    externalCuePortabilityConstrained: string;
    externalCueFrictionLow: string;
    externalCueFrictionModerate: string;
    externalCueFrictionHigh: string;
    externalCueSignalVisible: string;
    externalCueSignalPartial: string;
    externalCueSignalFragmented: string;
  },
  warnings: string[],
): string {
  if (!nativeMetadata || typeof nativeMetadata !== "object") {
    return strings.externalCueFallback;
  }

  const weakEvidence = Boolean((nativeMetadata as any).weakEvidence);
  if (weakEvidence) {
    return strings.externalCueWeakEvidence;
  }

  const demand = normalizeBucket(
    (nativeMetadata as any).demandBucket,
    ["clear", "mixed", "weak"],
    "mixed",
    "external_snapshot.nativeMetadata.demandBucket",
    warnings,
  );
  const portability = normalizeBucket(
    (nativeMetadata as any).portabilityBucket,
    ["strong", "partial", "constrained"],
    "partial",
    "external_snapshot.nativeMetadata.portabilityBucket",
    warnings,
  );
  const friction = normalizeBucket(
    (nativeMetadata as any).frictionBucket,
    ["low", "moderate", "high"],
    "moderate",
    "external_snapshot.nativeMetadata.frictionBucket",
    warnings,
  );
  const signal = normalizeBucket(
    (nativeMetadata as any).signalBucket,
    ["visible", "partial", "fragmented"],
    "partial",
    "external_snapshot.nativeMetadata.signalBucket",
    warnings,
  );

  const demandText =
    demand === "clear" ? strings.externalCueDemandClear : demand === "weak" ? strings.externalCueDemandWeak : strings.externalCueDemandMixed;
  const portabilityText =
    portability === "strong"
      ? strings.externalCuePortabilityStrong
      : portability === "constrained"
        ? strings.externalCuePortabilityConstrained
        : strings.externalCuePortabilityPartial;
  const frictionText =
    friction === "low"
      ? strings.externalCueFrictionLow
      : friction === "high"
        ? strings.externalCueFrictionHigh
        : strings.externalCueFrictionModerate;
  const signalText =
    signal === "visible"
      ? strings.externalCueSignalVisible
      : signal === "fragmented"
        ? strings.externalCueSignalFragmented
        : strings.externalCueSignalPartial;

  return `${strings.externalCuePrefix}: ${demandText}; ${portabilityText}; ${frictionText}; ${signalText}.`;
}

function buildMatrixReadingCue(
  bands: {
    marketOutlook: "strong" | "partial" | "weak";
    companyStability: "strong" | "partial" | "weak";
    fifwmRisk: "strong" | "partial" | "weak";
    personalFit: "strong" | "partial" | "weak";
    upsideDownside: "strong" | "partial" | "weak";
  },
  strings: {
    matrixCueFallback: string;
    matrixCuePrefix: string;
    matrixCueSupportive: string;
    matrixCueMixed: string;
    matrixCueConstrained: string;
    matrixCueOverallSupportive: string;
    matrixCueOverallMixed: string;
    matrixCueOverallConstrained: string;
  },
): string {
  const values = Object.values(bands);
  if (values.length === 0) {
    return strings.matrixCueFallback;
  }

  const strongCount = values.filter((v) => v === "strong").length;
  const weakCount = values.filter((v) => v === "weak").length;
  const overall =
    strongCount >= 3 ? strings.matrixCueOverallSupportive : weakCount >= 3 ? strings.matrixCueOverallConstrained : strings.matrixCueOverallMixed;

  const token = (band: "strong" | "partial" | "weak") =>
    band === "strong" ? strings.matrixCueSupportive : band === "weak" ? strings.matrixCueConstrained : strings.matrixCueMixed;

  return `${strings.matrixCuePrefix}: MKT ${token(bands.marketOutlook)}; STB ${token(bands.companyStability)}; RSK ${token(bands.fifwmRisk)}; FIT ${token(bands.personalFit)}; U/D ${token(bands.upsideDownside)}. ${overall}`;
}

function normalizeBucket(
  value: unknown,
  allowed: string[],
  fallbackValue: string,
  fieldName: string,
  warnings: string[],
): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return fallbackValue;
  }
  if (allowed.includes(raw)) {
    return raw;
  }
  warnings.push(`${fieldName} unsupported value '${raw}'; fallback bucket applied.`);
  return fallbackValue;
}

function resolveExplorationDesigns(
  hints: unknown,
  strings: {
    experimentDesign1: string;
    experimentDesign2: string;
    experimentDesign3: string;
  },
): { designs: { experiment1: string; experiment2: string; experiment3: string }; warnings: string[] } {
  const warnings: string[] = [];
  if (hints !== null && hints !== undefined && typeof hints !== "object") {
    warnings.push(
      `native_metadata.explorationDesignHints expected object, received ${typeof hints}; defaults/deterministic fallbacks applied.`,
    );
  }
  const defaults = [strings.experimentDesign1, strings.experimentDesign2, strings.experimentDesign3];
  const raw = {
    experiment1: cleanHint((hints as any)?.experiment1),
    experiment2: cleanHint((hints as any)?.experiment2),
    experiment3: cleanHint((hints as any)?.experiment3),
  };
  if (!raw.experiment1 || !raw.experiment2 || !raw.experiment3) {
    warnings.push(
      "native_metadata.explorationDesignHints missing one or more experiment hints; deterministic defaults/deduplication applied.",
    );
  }

  const used = new Set<string>();
  const e1 = pickDistinctHint(raw.experiment1, 0, defaults, used);
  const e2 = pickDistinctHint(raw.experiment2, 1, defaults, used);
  const e3 = pickDistinctHint(raw.experiment3, 2, defaults, used);

  if (new Set([e1, e2, e3]).size < 3) {
    warnings.push(
      "native_metadata.explorationDesignHints produced duplicate designs after fallback resolution; output kept deterministic.",
    );
  }

  return {
    designs: {
      experiment1: e1,
      experiment2: e2,
      experiment3: e3,
    },
    warnings,
  };
}

function cleanHint(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function pickDistinctHint(
  candidate: string,
  index: 0 | 1 | 2,
  defaults: [string, string, string] | string[],
  used: Set<string>,
): string {
  const fallbackOrder = [
    candidate,
    defaults[index],
    defaults[(index + 1) % 3],
    defaults[(index + 2) % 3],
  ]
    .map((x) => (x || "").trim())
    .filter(Boolean);

  for (const option of fallbackOrder) {
    if (!used.has(option)) {
      used.add(option);
      return option;
    }
  }
  const finalFallback = (defaults[index] || "").trim();
  if (finalFallback) {
    used.add(finalFallback);
    return finalFallback;
  }
  return candidate || "";
}

function resolveReassessmentTrigger(
  triggerType: unknown,
  strings: {
    reassessmentTriggerDefault: string;
    reassessmentTriggerSignalInstability: string;
    reassessmentTriggerTimingMisalignment: string;
    reassessmentTriggerSupportErosion: string;
    reassessmentTriggerRiskDeterioration: string;
  },
): { value: string; warnings: string[] } {
  const warnings: string[] = [];
  const key = String(triggerType || "").trim();
  if (key === "signal_instability") {
    return { value: strings.reassessmentTriggerSignalInstability, warnings };
  }
  if (key === "timing_misalignment") {
    return { value: strings.reassessmentTriggerTimingMisalignment, warnings };
  }
  if (key === "support_erosion") {
    return { value: strings.reassessmentTriggerSupportErosion, warnings };
  }
  if (key === "risk_deterioration") {
    return { value: strings.reassessmentTriggerRiskDeterioration, warnings };
  }
  if (key) {
    warnings.push(
      `native_metadata.reassessmentTriggerType unsupported value '${key}'; default reassessment trigger applied.`,
    );
  } else {
    warnings.push("native_metadata.reassessmentTriggerType missing; default reassessment trigger applied.");
  }
  return { value: strings.reassessmentTriggerDefault, warnings };
}
