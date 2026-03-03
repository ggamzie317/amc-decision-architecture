"""Deterministic heuristic classifiers for paragraph responses."""

from __future__ import annotations

from typing import Iterable


EN_Q27_DOWNSIDE_SIGNALS = [
    "layoff",
    "termination",
    "pip",
    "burnout",
    "conflict",
    "toxic",
    "restructuring",
    "no growth",
    "stuck",
    "uncertainty",
    "demotion",
]

EN_Q27_UPSIDE_SIGNALS = [
    "promotion",
    "growth",
    "opportunity",
    "stable pipeline",
    "visibility",
    "strong performance",
    "raise",
    "expand",
]

KO_Q27_DOWNSIDE_SIGNALS = [
    "구조조정",
    "감원",
    "번아웃",
    "갈등",
    "정체",
    "악화",
    "불확실",
    "성과압박",
    "유지 어려움",
]

KO_Q27_UPSIDE_SIGNALS = [
    "승진",
    "성장",
    "기회",
    "안정",
    "확장",
    "개선",
    "성과 좋음",
]

EN_Q28_NONE_SIGNALS = [
    "no plan b",
    "none",
    "nothing",
    "no savings",
    "no support",
    "not sure",
]

EN_Q28_STRONG_SIGNALS = [
    "savings 12 months",
    "severance",
    "spouse income",
    "offer in hand",
    "return option",
    "family support",
    "visa secured",
    "emergency fund",
]

KO_Q28_NONE_SIGNALS = [
    "없음",
    "계획 없음",
    "모르겠다",
    "비상자금 없음",
    "지원 없음",
]

KO_Q28_STRONG_SIGNALS = [
    "12개월",
    "퇴직금",
    "배우자 소득",
    "오퍼 확정",
    "복귀 옵션",
    "가족 지원",
    "비자 확보",
    "비상자금",
]


def _normalize_text(text: str) -> str:
    return (text or "").casefold()


def _count_substring_hits(text: str, signals: Iterable[str]) -> int:
    haystack = _normalize_text(text)
    return sum(1 for signal in signals if signal.casefold() in haystack)


def _is_korean(lang: str) -> bool:
    normalized = (lang or "").strip().casefold()
    return normalized in {"ko", "kr", "korean", "한국어", "ko-kr"}


def infer_q27_baseline(text: str, lang: str) -> str:
    """Infer q27_baseline class using deterministic keyword counts."""
    if _is_korean(lang):
        down = _count_substring_hits(text, KO_Q27_DOWNSIDE_SIGNALS)
        up = _count_substring_hits(text, KO_Q27_UPSIDE_SIGNALS)
    else:
        down = _count_substring_hits(text, EN_Q27_DOWNSIDE_SIGNALS)
        up = _count_substring_hits(text, EN_Q27_UPSIDE_SIGNALS)

    if down - up >= 2:
        return "downside_heavy"
    if up - down >= 2:
        return "upside_room"
    return "neutral"


def infer_q28_safety(text: str, lang: str) -> str:
    """Infer q28_safety class using deterministic keyword counts."""
    if _is_korean(lang):
        none_hits = _count_substring_hits(text, KO_Q28_NONE_SIGNALS)
        strong_hits = _count_substring_hits(text, KO_Q28_STRONG_SIGNALS)
    else:
        none_hits = _count_substring_hits(text, EN_Q28_NONE_SIGNALS)
        strong_hits = _count_substring_hits(text, EN_Q28_STRONG_SIGNALS)

    if none_hits >= 2:
        return "none"
    if strong_hits >= 2:
        return "strong"
    return "some"
