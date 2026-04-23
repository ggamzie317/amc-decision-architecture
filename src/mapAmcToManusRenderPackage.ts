import path from "node:path";

export type AmcLivePayload = {
  meta?: {
    generated_at?: string;
  };
  mode?: string;
  case?: {
    option_a_label?: string;
    option_b_label?: string;
  };
  executive_summary?: {
    verdict_line?: string;
    structural_outlook_line?: string;
    structural_risk_line?: string;
    personal_exposure_line?: string;
    assessment_basis_line?: string;
  };
  comparative_snapshot?: {
    option_a?: {
      market_status?: string;
      competition_status?: string;
      economic_status?: string;
      transition_status?: string;
    };
    option_b?: {
      market_status?: string;
      competition_status?: string;
      economic_status?: string;
      transition_status?: string;
    };
    legend?: string;
    reading?: string;
    implication?: string;
  };
  matrix?: {
    market_outlook?: { score?: number; visual?: string };
    company_stability?: { score?: number; visual?: string };
    fifwm_risk?: { score?: number; visual?: string };
    personal_fit?: { score?: number; visual?: string };
    upside_downside?: { score?: number; visual?: string };
  };
  diagnosis?: {
    fifwm_risk?: { read?: string; risk?: string; condition?: string };
    comparative_reading?: string;
  };
  career_value_structure?: {
    primary_value_line?: string;
    secondary_value_line?: string;
    tension_line?: string;
    alignment_line?: string;
    comparative_reading?: string;
  };
  career_mobility_structure?: {
    mobility_line?: string;
    portability_line?: string;
    burden_line?: string;
    timing_line?: string;
    comparative_reading?: string;
  };
  strategic_temperament?: {
    posture_line?: string;
    evidence_line?: string;
    pace_line?: string;
    discipline_line?: string;
    comparative_reading?: string;
  };
  commitment?: {
    validation_condition?: string;
    readiness_condition?: string;
    support_condition?: string;
    commitment_condition?: string;
    reassessment_trigger?: string;
  };
};

export type ManusRenderOrchestrationContextV1 = {
  reportId?: string;
  language?: string;
  templateBaselinePath?: string;
};

const TEMPLATE_BASELINE = "templates/AMC_Strategic_Career_Decision_Template_v3_4_working.docx";

const FORBIDDEN_TRANSFORMATIONS = [
  "recommendation_language",
  "coaching_tone",
  "section_reorder",
  "narrative_over_table_in_comparative",
  "score_layer_merge_into_interpretation",
  "logic_recalculation",
] as const;

const INTENT_BY_SECTION: Record<string, string> = {
  executive_structural_reading: "Frame the case in one defensible structural view.",
  external_comparative_snapshot: "Surface path-level asymmetry with table-first readability.",
  structural_risk_diagnosis: "Identify where fragility is concentrated.",
  career_value_structure: "Clarify what is protected versus surrendered.",
  career_mobility_structure: "Read transferability, conversion burden, and timing exposure.",
  strategic_temperament: "Assess governance posture under structural pressure.",
  decision_conditions: "Define commitment defensibility thresholds.",
};

const HEADING_BY_SECTION: Record<string, string> = {
  executive_structural_reading: "Executive Structural Reading",
  external_comparative_snapshot: "External Comparative Snapshot",
  structural_risk_diagnosis: "Structural Risk Diagnosis",
  career_value_structure: "Career Value Structure",
  career_mobility_structure: "Career Mobility Structure",
  strategic_temperament: "Strategic Temperament",
  decision_conditions: "Decision Conditions",
};

const SINGLE_SECTION_ORDER = [
  "executive_structural_reading",
  "structural_risk_diagnosis",
  "career_value_structure",
  "career_mobility_structure",
  "strategic_temperament",
  "decision_conditions",
];

const COMPARATIVE_SECTION_ORDER = [
  "executive_structural_reading",
  "external_comparative_snapshot",
  "structural_risk_diagnosis",
  "career_value_structure",
  "career_mobility_structure",
  "strategic_temperament",
  "decision_conditions",
];

function asNonEmptyString(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeCaseMode(mode: string | undefined): "single" | "comparative" {
  return String(mode || "").toLowerCase() === "comparative" ? "comparative" : "single";
}

function normalizeLanguageV1(language: string | undefined): "en" {
  if (!language) {
    return "en";
  }
  return "en";
}

function deriveReportId(payload: AmcLivePayload, ctx: ManusRenderOrchestrationContextV1): string {
  if (ctx.reportId && ctx.reportId.trim()) {
    return ctx.reportId.trim();
  }
  const mode = normalizeCaseMode(payload.mode);
  const generatedAt = asNonEmptyString(payload.meta?.generated_at, new Date().toISOString());
  return `amc-${mode}-${generatedAt}`.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function normalizeTemplateBaseline(ctx: ManusRenderOrchestrationContextV1): string {
  const normalized = path.normalize(ctx.templateBaselinePath || TEMPLATE_BASELINE).replace(/\\/g, "/");
  if (normalized !== TEMPLATE_BASELINE) {
    throw new Error(
      `Template baseline mismatch: expected '${TEMPLATE_BASELINE}', received '${normalized}'.`,
    );
  }
  return TEMPLATE_BASELINE;
}

function scoreToPercent(score: unknown): number {
  const n = typeof score === "number" && Number.isFinite(score) ? score : 0;
  const clamped = Math.max(0, Math.min(2, n));
  return Math.round((clamped / 2) * 100);
}

function visualToBand(visual: string | undefined): "low" | "guarded" | "stable" | "strong" {
  const text = String(visual || "");
  if (text.includes("▼") || text.includes("Constrained") || text.includes("●") || text.includes("Elevated")) {
    return "low";
  }
  if (text.includes("◆") || text.includes("Mixed") || text.includes("◐") || text.includes("Moderate")) {
    return "guarded";
  }
  if (text.includes("▲") || text.includes("Supportive") || text.includes("○") || text.includes("Contained")) {
    return "stable";
  }
  return "guarded";
}

function buildScoredItem(name: string, score: unknown, visual: string | undefined) {
  return {
    name,
    score: scoreToPercent(score),
    band: visualToBand(visual),
  };
}

function statusSymbolToPhrase(status: string | undefined): string {
  const text = String(status || "");
  if (text.includes("▲") || text.includes("Supportive")) {
    return "supportive conditions";
  }
  if (text.includes("◆") || text.includes("Mixed")) {
    return "mixed conditions";
  }
  if (text.includes("▼") || text.includes("Constrained")) {
    return "constrained conditions";
  }
  if (text.includes("○") || text.includes("Contained")) {
    return "contained burden";
  }
  if (text.includes("◐") || text.includes("Moderate")) {
    return "moderate burden";
  }
  if (text.includes("●") || text.includes("Elevated")) {
    return "elevated burden";
  }
  return "conditions unclear";
}

function dimensionImplication(dimension: "market" | "competition" | "economic" | "transition", status: string) {
  if (status === "conditions unclear") {
    return "requires direct evidence before commitment.";
  }
  if (dimension === "market") {
    return "demand visibility remains uneven.";
  }
  if (dimension === "competition") {
    return "portability pressure is material.";
  }
  if (dimension === "economic") {
    return "cost and timing pressure requires tighter thresholds.";
  }
  return "conversion friction is high under current assumptions.";
}

function comparativeCell(dimension: "market" | "competition" | "economic" | "transition", status: string | undefined) {
  const phrase = statusSymbolToPhrase(status);
  return `${phrase}; ${dimensionImplication(dimension, phrase)}`;
}

function sectionShell(id: string, conclusion: string, support: string, basis: string) {
  return {
    id,
    heading: asNonEmptyString(HEADING_BY_SECTION[id], "Section"),
    intent_line: asNonEmptyString(INTENT_BY_SECTION[id], "Structural interpretation for this section."),
    conclusion_line: asNonEmptyString(conclusion, "Conclusion not available."),
    support_line: asNonEmptyString(support, "Supporting interpretation not available."),
    basis_line: asNonEmptyString(basis, "Assessment basis: structural interpretation."),
  };
}

export function mapAmcPayloadToManusRenderPackageV1(
  payload: AmcLivePayload,
  ctx: ManusRenderOrchestrationContextV1 = {},
) {
  const caseMode = normalizeCaseMode(payload.mode);
  const sectionOrder = caseMode === "comparative" ? COMPARATIVE_SECTION_ORDER : SINGLE_SECTION_ORDER;
  const templateBaseline = normalizeTemplateBaseline(ctx);

  const executiveSection = {
    ...sectionShell(
      "executive_structural_reading",
      payload.executive_summary?.verdict_line || payload.executive_summary?.structural_outlook_line || "",
      payload.executive_summary?.structural_risk_line || payload.executive_summary?.personal_exposure_line || "",
      payload.executive_summary?.assessment_basis_line || "",
    ),
    scored_layer: {
      visible: true,
      items: [
        buildScoredItem("Market Outlook", payload.matrix?.market_outlook?.score, payload.matrix?.market_outlook?.visual),
        buildScoredItem(
          "Company Stability",
          payload.matrix?.company_stability?.score,
          payload.matrix?.company_stability?.visual,
        ),
        buildScoredItem("FIFWM Risk", payload.matrix?.fifwm_risk?.score, payload.matrix?.fifwm_risk?.visual),
      ],
    },
    non_scored_layer: {
      visible: true,
      items: [
        asNonEmptyString(
          payload.executive_summary?.structural_outlook_line,
          "Structural outlook interpretation not available.",
        ),
      ],
    },
  };

  const riskSection = {
    ...sectionShell(
      "structural_risk_diagnosis",
      payload.diagnosis?.fifwm_risk?.read || "",
      payload.diagnosis?.fifwm_risk?.risk || payload.diagnosis?.comparative_reading || "",
      payload.diagnosis?.fifwm_risk?.condition || payload.executive_summary?.assessment_basis_line || "",
    ),
    scored_layer: {
      visible: true,
      items: [
        buildScoredItem("FIFWM Risk", payload.matrix?.fifwm_risk?.score, payload.matrix?.fifwm_risk?.visual),
        buildScoredItem("Upside/Downside", payload.matrix?.upside_downside?.score, payload.matrix?.upside_downside?.visual),
        buildScoredItem(
          "Company Stability",
          payload.matrix?.company_stability?.score,
          payload.matrix?.company_stability?.visual,
        ),
      ],
    },
    non_scored_layer: {
      visible: true,
      items: [asNonEmptyString(payload.diagnosis?.comparative_reading, "Risk interpretation remains under review.")],
    },
  };

  const valueSection = {
    ...sectionShell(
      "career_value_structure",
      payload.career_value_structure?.tension_line || "",
      payload.career_value_structure?.alignment_line || "",
      payload.career_value_structure?.primary_value_line || "",
    ),
    scored_layer: {
      visible: true,
      items: [
        buildScoredItem("Personal Fit", payload.matrix?.personal_fit?.score, payload.matrix?.personal_fit?.visual),
      ],
    },
    non_scored_layer: {
      visible: true,
      items: [
        asNonEmptyString(payload.career_value_structure?.secondary_value_line, "Secondary value interpretation unavailable."),
        asNonEmptyString(payload.career_value_structure?.comparative_reading, "Comparative value interpretation unavailable."),
      ],
    },
  };

  const mobilitySection = {
    ...sectionShell(
      "career_mobility_structure",
      payload.career_mobility_structure?.mobility_line || "",
      payload.career_mobility_structure?.burden_line || "",
      payload.career_mobility_structure?.timing_line || "",
    ),
    scored_layer: {
      visible: true,
      items: [
        buildScoredItem("Market Outlook", payload.matrix?.market_outlook?.score, payload.matrix?.market_outlook?.visual),
      ],
    },
    non_scored_layer: {
      visible: true,
      items: [
        asNonEmptyString(payload.career_mobility_structure?.portability_line, "Portability interpretation unavailable."),
        asNonEmptyString(payload.career_mobility_structure?.comparative_reading, "Comparative mobility interpretation unavailable."),
      ],
    },
  };

  const temperamentSection = {
    ...sectionShell(
      "strategic_temperament",
      payload.strategic_temperament?.posture_line || "",
      payload.strategic_temperament?.discipline_line || "",
      payload.strategic_temperament?.evidence_line || "",
    ),
    scored_layer: {
      visible: true,
      items: [
        buildScoredItem("Personal Fit", payload.matrix?.personal_fit?.score, payload.matrix?.personal_fit?.visual),
      ],
    },
    non_scored_layer: {
      visible: true,
      items: [
        asNonEmptyString(payload.strategic_temperament?.pace_line, "Pacing interpretation unavailable."),
        asNonEmptyString(
          payload.strategic_temperament?.comparative_reading,
          "Comparative temperament interpretation unavailable.",
        ),
      ],
    },
  };

  const decisionConditionsSection = {
    ...sectionShell(
      "decision_conditions",
      payload.commitment?.commitment_condition || "",
      payload.commitment?.readiness_condition || "",
      payload.commitment?.validation_condition || "",
    ),
    scored_layer: {
      visible: false,
      items: [],
    },
    non_scored_layer: {
      visible: true,
      items: [
        asNonEmptyString(payload.commitment?.support_condition, "Support condition not available."),
        asNonEmptyString(payload.commitment?.reassessment_trigger, "Reassessment trigger not available."),
      ],
    },
  };

  const sections: Array<Record<string, unknown>> = [executiveSection];

  if (caseMode === "comparative") {
    sections.push({
      ...sectionShell(
        "external_comparative_snapshot",
        payload.comparative_snapshot?.reading || "",
        payload.comparative_snapshot?.implication || "",
        payload.comparative_snapshot?.legend || payload.executive_summary?.assessment_basis_line || "",
      ),
      scored_layer: {
        visible: false,
        items: [],
      },
      non_scored_layer: {
        visible: true,
        items: [
          asNonEmptyString(payload.comparative_snapshot?.reading, "Comparative reading unavailable."),
          asNonEmptyString(payload.comparative_snapshot?.implication, "Comparative implication unavailable."),
        ],
      },
      comparative_table: {
        columns: [
          "Dimension",
          asNonEmptyString(payload.case?.option_a_label, "Option A"),
          asNonEmptyString(payload.case?.option_b_label, "Option B"),
        ],
        rows: [
          {
            dimension: "Market",
            option_a: comparativeCell("market", payload.comparative_snapshot?.option_a?.market_status),
            option_b: comparativeCell("market", payload.comparative_snapshot?.option_b?.market_status),
          },
          {
            dimension: "Competition",
            option_a: comparativeCell("competition", payload.comparative_snapshot?.option_a?.competition_status),
            option_b: comparativeCell("competition", payload.comparative_snapshot?.option_b?.competition_status),
          },
          {
            dimension: "Economic",
            option_a: comparativeCell("economic", payload.comparative_snapshot?.option_a?.economic_status),
            option_b: comparativeCell("economic", payload.comparative_snapshot?.option_b?.economic_status),
          },
          {
            dimension: "Transition",
            option_a: comparativeCell("transition", payload.comparative_snapshot?.option_a?.transition_status),
            option_b: comparativeCell("transition", payload.comparative_snapshot?.option_b?.transition_status),
          },
        ],
        legend: asNonEmptyString(payload.comparative_snapshot?.legend, "Legend: comparative status interpretation."),
      },
    });
  }

  sections.push(riskSection, valueSection, mobilitySection, temperamentSection, decisionConditionsSection);

  const orderIndex = new Map(sectionOrder.map((id, index) => [id, index]));
  sections.sort((a, b) => {
    const ai = orderIndex.get(String(a.id)) ?? 999;
    const bi = orderIndex.get(String(b.id)) ?? 999;
    return ai - bi;
  });

  return {
    contract_version: "amc_manus_render_v1",
    report_metadata: {
      report_id: deriveReportId(payload, ctx),
      case_mode: caseMode,
      language: normalizeLanguageV1(ctx.language),
      generated_at: asNonEmptyString(payload.meta?.generated_at, new Date().toISOString()),
      template_baseline: templateBaseline,
    },
    governance: {
      amc_logic_owner: true,
      manus_renderer_only: true,
      section_order_locked: true,
      recommendation_language_forbidden: true,
      first_page_conclusion_first: true,
      comparative_table_first: true,
      scored_non_scored_separation_required: true,
    },
    labels: {
      executive_layer: "Structural Reading",
      measurement_layer: "Measurement Layer",
      interpretation_layer: "Interpretation Layer",
      comparative_snapshot_label: "External Comparative Snapshot",
    },
    layout_rules: {
      first_page: {
        mode: "conclusion_first",
        support_text_quiet: true,
      },
      comparative: {
        mode: "table_first",
        legend_secondary: true,
        reading_lines_compact: true,
      },
      layer_separation: {
        scored_layer_visible: true,
        non_scored_layer_visible: true,
        visual_separation_required: true,
      },
      section_order: sectionOrder,
    },
    sections,
    forbidden_transformations: FORBIDDEN_TRANSFORMATIONS,
    qa_hints: {
      expect_conclusion_first_above_fold: true,
      expect_table_first_in_comparative: true,
      expect_no_recommendation_language: true,
      expect_scored_non_scored_separation: true,
    },
  };
}

