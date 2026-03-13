"""Merge external-layer JSON into AMC report payload JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

DEFAULT_PAYLOAD = Path("output/report_payload_latest.json")
DEFAULT_EXTERNAL = Path("output/external_layer_latest.json")
DEFAULT_OUT = Path("output/report_payload_merged.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Merge external layer JSON into AMC payload JSON.")
    parser.add_argument("--payload", default=str(DEFAULT_PAYLOAD), help="Base payload JSON path")
    parser.add_argument("--external", default=str(DEFAULT_EXTERNAL), help="External layer JSON path")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Merged payload output JSON path")
    parser.add_argument(
        "--inplace",
        action="store_true",
        help="Write merged result back to --payload path instead of --out",
    )
    return parser.parse_args()


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    args = parse_args()
    payload_path = Path(args.payload)
    external_path = Path(args.external)
    out_path = payload_path if args.inplace else Path(args.out)

    if not payload_path.exists():
        print(f"ERROR: Payload file not found: {payload_path}")
        return 1
    if not external_path.exists():
        print(f"ERROR: External layer file not found: {external_path}")
        print("No merge performed. Existing payload file remains unchanged.")
        return 1

    payload = _load_json(payload_path)
    external = _load_json(external_path)

    if not isinstance(payload, dict):
        print("ERROR: Payload JSON is not an object.")
        return 1
    if not isinstance(external, dict):
        print("ERROR: External layer JSON is not an object.")
        return 1

    merged = dict(payload)
    # External keys override payload keys for external-layer integration.
    merged.update(external)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE: {out_path}")
    print(f"MERGED_KEYS: {len(external)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

