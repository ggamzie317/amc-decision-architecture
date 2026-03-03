from typing import Dict, List

from scoring.models import CompletenessResult


def _is_blank(value) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def _qualitative_keys() -> List[str]:
    keys = []
    for i in (1, 2, 3, 4):
        keys.append(f"Exec_Block_{i}_Line")
    for d in (1, 2, 3, 4, 5):
        keys.append(f"D{d}_Core_Read")
        keys.append(f"D{d}_Implication")
    for e in (1, 2, 3):
        for suffix in ("Context", "Objective", "Timeline", "Success", "Abort"):
            keys.append(f"Exp{e}_{suffix}")
    for m in (1, 2, 3):
        for a in (1, 2, 3):
            keys.append(f"M{m}_Action_{a}")
    for i in range(1, 6):
        keys.append(f"Assumption_{i}")
        keys.append(f"RedFlag_{i}")
    return keys


def compute_completeness(payload: Dict) -> CompletenessResult:
    missing = 0
    for key in _qualitative_keys():
        if _is_blank(payload.get(key)):
            missing += 1

    if missing <= 1:
        level = "High"
    elif missing <= 4:
        level = "Moderate"
    elif missing <= 8:
        level = "Partial"
    else:
        level = "Low"

    phrase = {
        "High": "most qualitative inputs available",
        "Moderate": "some qualitative inputs not available",
        "Partial": "several qualitative inputs not available",
        "Low": "many qualitative inputs not available",
    }[level]

    return CompletenessResult(
        level=level,
        note=f"Data completeness: {level} ({phrase}).",
    )
