def render_bar(raw_score: float) -> str:
    normalized = max(0.0, min(float(raw_score), 2.0))
    filled = int(round((normalized / 2.0) * 5))
    return "▮" * filled + "▯" * (5 - filled)


def bar_5(internal_0_2: float) -> str:
    # Backward-compatible alias for existing callers.
    return render_bar(internal_0_2)
