"""Dictionary-driven keyword extraction and variability scoring."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

CATEGORIES = ("market", "internal", "personal")


def _lang_code(lang: str) -> str:
    normalized = (lang or "").strip().casefold()
    if normalized in {"ko", "kr", "korean", "한국어", "ko-kr"}:
        return "ko"
    return "en"


def load_keywords(lang: str) -> Dict[str, List[Dict]]:
    code = _lang_code(lang)
    base_dir = Path(__file__).resolve().parent
    yaml_path = base_dir / f"keywords_{code}.yaml"
    json_path = base_dir / f"keywords_{code}.json"

    try:
        import yaml  # type: ignore

        with yaml_path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle)
            return _validate_dictionary(data)
    except Exception:
        with json_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
            return _validate_dictionary(data)


def _validate_dictionary(data: Dict) -> Dict[str, List[Dict]]:
    validated: Dict[str, List[Dict]] = {"market": [], "internal": [], "personal": []}
    for category in CATEGORIES:
        for item in data.get(category, []):
            patterns = item.get("pattern", [])
            keyword = str(item.get("keyword", "")).strip()
            weight = int(item.get("weight", 1))
            if not patterns or not keyword:
                continue
            validated[category].append(
                {
                    "pattern": [str(p).casefold() for p in patterns if str(p).strip()],
                    "keyword": keyword,
                    "weight": max(1, min(3, weight)),
                }
            )
    return validated


def extract_keywords(text: str, lang: str) -> Dict[str, List[str]]:
    extracted, _, _ = _extract_with_weights(text, lang)
    return extracted


def _extract_with_weights(text: str, lang: str) -> Tuple[Dict[str, List[str]], Dict[str, int], Dict[str, List[Tuple[str, int]]]]:
    normalized_text = (text or "").casefold()
    dictionary = load_keywords(lang)

    selected_pairs: Dict[str, List[Tuple[str, int]]] = {cat: [] for cat in CATEGORIES}
    for category in CATEGORIES:
        seen = set()
        for entry in dictionary.get(category, []):
            keyword = entry["keyword"]
            if keyword in seen:
                continue
            if any(pattern in normalized_text for pattern in entry["pattern"]):
                seen.add(keyword)
                selected_pairs[category].append((keyword, entry["weight"]))

        selected_pairs[category].sort(key=lambda item: (-item[1], item[0]))
        selected_pairs[category] = selected_pairs[category][:4]

    extracted = {cat: [keyword for keyword, _ in selected_pairs[cat]] for cat in CATEGORIES}
    variability_scores = {
        cat: variability_score(sum(weight for _, weight in selected_pairs[cat])) for cat in CATEGORIES
    }
    return extracted, variability_scores, selected_pairs


def variability_score(weight_sum: int) -> int:
    if weight_sum <= 0:
        return 0
    if weight_sum <= 3:
        return 1
    if weight_sum <= 6:
        return 2
    return 3


def variability_bar(score: int) -> str:
    clamped = max(0, min(3, int(score)))
    mapping = {
        0: "▯▯▯▯",
        1: "▮▯▯▯",
        2: "▮▮▯▯",
        3: "▮▮▮▯",
    }
    return mapping[clamped]


def extract_keywords_with_variability(text: str, lang: str) -> Dict[str, Dict[str, object]]:
    extracted, variability_scores, _ = _extract_with_weights(text, lang)
    return {
        category: {
            "keywords": extracted[category],
            "variability_score": variability_scores[category],
            "variability_bar": variability_bar(variability_scores[category]),
        }
        for category in CATEGORIES
    }
