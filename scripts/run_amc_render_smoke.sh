#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[smoke] strict single render"
pnpm --dir "$ROOT_DIR/manus-ui" exec tsx "$ROOT_DIR/scripts/run_amc_report.ts" \
  --strict-undeclared \
  --out "$ROOT_DIR/output/AMC_Report_ci_single.docx" \
  --payload "$ROOT_DIR/output/amc_docx_payload_ci_single.json"

echo "[smoke] strict comparative render"
pnpm --dir "$ROOT_DIR/manus-ui" exec tsx "$ROOT_DIR/scripts/run_amc_report.ts" \
  --comparative \
  --strict-undeclared \
  --out "$ROOT_DIR/output/AMC_Report_ci_comparative.docx" \
  --payload "$ROOT_DIR/output/amc_docx_payload_ci_comparative.json"

echo "[smoke] golden fixture render"
bash "$ROOT_DIR/scripts/render_golden_fixtures.sh"

echo "[smoke] complete"
