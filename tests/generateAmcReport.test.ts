import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  buildAmcRenderInput,
  buildNestedTemplateContextFromDocxPayload,
  generateAmcReport,
  resolveRenderLocale,
} from "../src/generateAmcReport";
import { buildAmcDocxPayload } from "../src/buildAmcDocxPayload";

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

test("AMC raw intake can flow to render-ready handoff", () => {
  const fixedNow = () => new Date("2026-03-15T18:00:00.000Z");
  const result = buildAmcRenderInput(makeRawIntake("single"), { now: fixedNow });

  assert.ok(result.docxPayload);
  assert.ok(result.mergePayload);
  assert.equal(result.docxPayload.meta.generatedAt, "2026-03-15T18:00:00.000Z");
  assert.equal(result.mergePayload.meta.generated_at, "2026-03-15T18:00:00.000Z");
  assert.ok(Object.prototype.hasOwnProperty.call(result.mergePayload, "executive_summary"));
});

test("locale option localizes fixed fallback strings without changing payload shape", () => {
  const result = buildAmcRenderInput(
    {
      ...makeRawIntake("single"),
      optionsUnderConsideration: "",
    },
    { now: () => new Date("2026-03-15T18:00:00.000Z"), locale: "ko" },
  );

  assert.equal(result.mergePayload.mode, "single");
  assert.equal(result.mergePayload.case.case_type, "single_path");
  assert.equal(result.mergePayload.case.option_a_label, "[해당 없음]");
  assert.equal(result.mergePayload.case.option_b_label, "[해당 없음]");
  assert.equal(
    result.mergePayload.executive_summary.assessment_basis_line.startsWith("평가 근거:"),
    true,
  );
});

test("locale precedence is explicit: cli override > intake.lang > default", () => {
  assert.equal(resolveRenderLocale({ locale: "zh" }, { lang: "ko" }), "zh");
  assert.equal(resolveRenderLocale({}, { lang: "ko" }), "ko");
  assert.equal(resolveRenderLocale({}, {}), "en");
});

test("existing merge path is invoked and output docx is generated", () => {
  const td = fs.mkdtempSync(path.join(os.tmpdir(), "amc-docx-"));
  const templatePath = path.join(td, "template.docx");
  const payloadPath = path.join(td, "payload.json");
  const outPath = path.join(td, "out.docx");

  execFileSync(
    "python3",
    [
      "-c",
      [
        "from docx import Document",
        "doc=Document()",
        "doc.add_paragraph('Header: {{executive_summary.verdict_line}}')",
        "doc.add_paragraph('Case: {{mode}}')",
        `doc.save(r'''${templatePath}''')`,
      ].join("; "),
    ],
    { stdio: "pipe" },
  );

  const result = generateAmcReport(makeRawIntake("comparative"), {
    templatePath,
    payloadPath,
    outPath,
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });

  assert.equal(result.payloadPath, payloadPath);
  assert.equal(result.outPath, outPath);
  assert.equal(fs.existsSync(outPath), true);

  const mergedText = execFileSync(
    "python3",
    [
      "-c",
      [
        "from docx import Document",
        `doc=Document(r'''${outPath}''')`,
        "txt='\\n'.join(p.text for p in doc.paragraphs)",
        "print(txt)",
      ].join("; "),
    ],
    { encoding: "utf-8" },
  );

  assert.equal(mergedText.includes("{{"), false);
  assert.equal(mergedText.includes("Header:"), true);
  assert.equal(mergedText.toLowerCase().includes("comparative"), true);
});

test("native decision metadata is consumed for exploration design and reassessment trigger", () => {
  const result = buildAmcRenderInput(makeRawIntake("single"), {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });

  const decisionSection = result.docxPayload.reportPayload.sections.find(
    (s: any) => s.section === "decision_conditions",
  );
  assert.ok(decisionSection);
  assert.ok(decisionSection.nativeMetadata);

  const hints = decisionSection.nativeMetadata.explorationDesignHints;
  assert.equal(result.mergePayload.exploration_plan.experiment_1.design, hints.experiment1);
  assert.equal(result.mergePayload.exploration_plan.experiment_2.design, hints.experiment2);
  assert.equal(result.mergePayload.exploration_plan.experiment_3.design, hints.experiment3);

  const triggerType = decisionSection.nativeMetadata.reassessmentTriggerType;
  const expectedByType: Record<string, string> = {
    signal_instability:
      "Reassessment is required if core structural signals become less stable before conditions are consolidated.",
    timing_misalignment: "Reassessment is required if decision pace and execution readiness become misaligned.",
    support_erosion: "Reassessment is required if sponsor, safety-net, or stability support conditions weaken.",
    risk_deterioration:
      "Reassessment is required if structural risk exposure rises before commitment conditions close.",
  };

  assert.equal(
    result.mergePayload.commitment.reassessment_trigger,
    expectedByType[triggerType] || "Reassessment is required if key structural signals deteriorate before commitment conditions close.",
  );
});

test("unknown reassessmentTriggerType emits warning and keeps safe fallback", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  const decisionSection = docxPayload.reportPayload.sections.find(
    (s: any) => s.section === "decision_conditions",
  );
  decisionSection.nativeMetadata.reassessmentTriggerType = "unsupported_trigger";

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings;

  assert.ok(Array.isArray(warnings));
  assert.equal(warnings.length >= 1, true);
  assert.equal(
    warnings.some((w: string) => w.includes("reassessmentTriggerType unsupported value")),
    true,
  );
  assert.ok(context.commitment.reassessment_trigger.length > 0);
  assert.equal(
    context.commitment.reassessment_trigger,
    "Reassessment is required if key structural signals deteriorate before commitment conditions close.",
  );
});

test("unsupported explorationDesignHints emits warning and keeps design fallbacks populated", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  const decisionSection = docxPayload.reportPayload.sections.find(
    (s: any) => s.section === "decision_conditions",
  );
  decisionSection.nativeMetadata.explorationDesignHints = "invalid_hints_shape";

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings;

  assert.ok(Array.isArray(warnings));
  assert.equal(warnings.length >= 1, true);
  assert.equal(
    warnings.some((w: string) => w.includes("explorationDesignHints expected object")),
    true,
  );
  assert.ok(context.exploration_plan.experiment_1.design.length > 0);
  assert.ok(context.exploration_plan.experiment_2.design.length > 0);
  assert.ok(context.exploration_plan.experiment_3.design.length > 0);
});

test("duplicate explorationDesignHints are deterministically diversified when possible", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  const decisionSection = docxPayload.reportPayload.sections.find(
    (s: any) => s.section === "decision_conditions",
  );

  decisionSection.nativeMetadata.explorationDesignHints = {
    experiment1: "Duplicate upstream hint.",
    experiment2: "Duplicate upstream hint.",
    experiment3: "Duplicate upstream hint.",
  };

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.ok(context.exploration_plan.experiment_1.design.length > 0);
  assert.ok(context.exploration_plan.experiment_2.design.length > 0);
  assert.ok(context.exploration_plan.experiment_3.design.length > 0);

  // Distinctness should be preserved when defaults permit diversification.
  const designs = [
    context.exploration_plan.experiment_1.design,
    context.exploration_plan.experiment_2.design,
    context.exploration_plan.experiment_3.design,
  ];
  assert.equal(new Set(designs).size, 3);

  // This case is valid and deduplication is expected behavior, not a warning case.
  assert.equal(
    warnings.some((w) => w.includes("explorationDesignHints")),
    false,
  );
});

test("missing decision nativeMetadata keeps safe fallback outputs populated", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  const decisionSection = docxPayload.reportPayload.sections.find(
    (s: any) => s.section === "decision_conditions",
  );
  delete decisionSection.nativeMetadata;

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.ok(Array.isArray(warnings));
  // Missing native metadata is an allowed fallback path; warning is optional by design.
  assert.ok(context.exploration_plan.experiment_1.design.length > 0);
  assert.ok(context.exploration_plan.experiment_2.design.length > 0);
  assert.ok(context.exploration_plan.experiment_3.design.length > 0);
  assert.ok(context.commitment.reassessment_trigger.length > 0);
  assert.equal(
    context.commitment.reassessment_trigger,
    "Reassessment is required if key structural signals deteriorate before commitment conditions close.",
  );
});

test("upstream matrix bands and option labels are consumed when provided", () => {
  const raw = makeRawIntake("comparative");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });

  docxPayload.reportPayload.inputs.nativeMetadata.matrixBands = {
    marketOutlook: "weak",
    companyStability: "strong",
    fifwmRisk: "partial",
    personalFit: "strong",
    upsideDownside: "weak",
  };
  docxPayload.reportPayload.inputs.nativeMetadata.optionLabels = {
    optionA: "Native Label A",
    optionB: "Native Label B",
    source: "parsed",
  };

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);

  assert.equal(context.case.option_a_label, "Native Label A");
  assert.equal(context.case.option_b_label, "Native Label B");
  assert.equal(context.matrix.market_outlook.visual, "▼ Constrained");
  assert.equal(context.matrix.company_stability.visual, "▲ Supportive");
  assert.equal(context.matrix.fifwm_risk.visual, "◆ Mixed");
  assert.equal(context.matrix.personal_fit.visual, "▲ Supportive");
  assert.equal(context.matrix.upside_downside.visual, "▼ Constrained");
});

test("missing native matrixBands falls back to derived band mapping safely", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  delete docxPayload.reportPayload.inputs.nativeMetadata.matrixBands;

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.ok(context.matrix.market_outlook.visual.length > 0);
  assert.ok(context.matrix.company_stability.visual.length > 0);
  assert.ok(context.matrix.fifwm_risk.visual.length > 0);
  assert.ok(context.matrix.personal_fit.visual.length > 0);
  assert.ok(context.matrix.upside_downside.visual.length > 0);
  assert.equal(
    warnings.some((w) => w.includes("matrixBands")),
    false,
  );
});

test("native optionLabels with source parsed are consumed directly", () => {
  const raw = makeRawIntake("comparative");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  docxPayload.reportPayload.inputs.nativeMetadata.optionLabels = {
    optionA: "Upstream Parsed A",
    optionB: "Upstream Parsed B",
    source: "parsed",
  };

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.equal(context.case.option_a_label, "Upstream Parsed A");
  assert.equal(context.case.option_b_label, "Upstream Parsed B");
  assert.equal(
    warnings.some((w) => w.includes("optionLabels")),
    false,
  );
});

test("native optionLabels with source missing falls back safely to default labels when raw labels are unavailable", () => {
  const raw = {
    ...makeRawIntake("comparative"),
    optionsUnderConsideration: "Compare internal path versus external path under current constraints.",
  };
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  docxPayload.reportPayload.inputs.nativeMetadata.optionLabels = {
    optionA: "",
    optionB: "",
    source: "missing",
  };

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.equal(context.mode, "comparative");
  assert.equal(context.case.option_a_label, "Option A");
  assert.equal(context.case.option_b_label, "Option B");
  assert.equal(
    warnings.some((w) => w.includes("optionLabels")),
    false,
  );
});

test("invalid matrixBands enum values emit warnings and keep safe visual fallbacks", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  docxPayload.reportPayload.inputs.nativeMetadata.matrixBands = {
    marketOutlook: "invalid_band",
    companyStability: "unknown_value",
    fifwmRisk: "bad",
    personalFit: "unsupported",
    upsideDownside: "n/a",
  };

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.ok(context.matrix.market_outlook.visual.length > 0);
  assert.ok(context.matrix.company_stability.visual.length > 0);
  assert.ok(context.matrix.fifwm_risk.visual.length > 0);
  assert.ok(context.matrix.personal_fit.visual.length > 0);
  assert.ok(context.matrix.upside_downside.visual.length > 0);

  assert.equal(
    warnings.some((w) => w.includes("native_metadata.matrixBands.marketOutlook unsupported value")),
    true,
  );
  assert.equal(
    warnings.some((w) => w.includes("native_metadata.matrixBands.companyStability unsupported value")),
    true,
  );
  assert.equal(
    warnings.some((w) => w.includes("native_metadata.matrixBands.fifwmRisk unsupported value")),
    true,
  );
  assert.equal(
    warnings.some((w) => w.includes("native_metadata.matrixBands.personalFit unsupported value")),
    true,
  );
  assert.equal(
    warnings.some((w) => w.includes("native_metadata.matrixBands.upsideDownside unsupported value")),
    true,
  );
});

test("unsupported matrixBands shape keeps safe visual fallbacks", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  docxPayload.reportPayload.inputs.nativeMetadata.matrixBands = "invalid_shape";

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings as string[];

  assert.ok(context.matrix.market_outlook.visual.length > 0);
  assert.ok(context.matrix.company_stability.visual.length > 0);
  assert.ok(context.matrix.fifwm_risk.visual.length > 0);
  assert.ok(context.matrix.personal_fit.visual.length > 0);
  assert.ok(context.matrix.upside_downside.visual.length > 0);

  // Current implementation tolerates invalid matrixBands shape by falling back silently.
  assert.equal(
    warnings.some((w) => w.includes("native_metadata.matrixBands")),
    false,
  );
});
