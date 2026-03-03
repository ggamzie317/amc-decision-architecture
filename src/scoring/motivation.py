def classify_motivation(decision_text: str, nonnegotiable_text: str, fears_text: str) -> str:
    text = " ".join([str(decision_text or ""), str(nonnegotiable_text or ""), str(fears_text or "")]).lower()

    escape_hits = sum(1 for kw in ["boredom", "burnout", "boring", "not fun", "stress", "toxic", "escape"] if kw in text)
    growth_hits = sum(1 for kw in ["phd", "learning", "research", "new challenge", "growth", "upside"] if kw in text)
    stability_hits = sum(1 for kw in ["family", "salary", "security", "stability", "predictable"] if kw in text)

    if escape_hits >= 1 and growth_hits >= 1:
        return "Mixed (Escape + Growth)"
    if growth_hits >= max(escape_hits, stability_hits) and growth_hits > 0:
        return "Growth"
    if escape_hits >= max(growth_hits, stability_hits) and escape_hits > 0:
        return "Escape"
    if stability_hits > 0:
        return "Stability"
    return "Mixed (Escape + Growth)" if (escape_hits + growth_hits) > 0 else "Stability"
