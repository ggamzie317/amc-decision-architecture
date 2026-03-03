from __future__ import annotations

from typing import Dict

ALLOWED_TAG_VALUES = {"low", "medium", "high"}
FIXED_EXTERNAL_KEYS = (
    "irreversibility",
    "income_compression",
    "credential_dependency",
    "competition_density",
    "institutional_volatility",
    "mobility_load",
)


def normalize_text(s: object) -> str:
    return str(s or "").strip().lower()


def safe_join(*fields: object) -> str:
    return " ".join(normalize_text(v) for v in fields if normalize_text(v))


def has_any(text: str, keywords: list[str]) -> bool:
    return any(k in text for k in keywords)


def parse_buffer_months(q28_text_or_value: object):
    text = normalize_text(q28_text_or_value)
    if not text:
        return None
    import re

    m = re.search(r"(\d{1,2})\s*(months?|mos?)", text)
    if m:
        return int(m.group(1))
    return None


def _empty_result() -> Dict[str, str]:
    return {k: "medium" for k in FIXED_EXTERNAL_KEYS}


def _sanitize_tags(raw: Dict[str, str]) -> Dict[str, str]:
    out = {}
    for key in FIXED_EXTERNAL_KEYS:
        v = normalize_text(raw.get(key, "medium"))
        out[key] = v if v in ALLOWED_TAG_VALUES else "medium"
    return out


def compute_external_structural_tags(parsed_intake: Dict[str, object]) -> Dict[str, str]:
    external_inputs = parsed_intake.get("external_inputs", {}) if isinstance(parsed_intake, dict) else {}
    if not isinstance(external_inputs, dict):
        external_inputs = {}

    decision_text = normalize_text(external_inputs.get("decision_text", ""))
    options_text = normalize_text(external_inputs.get("options_text", ""))
    baseline_text = normalize_text(external_inputs.get("baseline_text", ""))
    safetynet_text = normalize_text(external_inputs.get("safetynet_text", ""))
    location_text = normalize_text(external_inputs.get("location_text", ""))

    corpus = safe_join(decision_text, options_text, baseline_text, safetynet_text, location_text)
    if not corpus:
        return _empty_result()

    tags = _empty_result()

    # irreversibility
    if has_any(
        corpus,
        [
            "quit",
            "resign",
            "leave the company",
            "phd",
            "doctoral",
            "immigrate",
            "relocate",
            "move abroad",
            "퇴사",
            "사직",
            "박사",
            "유학",
            "이민",
            "이주",
            "해외",
            "귀임",
        ],
    ):
        tags["irreversibility"] = "high"
    elif has_any(corpus, ["internal transfer", "rotation", "trial", "pilot", "part-time"]):
        tags["irreversibility"] = "low"

    # income compression
    m = parse_buffer_months(safetynet_text)
    if m is not None:
        if m >= 12:
            tags["income_compression"] = "low"
        elif m <= 6:
            tags["income_compression"] = "high"
        else:
            tags["income_compression"] = "medium"
    elif has_any(
        corpus,
        [
            "income",
            "salary",
            "pay cut",
            "buffer",
            "savings",
            "소득",
            "연봉",
            "급여",
            "예적금",
            "저축",
            "버틸",
            "no safety net",
            "almost no safety net",
        ],
    ):
        tags["income_compression"] = "high"

    # credential dependency
    if has_any(corpus, ["phd", "doctoral", "mba", "certification", "license", "bar exam", "자격", "면허"]):
        tags["credential_dependency"] = "high"
    elif has_any(corpus, ["internal", "same function", "same industry", "no new credential"]):
        tags["credential_dependency"] = "low"

    # competition density
    if has_any(corpus, ["top schools", "elite", "tenure-track", "faang", "ib/pe", "highly competitive", "many similar profiles"]):
        tags["competition_density"] = "high"
    elif has_any(corpus, ["niche", "internal promotion", "unique profile"]):
        tags["competition_density"] = "low"

    # institutional volatility
    if has_any(corpus, ["reorg", "restructuring", "layoff", "policy shock", "funding instability", "ai displacement"]):
        tags["institutional_volatility"] = "high"
    elif has_any(corpus, ["stable", "predictable", "no major changes"]):
        tags["institutional_volatility"] = "low"

    # mobility load
    if has_any(corpus, ["same city", "same company", "internal move", "no relocation"]):
        tags["mobility_load"] = "low"
    elif has_any(
        corpus,
        [
            "usa",
            "united states",
            "canada",
            "new york",
            "beijing",
            "seoul",
            "visa",
            "비자",
            "지역",
            "도시",
            "국가",
            "해외",
            "relocation",
            "family move",
        ],
    ):
        tags["mobility_load"] = "high"

    return _sanitize_tags(tags)


def extract_external_structural_tags(row: Dict[str, object], payload=None) -> Dict[str, str]:
    # compatibility wrapper
    external_inputs = {}
    if isinstance(payload, dict):
        external_inputs = payload.get("external_inputs", {})
    return compute_external_structural_tags({"external_inputs": external_inputs})
