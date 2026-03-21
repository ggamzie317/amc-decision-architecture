# AMC Dry Run Checklist (Minimal)

Use this checklist to run one AMC case end-to-end before delivery.

## 1) Select Input Case
- Choose one intake JSON (for example `examples/amc_sample_single.json`).

## 2) Run Report Generation
```bash
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts \
  --intake "$PWD/examples/amc_sample_single.json" \
  --strict-undeclared \
  --out "$PWD/output/AMC_Report_dry_run.docx" \
  --payload "$PWD/output/amc_docx_payload_dry_run.json"
```

## 3) Verify Expected Outputs
- `output/AMC_Report_dry_run.docx` exists.
- `output/amc_docx_payload_dry_run.json` exists.

## 4) Check Placeholder / Summary Signals
- Confirm no visible `{{...}}` placeholder leakage in the rendered DOCX.
- Run `bash scripts/render_golden_fixtures.sh` and confirm `output/golden/review_summary.json` shows `leftover_placeholders == 0`.

## 5) Delivery Readiness Review
- Verify section order, comparative visibility behavior (if applicable), fallback visibility, and restrained tone.
