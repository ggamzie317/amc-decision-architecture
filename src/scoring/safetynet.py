import re
from typing import Optional


def _text(value: Optional[str]) -> str:
    return str(value or "").strip().lower()


def _explicit_bucket_internal(explicit_bucket: Optional[str]) -> Optional[float]:
    if explicit_bucket is None:
        return None
    bucket = _text(explicit_bucket)
    if not bucket:
        return None
    if bucket in {"none", "0", "zero"}:
        return 0.0
    if "<6" in bucket or "under 6" in bucket or "less than 6" in bucket:
        return 0.5
    if "6" in bucket and "12" in bucket:
        return 1.0
    if "12" in bucket and "24" in bucket:
        return 2.0
    if "24" in bucket or "2 year" in bucket or "24+" in bucket:
        return 2.0
    return None


def safety_net_penalty_none_only(q28_text: str) -> float:
    text = _text(q28_text)
    none_signals = [
        "almost no safety net",
        "no safety net",
        "no plan b",
        "none",
        "nothing",
        "no backup",
        "no fallback",
    ]
    return -0.5 if any(sig in text for sig in none_signals) else 0.0


def _infer_base_from_text(q27_text: str, q28_text: str) -> float:
    text = f"{_text(q27_text)} {_text(q28_text)}"

    if "<6" in text or "under 6" in text or "less than 6" in text:
        return 0.5

    # Month-first detection
    if re.search(r"\b(24|2\s*years?)\b", text):
        return 2.0
    if re.search(r"\b(12\s*(months?|mos?)|1\s*year)\b", text):
        return 2.0
    if re.search(r"\b(6\s*(months?|mos?))\b", text):
        return 1.0

    if any(sig in text for sig in ["almost no safety net", "no safety net", "no plan b", "no backup", "no fallback", "none", "nothing"]):
        return 0.0

    if any(sig in text for sig in ["some safety net", "limited savings", "few months", "small buffer"]):
        return 0.5

    return 0.0


def safety_net_internal(q27_text: str, q28_text: str, explicit_bucket: Optional[str] = None) -> float:
    base = _explicit_bucket_internal(explicit_bucket)
    if base is None:
        base = _infer_base_from_text(q27_text, q28_text)

    penalty = safety_net_penalty_none_only(q28_text) if base == 0.0 else 0.0
    internal = base + penalty
    # penalty cannot push below 0.0
    if internal < 0.0:
        internal = 0.0
    if internal > 2.0:
        internal = 2.0
    return internal
