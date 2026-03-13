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
cd manus-ui && pnpm dev
```
