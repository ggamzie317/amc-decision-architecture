# AMC Render CI Troubleshooting (Minimal)

Use this doc when CI/local renders fail and you need first-pass triage plus smoke verification.

Use this quick path for failures in `.github/workflows/amc-render.yml`.

## First Step To Check
- Check `Install JS dependencies` first.
- This step runs: `pnpm --dir manus-ui install --frozen-lockfile`.
- If this fails, later render and artifact steps often fail as downstream symptoms.

## Most Likely Causes
1. pnpm version mismatch
- CI should use `pnpm@10.4.1` to match `manus-ui/package.json` (`packageManager`).
- If changed, align workflow `Set up pnpm` version with `manus-ui/package.json`.

2. Frozen lockfile mismatch
- Typical error: `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
- Usually means `manus-ui/package.json` pnpm config and `manus-ui/pnpm-lock.yaml` are out of sync.
- Regenerate lockfile in `manus-ui` with the declared pnpm version and commit lockfile updates.

3. Missing artifacts (`output/...` or `output/golden/`)
- Usually a downstream symptom, not the root cause.
- Inspect the first failed render/install step before artifact upload errors.

## Quick Triage Order
1. `Set up pnpm` version in workflow.
2. `Install JS dependencies` error details.
3. Strict render step failures (`single`, `comparative`, `golden`).
4. Artifact upload failures (only after upstream steps are clean).

## Known Non-Blocking Warnings
- Node deprecation warnings in logs (for example around `url.parse()` or JavaScript action runtime migration) are warning-only unless a step exits non-zero.
- Treat the run as failed only when a workflow step status is failed/cancelled or strict render checks return an error.

## Local Reproduction
```bash
pnpm --dir manus-ui install --frozen-lockfile
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --strict-undeclared --out output/AMC_Report_ci_single.docx --payload output/amc_docx_payload_ci_single.json
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --comparative --strict-undeclared --out output/AMC_Report_ci_comparative.docx --payload output/amc_docx_payload_ci_comparative.json
bash scripts/render_golden_fixtures.sh
```

## Smoke Check
- Strict single render completes and writes `output/AMC_Report_ci_single.docx` + `output/amc_docx_payload_ci_single.json`.
- Strict comparative render completes and writes `output/AMC_Report_ci_comparative.docx` + `output/amc_docx_payload_ci_comparative.json`.
- Golden fixture run creates `output/golden/` with `review_summary.json` and `review_summary.md`.
- `leftover_placeholders` remains `0` for all fixtures in `output/golden/review_summary.json`.
