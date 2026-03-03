from __future__ import annotations

from functools import lru_cache
from typing import Dict, List

from content_library.pdf_phrase_extract import extract_phrase_candidates


_FALLBACK_BANK = {
    "risk_signal_oneliner": [
        "Signal concentration appears elevated in the current structure.",
        "Structural friction appears present across decision pathways.",
        "Downside signal remains visible under current assumptions.",
        "Signal quality appears mixed across formal and informal channels.",
    ],
    "structural_read_templates": [
        "{dimension} signal appears {signal_state}.",
        "Current evidence suggests {dimension} remains {signal_state}.",
        "Structural reading indicates {dimension} is {signal_state}.",
        "Observed signals suggest {dimension} stays {signal_state}.",
    ],
    "implication_templates": [
        "Implication suggests {implication_state} under current assumptions.",
        "Current structure indicates {implication_state} is prudent.",
        "Signal pattern suggests {implication_state} remains appropriate.",
        "Interpretation indicates {implication_state} while uncertainty persists.",
    ],
    "pattern_tags": [
        "Signal mixed",
        "Risk concentrated",
        "Evidence partial",
        "Assumption sensitive",
    ],
}


def _merge_with_fallback(candidates: Dict[str, List[str]]) -> Dict[str, List[str]]:
    merged: Dict[str, List[str]] = {}
    for key, fallback in _FALLBACK_BANK.items():
        picked = [s for s in candidates.get(key, []) if isinstance(s, str) and s.strip()]
        merged[key] = picked if picked else list(fallback)
    return merged


@lru_cache(maxsize=1)
def load_phrase_bank() -> Dict[str, List[str]]:
    candidates = extract_phrase_candidates()
    return _merge_with_fallback(candidates)
