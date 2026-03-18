## Goal

- Input: Structured answers from the AMC Strategic Career Decision Assessment form.
- Output:
  - 5-factor structural scorecard (D1–D5, 0–2 each)
  - Total score (0–10) and decision verdict (Aggressive Go / Conditional Go / Pivot – Hold)
  - Narrative report fields (Executive summary, factor reads, implications, 90-day plan)

This repo will host:
- Scoring engine (Python)
- Report schema and templates (Markdown/JSON)
- LLM prompts for narrative generation (ChatGPT, Perplexity, Gemini, Vertex AI, etc.)

## AMC Pipeline Overview

Current AMC pipeline is deterministic and section-based:

- raw intake normalization
- structural flag derivation
- input summary construction
- narrative section building
- report payload assembly
- template payload adaptation
- DOCX bridge + existing merge path handoff

## Core AMC Modules

- `src/amc/normalizeIntake.ts`: raw intake normalization (`normalizeIntake`)
- `src/amc/deriveFlags.ts`: structural flag derivation (`deriveFlags`)
- `src/amc/buildInputSummary.ts`: human-readable input summary (`buildInputSummary`)
- Narrative section builders:
  - `src/buildExecutiveOverview.ts`
  - `src/buildExternalSnapshot.ts`
  - `src/buildInternalStructuralSnapshot.ts`
  - `src/buildStructuralRiskDiagnosis.ts`
  - `src/buildCareerValueStructure.ts`
  - `src/buildCareerMobilityStructure.ts`
  - `src/buildStrategicTemperament.ts`
  - `src/buildDecisionConditions.ts`
- `src/assembleAmcReportPayload.ts`: orchestrates normalized intake + flags + summary + sections
- `src/buildAmcTemplatePayload.ts`: template-ready flat placeholder payload
- `src/buildAmcDocxPayload.ts`: bridge payload (`meta` + `reportPayload` + `templatePayload`)
- `src/generateAmcReport.ts`: AMC integration entrypoint to production DOCX render path
- `src/merge_docx.py`: `docxtpl`-based nested render + undeclared-variable audit

## Generation Flow

```text
raw intake
-> assembleAmcReportPayload
-> buildAmcTemplatePayload
-> buildAmcDocxPayload
-> generateAmcReport
-> merge_docx.py
-> final DOCX output
```

## Current Section Order

1. `executive_overview`
2. `external_snapshot`
3. `internal_structural_snapshot`
4. `structural_risk_diagnosis`
5. `career_value_structure`
6. `career_mobility_structure`
7. `strategic_temperament`
8. `decision_conditions`

## Example Usage (Current Entrypoint)

Programmatic usage via TypeScript entrypoint (`generateAmcReport`) is currently the canonical AMC integration path:

```ts
import { generateAmcReport } from "./src/generateAmcReport";

const result = generateAmcReport(rawIntake, {
  templatePath: "/absolute/path/to/template.docx",
  outPath: "output/AMC_Report_Latest.docx",
});

console.log(result.payloadPath, result.outPath);
```

Quick local execution example:

```bash
pnpm --dir manus-ui exec tsx ../tests/generateAmcReport.test.ts
```

## Testing

Core regression:

```bash
python3 -m unittest discover -s tests -v
```

Targeted AMC TS tests (examples):

```bash
pnpm --dir manus-ui exec tsx ../tests/assembleAmcReportPayload.test.ts
pnpm --dir manus-ui exec tsx ../tests/buildAmcTemplatePayload.test.ts
pnpm --dir manus-ui exec tsx ../tests/buildAmcDocxPayload.test.ts
pnpm --dir manus-ui exec tsx ../tests/generateAmcReport.test.ts
```

## Current Assumptions / Limitations

- Comparative detection is text-signal based (`optionsUnderConsideration` markers).
- Production template defaults to repo-local path:
  `templates/AMC_Strategic_Career_Decision_Template_v3_3.docx`
- Upstream validation is intentionally lightweight; builders fail transparently on missing required data.
- Render context is nested and aligned to dotted DOCX placeholders.

## Canonical Production Render Commands

Single-path render (strict undeclared check):

```bash
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --strict-undeclared
```

Comparative render (strict undeclared check):

```bash
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --comparative --strict-undeclared
```

Optional language layer for fixed render strings (`ko|en|zh`, default `en` or `intake.lang`):

```bash
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --strict-undeclared --lang ko
```

## Immediate Next Recommended Cleanup

- Refine README and developer docs around end-to-end AMC invocation examples.
- Add/maintain sample intake and sample output fixtures for quick regression checks.
- Clean up legacy/auxiliary output artifacts (audio/email intermediate files) if out of current AMC scope.

## Manus UI Integration (Baseline Report UI)

The Manus-generated AMC report UI is integrated under `manus-ui/` and preserved as the baseline frontend draft.

Run it locally:

```bash
cd manus-ui
pnpm install
pnpm dev
```

### Sync generated payload to Manus UI

After generating the latest AMC payload, sync it to the Manus UI data file:

```bash
python3 src/run_latest.py --xlsx "/Users/kwonkibum/Downloads/AMC – Strategic Career Decision Assessment (Responses).xlsx" --sheet "Scores" --lang en --out output/report_payload_latest.json
python3 src/merge_external_layer.py --payload output/report_payload_latest.json --external output/external_layer_latest.json --out output/report_payload_merged.json
python3 src/sync_payload_to_ui.py --src output/report_payload_merged.json
python3 src/generate_email_draft.py
python3 src/generate_audio_summary.py
cd manus-ui && pnpm dev
```

### External layer JSON templates (manual authoring)

Use one of the templates under `output/templates/`:

- `output/templates/external_layer_single.template.json`
- `output/templates/external_layer_comparative.template.json`

Workflow:

1. Copy the appropriate template.
2. Fill values with normalized external-layer results.
3. Save as `output/external_layer_latest.json`.
4. Merge into the AMC payload:
   `python3 src/merge_external_layer.py --payload output/report_payload_latest.json --external output/external_layer_latest.json --out output/report_payload_merged.json`
5. Sync merged payload to Manus UI:
   `python3 src/sync_payload_to_ui.py --src output/report_payload_merged.json`

### Build external layer JSON from normalized notes

Semi-automated flow (no API call) to convert notes into AMC external JSON:

1. Prepare normalized notes from template:
   - `output/templates/external_layer_notes_single.template.json`
   - `output/templates/external_layer_notes_comparative.template.json`
2. Save as `output/external_layer_notes_latest.json`
3. Build AMC external layer JSON:
   `python3 src/build_external_layer_from_notes.py --notes output/external_layer_notes_latest.json --out output/external_layer_latest.json`
4. Merge into payload:
   `python3 src/merge_external_layer.py --payload output/report_payload_latest.json --external output/external_layer_latest.json --out output/report_payload_merged.json`
5. Sync merged payload to UI:
   `python3 src/sync_payload_to_ui.py --src output/report_payload_merged.json`

Optional path from Perplexity-style raw text:

1. Prepare raw comparative text (template):
   `output/templates/perplexity_external_raw_comparative.template.txt`
2. Save as:
   `output/perplexity_external_raw.txt`
3. Extract normalized notes:
   `python3 src/extract_external_notes_from_text.py --infile output/perplexity_external_raw.txt --out output/external_layer_notes_latest.json`
4. Build external layer JSON:
   `python3 src/build_external_layer_from_notes.py --notes output/external_layer_notes_latest.json --out output/external_layer_latest.json`
5. Merge and sync:
   `python3 src/merge_external_layer.py --payload output/report_payload_latest.json --external output/external_layer_latest.json --out output/report_payload_merged.json`
   `python3 src/sync_payload_to_ui.py --src output/report_payload_merged.json`

### Audio summary + TTS file generation

1. Generate the narration-ready AMC audio summary script:

`python3 src/generate_audio_summary.py`

2. Generate a playable audio file (v1 provider: OpenAI TTS):

`python3 src/generate_audio_tts.py --provider openai --infile output/audio_summary_script_latest.txt --outfile output/audio_summary_latest.mp3`

Required environment variables:

- `OPENAI_API_KEY` for `--provider openai`
- `GEMINI_API_KEY` reserved for future `--provider gemini` support

Outputs:

- Script: `output/audio_summary_script_latest.txt`
- Audio: `output/audio_summary_latest.mp3`

Tier note:

- Essential tier includes report + audio summary.
- Executive tier includes report + audio summary + chatbot layer.

Language note:

- AMC delivery is currently English-first, with language-toggle readiness maintained for Korean / English / Chinese in future phases.

### AMC chatbot scaffold (report interpreter layer)

AMC chatbot behavior is defined as a report-grounded interpretation layer, not a recommendation engine.

Behavior files:

- System prompt: `prompts/amc_chatbot_system_prompt_v1.txt`
- Fallback responses: `prompts/amc_chatbot_fallbacks_v1.json`
- FAQ seed scaffold: `prompts/amc_faq_seed_v1.json`

Scope:

- Interprets report sections, trade-offs, and conditions.
- Handles scope boundaries consistently for off-report questions.
- Provides structured FAQ seed entries for later retrieval or chat routing.
- Future integration steps: payload-grounded chat context wiring, FAQ seed set, and UI/chat integration.
