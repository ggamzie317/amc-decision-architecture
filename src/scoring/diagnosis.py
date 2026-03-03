import re
from typing import Optional

from scoring.exposure import score_round_display
from scoring.models import DiagnosisResult
from scoring.text_defaults import CORE_READ_DEFAULT, IMPLICATION_DEFAULT, fill_default


def _single_line(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def build_diagnosis(
    d_score_internal: float,
    core_read: Optional[str],
    implication: Optional[str],
) -> DiagnosisResult:
    core = _single_line(fill_default(core_read, CORE_READ_DEFAULT))
    impl = _single_line(fill_default(implication, IMPLICATION_DEFAULT))
    display = score_round_display(float(d_score_internal))
    return DiagnosisResult(
        score_internal=float(d_score_internal),
        score_display=display,
        core_read=core,
        implication=impl,
    )
