def build_bar(score):
    if score <= 0:
        return "▯▯▯"
    if score == 1:
        return "▮▯▯"
    return "▮▮▮"


def render_bar(raw_score: float) -> str:
    return build_bar(raw_score)


def bar_5(internal_0_2: float) -> str:
    return build_bar(internal_0_2)
