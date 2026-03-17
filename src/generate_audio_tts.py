"""Generate AMC audio summary file from text script via provider-based TTS."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_INFILE = Path("output/audio_summary_script_latest.txt")
DEFAULT_OUTFILE = Path("output/audio_summary_latest.mp3")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate AMC audio summary via TTS provider.")
    parser.add_argument("--provider", default="openai", choices=["openai", "gemini"], help="TTS provider")
    parser.add_argument("--infile", default=str(DEFAULT_INFILE), help="Input script text file")
    parser.add_argument("--outfile", default=str(DEFAULT_OUTFILE), help="Output audio file path")
    parser.add_argument("--voice", default="alloy", help="Voice name (provider-dependent)")
    parser.add_argument("--speed", type=float, default=0.9, help="Speech speed/pace hint")
    parser.add_argument(
        "--format",
        dest="audio_format",
        default="mp3",
        choices=["mp3", "wav"],
        help="Output audio format",
    )
    parser.add_argument(
        "--model",
        default="gpt-4o-mini-tts",
        help="Model id (provider-dependent); default targets OpenAI TTS",
    )
    return parser.parse_args()


def _read_script(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Input script not found: {path}")
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError(f"Input script is empty: {path}")
    return text


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _openai_tts(
    text: str,
    outfile: Path,
    *,
    api_key: str,
    model: str,
    voice: str,
    speed: float,
    audio_format: str,
) -> None:
    payload = {
        "model": model,
        "voice": voice,
        "input": text,
        "format": audio_format,
        "speed": speed,
    }
    req = urllib.request.Request(
        url="https://api.openai.com/v1/audio/speech",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            audio_bytes = resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI TTS request failed ({exc.code}): {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"OpenAI TTS network error: {exc}") from exc

    if not audio_bytes:
        raise RuntimeError("OpenAI TTS returned empty audio bytes.")

    _ensure_parent(outfile)
    outfile.write_bytes(audio_bytes)


def main() -> int:
    args = parse_args()
    infile = Path(args.infile)
    outfile = Path(args.outfile)
    text = _read_script(infile)

    if args.provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            print("ERROR: OPENAI_API_KEY is not set.")
            return 1
        _openai_tts(
            text,
            outfile,
            api_key=api_key,
            model=args.model,
            voice=args.voice,
            speed=args.speed,
            audio_format=args.audio_format,
        )
        print(f"WROTE: {outfile}")
        print("PROVIDER: openai")
        return 0

    if args.provider == "gemini":
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not gemini_key:
            print("ERROR: GEMINI_API_KEY is not set.")
            return 1
        print("ERROR: Gemini TTS provider is not implemented in v1 yet.")
        print("Use --provider openai for now.")
        return 1

    print(f"ERROR: Unsupported provider: {args.provider}")
    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
    except Exception as exc:  # defensive fallback
        print(f"ERROR: Unexpected failure: {exc}")
        raise SystemExit(1)

