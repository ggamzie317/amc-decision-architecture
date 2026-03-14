"""Build AMC external layer JSON from normalized notes JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

DEFAULT_NOTES = Path("output/external_layer_notes_latest.json")
DEFAULT_OUT = Path("output/external_layer_latest.json")

REQUIRED_SINGLE = (
    "mode",
    "snapshot_title",
    "market_direction",
    "competition_pressure",
    "economic_pressure",
    "transition_friction",
)

REQUIRED_COMPARATIVE = (
    "mode",
    "option_a_label",
    "option_a_market_status",
    "option_a_competition_status",
    "option_a_economic_status",
    "option_a_transition_status",
    "option_b_label",
    "option_b_market_status",
    "option_b_competition_status",
    "option_b_economic_status",
    "option_b_transition_status",
    "comparative_reading",
    "comparative_implication",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build AMC external layer JSON from normalized notes.")
    parser.add_argument("--notes", default=str(DEFAULT_NOTES), help="Input normalized notes JSON path")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output AMC external layer JSON path")
    return parser.parse_args()


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _missing_required(data: dict, required_keys: tuple[str, ...]) -> list[str]:
    missing: list[str] = []
    for key in required_keys:
        if key not in data or str(data.get(key, "")).strip() == "":
            missing.append(key)
    return missing


def _build_single(data: dict) -> dict:
    return {
        "External_Mode": "single",
        "External_Snapshot_Title": str(data["snapshot_title"]).strip(),
        "External_Market_Direction": str(data["market_direction"]).strip(),
        "External_Competition_Pressure": str(data["competition_pressure"]).strip(),
        "External_Economic_Pressure": str(data["economic_pressure"]).strip(),
        "External_Transition_Friction": str(data["transition_friction"]).strip(),
    }


def _build_comparative(data: dict) -> dict:
    return {
        "External_Mode": "comparative",
        "External_OptionA_Label": str(data["option_a_label"]).strip(),
        "External_OptionA_Market_Status": str(data["option_a_market_status"]).strip(),
        "External_OptionA_Competition_Status": str(data["option_a_competition_status"]).strip(),
        "External_OptionA_Economic_Status": str(data["option_a_economic_status"]).strip(),
        "External_OptionA_Transition_Status": str(data["option_a_transition_status"]).strip(),
        "External_OptionB_Label": str(data["option_b_label"]).strip(),
        "External_OptionB_Market_Status": str(data["option_b_market_status"]).strip(),
        "External_OptionB_Competition_Status": str(data["option_b_competition_status"]).strip(),
        "External_OptionB_Economic_Status": str(data["option_b_economic_status"]).strip(),
        "External_OptionB_Transition_Status": str(data["option_b_transition_status"]).strip(),
        "External_Comparative_Reading": str(data["comparative_reading"]).strip(),
        "External_Comparative_Implication": str(data["comparative_implication"]).strip(),
    }


def main() -> int:
    args = parse_args()
    notes_path = Path(args.notes)
    out_path = Path(args.out)

    if not notes_path.exists():
        print(f"ERROR: Notes file not found: {notes_path}")
        return 1

    notes = _load_json(notes_path)
    if not isinstance(notes, dict):
        print("ERROR: Notes JSON must be an object.")
        return 1

    mode = str(notes.get("mode", "")).strip().lower()
    if mode not in {"single", "comparative"}:
        print("ERROR: 'mode' must be either 'single' or 'comparative'.")
        return 1

    required = REQUIRED_SINGLE if mode == "single" else REQUIRED_COMPARATIVE
    missing = _missing_required(notes, required)
    if missing:
        print("ERROR: Missing required notes fields:")
        for key in missing:
            print(f"- {key}")
        return 1

    external_layer = _build_single(notes) if mode == "single" else _build_comparative(notes)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(external_layer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE: {out_path}")
    print(f"MODE: {mode}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

