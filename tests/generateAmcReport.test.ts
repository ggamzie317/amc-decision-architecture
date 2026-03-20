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

test("unknown native metadata values are observable via non-blocking warnings", () => {
  const raw = makeRawIntake("single");
  const docxPayload = buildAmcDocxPayload(raw, {
    now: () => new Date("2026-03-15T18:00:00.000Z"),
  });
  const decisionSection = docxPayload.reportPayload.sections.find(
    (s: any) => s.section === "decision_conditions",
  );
  decisionSection.nativeMetadata.reassessmentTriggerType = "unsupported_trigger";
  decisionSection.nativeMetadata.explorationDesignHints = "invalid_hints_shape";

  const context = buildNestedTemplateContextFromDocxPayload(raw, docxPayload);
  const warnings = context.meta.native_mapping_warnings;

  assert.ok(Array.isArray(warnings));
  assert.equal(warnings.length > 0, true);
  assert.equal(
    warnings.some((w: string) => w.includes("reassessmentTriggerType unsupported value")),
    true,
  );
  assert.equal(
    warnings.some((w: string) => w.includes("explorationDesignHints expected object")),
    true,
  );
  assert.ok(context.exploration_plan.experiment_1.design.length > 0);
  assert.ok(context.commitment.reassessment_trigger.length > 0);
});
