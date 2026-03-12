"""Generate a ready-to-send AMC email draft from the latest payload JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

DEFAULT_PAYLOAD = Path("output/report_payload_latest.json")
DEFAULT_OUT = Path("output/email_draft_latest.txt")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate AMC email draft text from payload JSON.")
    parser.add_argument("--payload", default=str(DEFAULT_PAYLOAD), help="Input payload JSON path")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output email draft text path")
    return parser.parse_args()


def _normalize_text(value: object) -> str:
    return str(value or "").strip()


def _greeting_name(payload: dict) -> str:
    for key in ("Full_Name", "full_name", "Client_Name", "client_name"):
        name = _normalize_text(payload.get(key))
        if name:
            return f"Hello {name},"
    return "Hello,"


def _external_line(payload: dict) -> str:
    mode = _normalize_text(payload.get("External_Mode")).lower()
    if mode == "comparative":
        return "- Comparative Analysis included"
    return "- External Snapshot included"


def build_email_draft(payload: dict) -> str:
    greeting = _greeting_name(payload)
    external_line = _external_line(payload)
    lines = [
        "Subject: Your AMC Career Decision Report",
        "",
        greeting,
        "",
        "Your AMC report is now ready.",
        "",
        "This report includes:",
        "- Executive Dashboard",
        "- Structural Risk Diagnosis",
        "- External Snapshot",
        external_line,
        "- Decision Conditions",
        "",
        "It is designed to clarify structural trade-offs, risk concentration, and commitment conditions surrounding the current career decision context.",
        "",
        "[Report attachment or link placeholder]",
        "",
        "Best,",
        "AMC",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    payload_path = Path(args.payload)
    out_path = Path(args.out)

    if not payload_path.exists():
        raise FileNotFoundError(f"Payload not found: {payload_path}")

    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    draft = build_email_draft(payload)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(draft, encoding="utf-8")
    print(f"WROTE: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

