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

### Audio summary script (TTS-ready, no TTS API yet)

Generate a narration-ready AMC audio summary script from the latest payload:

`python3 src/generate_audio_summary.py`

Output file:

- `output/audio_summary_script_latest.txt`

Note: TTS engine integration is intentionally deferred to a later step.

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
