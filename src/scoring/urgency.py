import re


def urgency_multiplier(urgency_raw: str) -> float:
    text = str(urgency_raw or "").strip().lower()
    if not text:
        return 1.0

    if "month" in text:
        if "3" in text:
            return 1.15
        if "6" in text:
            return 1.05

    # Handle numeric month formats such as "3", "6", "within 3".
    match = re.search(r"\b(\d{1,2})\b", text)
    if match:
        months = int(match.group(1))
        if months <= 3:
            return 1.15
        if months <= 6:
            return 1.05

    return 1.0
