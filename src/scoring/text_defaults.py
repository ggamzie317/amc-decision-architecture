from typing import Optional

CORE_READ_DEFAULT = "Signal currently insufficient for a confident read."
IMPLICATION_DEFAULT = "Implication remains provisional; prioritize signal collection."
EXPERIMENT_DEFAULT = "This experiment remains concept-level and requires further scoping."


def fill_default(text: Optional[str], default: str) -> str:
    if text is None:
        return default
    if isinstance(text, str) and text.strip() == "":
        return default
    return str(text).strip()
