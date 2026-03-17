"""Sync generated AMC payload JSON into Manus UI data path."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

DEFAULT_SRC = Path("output/report_payload_latest.json")
DEFAULT_DST = Path("manus-ui/client/src/data/reportPayload.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync report payload JSON to Manus UI data file.")
    parser.add_argument("--src", default=str(DEFAULT_SRC), help="Source payload JSON path")
    parser.add_argument("--dst", default=str(DEFAULT_DST), help="Destination UI payload JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    src = Path(args.src)
    dst = Path(args.dst)

    if not src.exists():
        raise FileNotFoundError(f"Source payload not found: {src}")

    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print(f"SYNCED: {src} -> {dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

