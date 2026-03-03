from typing import Optional

from scoring.bars import render_bar
from scoring.exposure import clamp_0_2
from scoring.models import FifwmResult, FifwmSubScore
from scoring.text_defaults import fill_default

FIFWM_NOTE_DEFAULT = "Signal currently insufficient for a stable sub-read."


def build_fifwm_subscore(name: str, internal: float, note: Optional[str]) -> FifwmSubScore:
    internal_clamped = clamp_0_2(float(internal))
    display = int(round(internal_clamped))
    return FifwmSubScore(
        name=name,
        internal=internal_clamped,
        display=display,
        note=fill_default(note, FIFWM_NOTE_DEFAULT),
        bar=render_bar(internal_clamped),
    )


def build_fifwm(formal, informal, framework, workflow, marketpolicy) -> FifwmResult:
    return FifwmResult(
        formal=formal,
        informal=informal,
        framework=framework,
        workflow=workflow,
        marketpolicy=marketpolicy,
    )
