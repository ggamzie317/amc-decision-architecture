"""Run latest spreadsheet response through engine and emit payload JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from intake_parser import infer_language, parse_pipeline_inputs, read_latest_row
from report_payload_builder import build_report_payload

DEFAULT_XLSX = "../AMC – Strategic Career Decision Assessment (Responses).xlsx"
DEFAULT_SHEET = "Scores"
OUTPUT_PATH = Path("output/report_payload_latest.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run latest row scoring pipeline.")
    parser.add_argument("--xlsx", default=DEFAULT_XLSX, help="Path to xlsx workbook")
    parser.add_argument("--lang", default="", help="Language override: en|ko")
    parser.add_argument("--sheet", default=DEFAULT_SHEET, help="Sheet name")
    parser.add_argument("--out", default=str(OUTPUT_PATH), help="Output payload JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    out_path = Path(args.out)

    row = read_latest_row(args.xlsx, sheet=args.sheet)
    lang = infer_language(row, args.lang)

    parsed = parse_pipeline_inputs(row, lang)
    payload = build_report_payload(row, lang)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Verdict_Label: {payload['Verdict_Label']}")
    print(f"Total_Score: {payload['Total_Score']}")
    print(f"Q27_Baseline_Class: {payload['Q27_Baseline_Class']}")
    print(f"Q28_Safety_Class: {payload['Q28_Safety_Class']}")

    print("Baseline keyword blocks:")
    for category in ("market", "internal", "personal"):
        keywords = ", ".join(parsed["baseline_keywords"][category]["keywords"])
        print(f"  - {category}: {keywords}")

    print("SafetyNet keyword blocks:")
    for category in ("market", "internal", "personal"):
        keywords = ", ".join(parsed["safetynet_keywords"][category]["keywords"])
        print(f"  - {category}: {keywords}")

    print("Variability bars:")
    print(f"  - market: {payload['Market_Variability_Bar']}")
    print(f"  - internal: {payload['Internal_Variability_Bar']}")
    print(f"  - personal: {payload['Personal_Variability_Bar']}")
    print(f"WROTE: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
