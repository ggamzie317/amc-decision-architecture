from scoring.bars import bar_5
from scoring.models import ExposureResult
from scoring.safetynet import safety_net_internal, safety_net_penalty_none_only
from scoring.urgency import urgency_multiplier


def clamp_0_2(x: float) -> float:
    return max(0.0, min(2.0, float(x)))


def score_round_display(internal: float) -> int:
    x = clamp_0_2(internal)
    if x < 0.5:
        return 0
    if x < 1.5:
        return 1
    return 2


def exposure_internal(base: float, urgency_mult: float) -> float:
    return clamp_0_2(float(base) * float(urgency_mult))


def compute_exposure(q27_text: str, q28_text: str, urgency_raw: str) -> ExposureResult:
    # base from safety net profile; additional none-only penalty handled before clamp
    base = safety_net_internal(q27_text, q28_text)
    internal = exposure_internal(base, urgency_multiplier(urgency_raw))
    # keep explicit none-penalty hook without violating clamp bounds
    if base == 0.0:
        internal = clamp_0_2(internal + safety_net_penalty_none_only(q28_text))

    display = score_round_display(internal)
    label = ""
    if display == 0:
        label = "Downside heavy"
    elif display == 1:
        label = "Balanced"
    else:
        label = "Credible safety"

    return ExposureResult(
        internal=internal,
        display=display,
        bar=bar_5(internal),
        label=label,
    )
