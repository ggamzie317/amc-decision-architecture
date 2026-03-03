from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

PLACEHOLDER_STRINGS = {
    "one-line structural summary.",
    "signal currently insufficient for a confident summary.",
}


def _coerce_int(value: object, default: int = 1) -> int:
    try:
        return int(round(float(str(value).strip())))
    except Exception:
        return default


def _normalize_text(value: object) -> str:
    return str(value or "").strip()


@lru_cache(maxsize=1)
def load_executive_phrase_bank() -> Dict[str, Dict[str, List[str]]]:
    path = Path(__file__).resolve().parent / "executive_phrases_en.json"
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data


def _pick_deterministic(variants: List[str], case_id: str, tag: str) -> str:
    clean = [v.strip() for v in variants if isinstance(v, str) and v.strip()]
    if not clean:
        return ""
    basis = f"{case_id}|{tag}".encode("utf-8")
    idx = int(hashlib.sha256(basis).hexdigest(), 16) % len(clean)
    return clean[idx]


def _verdict_tag(verdict: str) -> str:
    v = verdict.casefold()
    if "pivot" in v and "hold" in v:
        return "pivot_hold"
    if "conditional" in v and "go" in v:
        return "conditional_go"
    if "pivot" in v:
        return "pivot"
    if "hold" in v:
        return "hold"
    if "go" in v:
        return "go"
    return "conditional_go"


def _outlook_tag(market_score: int) -> str:
    if market_score >= 2:
        return "upward"
    if market_score <= 0:
        return "declining"
    return "mixed"


def _risk_tag(risk_score: int) -> str:
    if risk_score >= 2:
        return "low"
    if risk_score <= 0:
        return "high"
    return "moderate"


def _personal_exposure_tag(fit_score: int, safety_net_level: str, exposure_score: int) -> str:
    safety = safety_net_level.casefold().strip()
    if fit_score >= 1 and exposure_score >= 1 and safety not in {"none", "low"}:
        return "high_fit_managed_risk"
    if fit_score >= 1 and (exposure_score <= 0 or safety in {"none", "low"}):
        return "high_fit_high_risk"
    return "misaligned"


def _case_id(context: Dict[str, object]) -> str:
    for key in ("case_id", "Full_Name", "full_name", "email", "2. Email address", "Timestamp", "timestamp"):
        value = _normalize_text(context.get(key))
        if value:
            return value
    return "amc-default-case"


def build_executive_sentences(context: Dict[str, object]) -> Dict[str, str]:
    bank = load_executive_phrase_bank()

    verdict = _normalize_text(context.get("verdict") or context.get("Verdict_Label") or "Conditional Go")
    market_score = _coerce_int(context.get("market_score") or context.get("D1"), default=1)
    risk_score = _coerce_int(context.get("risk_score") or context.get("D3"), default=1)
    fit_score = _coerce_int(context.get("fit_score") or context.get("D4"), default=1)
    exposure_score = _coerce_int(context.get("exposure_score") or context.get("D5"), default=1)
    safety_net_level = _normalize_text(context.get("safety_net_level") or context.get("Q28_Safety_Class") or "moderate")

    tags = {
        "verdict": _verdict_tag(verdict),
        "outlook": _outlook_tag(market_score),
        "risk": _risk_tag(risk_score),
        "personal_exposure": _personal_exposure_tag(fit_score, safety_net_level, exposure_score),
    }

    cid = _case_id(context)

    verdict_line = _pick_deterministic(bank["verdict"][tags["verdict"]], cid, f"verdict:{tags['verdict']}")
    outlook_line = _pick_deterministic(bank["outlook"][tags["outlook"]], cid, f"outlook:{tags['outlook']}")
    risk_line = _pick_deterministic(bank["risk"][tags["risk"]], cid, f"risk:{tags['risk']}")
    personal_line = _pick_deterministic(
        bank["personal_exposure"][tags["personal_exposure"]],
        cid,
        f"personal_exposure:{tags['personal_exposure']}",
    )

    fallback = "Signal currently insufficient for a confident summary."
    return {
        "Exec_Block_1_Title": "Verdict",
        "Exec_Block_1_Line": verdict_line or fallback,
        "Exec_Block_2_Title": "Structural Outlook",
        "Exec_Block_2_Line": outlook_line or fallback,
        "Exec_Block_3_Title": "Structural Risk",
        "Exec_Block_3_Line": risk_line or fallback,
        "Exec_Block_4_Title": "Personal & Exposure",
        "Exec_Block_4_Line": personal_line or fallback,
    }


def is_placeholder_like(text: object) -> bool:
    normalized = _normalize_text(text).casefold()
    return normalized in PLACEHOLDER_STRINGS
