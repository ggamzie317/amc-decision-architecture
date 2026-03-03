from dataclasses import dataclass


@dataclass(frozen=True)
class ExposureResult:
    internal: float
    display: int
    bar: str
    label: str


@dataclass(frozen=True)
class DiagnosisResult:
    score_internal: float
    score_display: int
    core_read: str
    implication: str


@dataclass(frozen=True)
class FifwmSubScore:
    name: str
    internal: float
    display: int
    note: str
    bar: str


@dataclass(frozen=True)
class FifwmResult:
    formal: FifwmSubScore
    informal: FifwmSubScore
    framework: FifwmSubScore
    workflow: FifwmSubScore
    marketpolicy: FifwmSubScore


@dataclass(frozen=True)
class CompletenessResult:
    level: str
    note: str
