"""Extract comparative external-layer notes JSON from structured raw text."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

DEFAULT_IN = Path("output/perplexity_external_raw.txt")
DEFAULT_OUT = Path("output/external_layer_notes_latest.json")

MARKET_STATUSES = ("Supportive", "Mixed", "Constrained")
PRESSURE_STATUSES = ("Contained", "Moderate", "Elevated")
ALL_STATUSES = MARKET_STATUSES + PRESSURE_STATUSES

HEADINGS = (
    "Market Direction",
    "Competition Pressure",
    "Economic Pressure",
    "Transition Friction",
    "Comparative Reading",
    "Comparative Implication",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract AMC external notes JSON from Perplexity-style raw text.")
    parser.add_argument("--infile", default=str(DEFAULT_IN), help="Input raw text file path")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output external notes JSON path")
    return parser.parse_args()


def _normalize_status(raw: str) -> str:
    value = str(raw or "").strip().lower()
    mapping = {
        "supportive": "Supportive",
        "mixed": "Mixed",
        "constrained": "Constrained",
        "contained": "Contained",
        "moderate": "Moderate",
        "elevated": "Elevated",
    }
    return mapping.get(value, "")


def _extract_option_labels(text: str) -> tuple[str, str]:
    a = re.search(r"Option\s*A\s*[:\-]\s*(.+)", text, flags=re.IGNORECASE)
    b = re.search(r"Option\s*B\s*[:\-]\s*(.+)", text, flags=re.IGNORECASE)
    label_a = a.group(1).strip() if a else "Option A"
    label_b = b.group(1).strip() if b else "Option B"
    return label_a, label_b


def _find_heading_indices(lines: list[str]) -> dict[str, int]:
    idx: dict[str, int] = {}
    for i, line in enumerate(lines):
        for h in HEADINGS:
            if line.lower().startswith(h.lower()):
                idx[h] = i
    return idx


def _extract_block(lines: list[str], heading: str, heading_indices: dict[str, int]) -> str:
    if heading not in heading_indices:
        return ""
    start = heading_indices[heading]
    next_positions = [v for k, v in heading_indices.items() if v > start]
    end = min(next_positions) if next_positions else len(lines)
    block_lines = lines[start:end]
    first = block_lines[0]
    if ":" in first:
        first = first.split(":", 1)[1].strip()
    else:
        first = ""
    rest = "\n".join(block_lines[1:]).strip()
    text = "\n".join([x for x in (first, rest) if x]).strip()
    return text


def _extract_status_pair(block: str, allowed: tuple[str, ...]) -> tuple[str, str]:
    if not block:
        return "", ""
    allowed_re = "(" + "|".join(allowed) + ")"
    option_a = re.search(rf"Option\s*A[^A-Za-z]+{allowed_re}", block, flags=re.IGNORECASE)
    option_b = re.search(rf"Option\s*B[^A-Za-z]+{allowed_re}", block, flags=re.IGNORECASE)
    if option_a and option_b:
        return _normalize_status(option_a.group(1)), _normalize_status(option_b.group(1))

    statuses = re.findall(allowed_re, block, flags=re.IGNORECASE)
    statuses = [_normalize_status(s) for s in statuses if _normalize_status(s)]
    if len(statuses) >= 2:
        return statuses[0], statuses[1]
    return "", ""


def extract_notes(raw_text: str) -> dict:
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    heading_indices = _find_heading_indices(lines)

    label_a, label_b = _extract_option_labels(raw_text)

    market_block = _extract_block(lines, "Market Direction", heading_indices)
    competition_block = _extract_block(lines, "Competition Pressure", heading_indices)
    economic_block = _extract_block(lines, "Economic Pressure", heading_indices)
    friction_block = _extract_block(lines, "Transition Friction", heading_indices)
    comp_reading = _extract_block(lines, "Comparative Reading", heading_indices)
    comp_implication = _extract_block(lines, "Comparative Implication", heading_indices)

    a_market, b_market = _extract_status_pair(market_block, MARKET_STATUSES)
    a_comp, b_comp = _extract_status_pair(competition_block, PRESSURE_STATUSES)
    a_econ, b_econ = _extract_status_pair(economic_block, PRESSURE_STATUSES)
    a_fric, b_fric = _extract_status_pair(friction_block, PRESSURE_STATUSES)

    return {
        "mode": "comparative",
        "option_a_label": label_a,
        "option_a_market_status": a_market,
        "option_a_competition_status": a_comp,
        "option_a_economic_status": a_econ,
        "option_a_transition_status": a_fric,
        "option_b_label": label_b,
        "option_b_market_status": b_market,
        "option_b_competition_status": b_comp,
        "option_b_economic_status": b_econ,
        "option_b_transition_status": b_fric,
        "comparative_reading": comp_reading,
        "comparative_implication": comp_implication,
    }


def _validate(notes: dict) -> list[str]:
    required = (
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
    missing = []
    for key in required:
        if str(notes.get(key, "")).strip() == "":
            missing.append(key)
    return missing


def main() -> int:
    args = parse_args()
    in_path = Path(args.infile)
    out_path = Path(args.out)

    if not in_path.exists():
        print(f"ERROR: Input text file not found: {in_path}")
        return 1

    raw = in_path.read_text(encoding="utf-8")
    notes = extract_notes(raw)
    missing = _validate(notes)
    if missing:
        print("ERROR: Could not extract required comparative fields:")
        for key in missing:
            print(f"- {key}")
        print("No output file written.")
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(notes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

