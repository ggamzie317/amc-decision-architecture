"""Generate a TTS-ready AMC audio summary script from latest payload JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

DEFAULT_MERGED = Path("output/report_payload_merged.json")
DEFAULT_LATEST = Path("output/report_payload_latest.json")
DEFAULT_OUT = Path("output/audio_summary_script_latest.txt")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate AMC audio summary script.")
    parser.add_argument("--payload", default="", help="Optional payload JSON path override")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output audio script text path")
    return parser.parse_args()


def _pick_payload_path(override: str) -> Path:
    if override:
        return Path(override)
    if DEFAULT_MERGED.exists():
        return DEFAULT_MERGED
    return DEFAULT_LATEST


def _t(value: object, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text if text else fallback


def _sentence(value: str, fallback: str) -> str:
    text = _t(value, fallback)
    if not text.endswith("."):
        text = text.rstrip(" ,;:") + "."
    return text


def _build_single(payload: dict) -> str:
    verdict = _sentence(payload.get("Dashboard_Verdict"), "Structural reading remains conditional.")
    core = _sentence(payload.get("Dashboard_Core_Insight"), "Core structural insight remains mixed under current assumptions.")
    risk = _sentence(payload.get("Dashboard_Risk_Summary"), "Risk remains mixed across internal and external dimensions.")
    external_title = _sentence(payload.get("External_Snapshot_Title"), "External snapshot reflects mixed pressure.")
    market = _sentence(payload.get("External_Market_Direction"), "Market direction appears mixed with selective visibility.")
    economic = _sentence(payload.get("External_Economic_Pressure"), "Economic pressure appears moderate and active.")
    internal = _sentence(payload.get("Internal_Structural_Snapshot"), "Internal structural exposure remains mixed.")
    value = _sentence(payload.get("Value_Structure_Reading"), "Value structure reflects a trade-off between continuity and repositioning.")
    mobility = _sentence(payload.get("Mobility_Reading"), "Mobility conditions remain conditional under current structure.")
    temperament = _sentence(payload.get("Temperament_Reading"), "Temperament profile remains balanced.")
    condition = _sentence(
        payload.get("Decision_Gate_Rule"),
        "Commitment condition remains tied to clearer external stability and validated execution readiness.",
    )

    parts = [
        "This is the AMC audio summary for the latest career decision report.",
        "The purpose is to clarify the structural reading and the current commitment conditions.",
        "",
        f"{verdict} {core}",
        "",
        f"{risk} {external_title}",
        f"{market} {economic}",
        f"{internal} {value}",
        f"{mobility} {temperament}",
        "",
        f"Decision conditions remain central. {condition}",
        "",
        "The report frame remains structural. It clarifies trade-offs, exposure, and timing conditions before commitment.",
    ]
    return "\n".join(parts)


def _build_comparative(payload: dict) -> str:
    verdict = _sentence(payload.get("Dashboard_Verdict"), "Structural reading remains conditional.")
    core = _sentence(payload.get("Dashboard_Core_Insight"), "Core structural insight remains mixed under current assumptions.")
    risk = _sentence(payload.get("Dashboard_Risk_Summary"), "Risk remains mixed across internal and external dimensions.")
    value = _sentence(payload.get("Dashboard_Value_Summary"), "Value structure reflects a continuity versus repositioning trade-off.")
    mobility = _sentence(payload.get("Dashboard_Mobility_Summary"), "Mobility profile remains conditional.")
    temperament = _sentence(payload.get("Dashboard_Temperament_Summary"), "Temperament profile remains balanced under uncertainty.")

    option_a = _t(payload.get("External_OptionA_Label"), "Option A")
    option_b = _t(payload.get("External_OptionB_Label"), "Option B")
    a_market = _t(payload.get("External_OptionA_Market_Status"), "◆ Mixed")
    a_comp = _t(payload.get("External_OptionA_Competition_Status"), "◐ Moderate")
    a_econ = _t(payload.get("External_OptionA_Economic_Status"), "◐ Moderate")
    a_trans = _t(payload.get("External_OptionA_Transition_Status"), "◐ Moderate")
    b_market = _t(payload.get("External_OptionB_Market_Status"), "◆ Mixed")
    b_comp = _t(payload.get("External_OptionB_Competition_Status"), "◐ Moderate")
    b_econ = _t(payload.get("External_OptionB_Economic_Status"), "◐ Moderate")
    b_trans = _t(payload.get("External_OptionB_Transition_Status"), "◐ Moderate")
    comp_read = _sentence(
        payload.get("External_Comparative_Reading"),
        "The options differ primarily in continuity, pressure concentration, and transition cost.",
    )
    comp_impl = _sentence(
        payload.get("External_Comparative_Implication"),
        "The core trade-off remains between preserved continuity and longer-horizon repositioning.",
    )
    internal = _sentence(payload.get("Internal_Structural_Snapshot"), "Internal structural exposure remains mixed.")
    condition = _sentence(
        payload.get("Decision_Gate_Rule"),
        "Commitment condition remains tied to clearer external stability and validated execution readiness.",
    )

    parts = [
        "This is the AMC audio summary for the latest comparative career decision report.",
        "The summary focuses on structural trade-offs between two external paths.",
        "",
        f"{verdict} {core}",
        "",
        f"{risk} {value}",
        f"{mobility} {temperament}",
        "",
        f"{option_a} shows {a_market} market direction, {a_comp} competition pressure, {a_econ} economic pressure, and {a_trans} transition friction.",
        f"{option_b} shows {b_market} market direction, {b_comp} competition pressure, {b_econ} economic pressure, and {b_trans} transition friction.",
        "Option A is structurally more stable where continuity and friction containment matter most.",
        "Option B is structurally more exposed where pressure concentration and execution load are higher.",
        f"{comp_read} {comp_impl}",
        "",
        f"{internal} Decision conditions remain central. {condition}",
        "",
        "This closes the AMC summary with a structural lens on exposure, optionality, and commitment timing.",
    ]
    return "\n".join(parts)


def build_script(payload: dict) -> str:
    mode = _t(payload.get("External_Mode"), "single").lower()
    if mode == "comparative":
        return _build_comparative(payload)
    return _build_single(payload)


def main() -> int:
    args = parse_args()
    payload_path = _pick_payload_path(args.payload)
    out_path = Path(args.out)

    if not payload_path.exists():
        print(f"ERROR: Payload file not found: {payload_path}")
        return 1

    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        print(f"ERROR: Payload JSON must be an object: {payload_path}")
        return 1

    script = build_script(payload)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(script + "\n", encoding="utf-8")
    print(f"WROTE: {out_path}")
    print(f"SOURCE: {payload_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

