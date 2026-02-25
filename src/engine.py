# engine.py (AMC v0.1)

from typing import Dict, Literal

# 타입 정의 (필요시 점점 확장)
MarketOutlook = Literal["declining", "mixed", "growing"]
Differentiation = Literal["many_similar", "some_diff", "highly_unique"]

CompanyHealth = Literal["low", "medium", "high"]
CompanyStability = Literal["unstable", "mixed", "stable"]
CompanyChange = Literal["major_changes", "some_changes", "no_changes"]

SponsorSupport = Literal["none", "weak", "strong"]
Clarity = Literal["not_clear", "somewhat_clear", "clear"]
WorkflowPace = Literal["very_slow_or_chaotic", "mixed", "clear_and_sustainable"]
Exposure = Literal["high_exposure", "medium_exposure", "low_exposure"]

DecisionTemperament = Literal["maximize_upside", "balance", "protect_downside"]
RiskComfort = Literal["not_comfortable", "somewhat_comfortable", "comfortable"]
CommitStyle = Literal["impulsive", "gradual", "deliberate"]

BaselineScenario = Literal["downside_heavy", "neutral", "upside_room"]
SafetyNet = Literal["none", "some", "strong"]


def map_q13(outlook: MarketOutlook) -> int:
    """Future demand for target role/field."""
    mapping = {
        "declining": 0,
        "mixed": 1,
        "growing": 2,
    }
    return mapping[outlook]


def map_q15(diff: Differentiation) -> int:
    """Profile differentiation."""
    mapping = {
        "many_similar": 0,
        "some_diff": 1,
        "highly_unique": 2,
    }
    return mapping[diff]


def map_q16(health: CompanyHealth) -> int:
    mapping = {
        "low": 0,
        "medium": 1,
        "high": 2,
    }
    return mapping[health]


def map_q17(stability: CompanyStability) -> int:
    mapping = {
        "unstable": 0,
        "mixed": 1,
        "stable": 2,
    }
    return mapping[stability]


def map_q18(change: CompanyChange) -> int:
    # 최근 2–3년 재편/리더십 변화
    mapping = {
        "major_changes": 0,   # 여러 차례 큰 변화
        "some_changes": 1,    # 눈에 띄는 변화/불확실성
        "no_changes": 2,      # 큰 변화 없음
    }
    return mapping[change]


def map_q19(sponsor: SponsorSupport) -> int:
    mapping = {
        "none": 0,
        "weak": 1,
        "strong": 2,
    }
    return mapping[sponsor]


def map_q20(clarity: Clarity) -> int:
    mapping = {
        "not_clear": 0,
        "somewhat_clear": 1,
        "clear": 2,
    }
    return mapping[clarity]


def map_q21(workflow: WorkflowPace) -> int:
    mapping = {
        "very_slow_or_chaotic": 0,
        "mixed": 1,
        "clear_and_sustainable": 2,
    }
    return mapping[workflow]


def map_q22(exposure: Exposure) -> int:
    mapping = {
        "high_exposure": 0,
        "medium_exposure": 1,
        "low_exposure": 2,
    }
    return mapping[exposure]


def map_q23(temp: DecisionTemperament) -> int:
    # 의사결정 시 기본 성향
    mapping = {
        "maximize_upside": 2,
        "balance": 1,
        "protect_downside": 0,
    }
    return mapping[temp]


def map_q24(risk: RiskComfort) -> int:
    mapping = {
        "not_comfortable": 0,
        "somewhat_comfortable": 1,
        "comfortable": 2,
    }
    return mapping[risk]


def map_q25(style: CommitStyle) -> int:
    mapping = {
        "impulsive": 0,
        "gradual": 1,
        "deliberate": 2,
    }
    return mapping[style]


def map_q27(baseline: BaselineScenario) -> int:
    # 아무것도 안 할 때 12–18개월 시나리오
    mapping = {
        "downside_heavy": 0,
        "neutral": 1,
        "upside_room": 2,
    }
    return mapping[baseline]


def map_q28(safety: SafetyNet) -> int:
    mapping = {
        "none": 0,
        "some": 1,
        "strong": 2,
    }
    return mapping[safety]


def normalize_factor(raw: int, min_sum: int, max_sum: int) -> int:
    """
    raw 합계(예: 0–4, 0–6)를 0–2 정수로 매핑.
    간단한 버킷팅 규칙을 사용.
    """
    # 범위 길이를 3등분
    span = max_sum - min_sum + 1
    bucket = span / 3.0

    if raw < min_sum + bucket:
        return 0
    elif raw < min_sum + 2 * bucket:
        return 1
    else:
        return 2


def compute_scores(answers: Dict) -> Dict:
    """
    answers: 정규화된 카테고리 값을 담은 dict.
    예:
      {
        "q13_outlook": "mixed",
        "q15_diff": "some_diff",
        "q16_health": "medium",
        ...
        "q28_safety": "some",
      }
    """
    # --- D1: Market & Role ---
    q13_score = map_q13(answers["q13_outlook"])
    q15_score = map_q15(answers["q15_diff"])
    raw_d1 = q13_score + q15_score   # 0–4
    d1 = normalize_factor(raw_d1, min_sum=0, max_sum=4)

    # --- D2: Company Stability & Governance ---
    q16_score = map_q16(answers["q16_health"])
    q17_score = map_q17(answers["q17_stability"])
    q18_score = map_q18(answers["q18_change"])
    raw_d2 = q16_score + q17_score + q18_score  # 0–6
    d2 = normalize_factor(raw_d2, min_sum=0, max_sum=6)

    # --- D3: FIFWM Structural Risk ---
    q19_score = map_q19(answers["q19_sponsor"])
    q20_score = map_q20(answers["q20_clarity"])
    q21_score = map_q21(answers["q21_workflow"])
    q22_score = map_q22(answers["q22_exposure"])
    raw_d3 = q19_score + q20_score + q21_score + q22_score  # 0–8
    # 0–2: 0, 3–5: 1, 6–8: 2
    d3 = normalize_factor(raw_d3, min_sum=0, max_sum=8)

    # --- D4: Personal Fit & Temperament ---
    q23_score = map_q23(answers["q23_temperament"])
    q24_score = map_q24(answers["q24_risk_comfort"])
    q25_score = map_q25(answers["q25_commit_style"])
    raw_d4 = q23_score + q24_score + q25_score  # 0–6
    d4 = normalize_factor(raw_d4, min_sum=0, max_sum=6)

    # --- D5: Upside vs Downside ---
    q27_score = map_q27(answers["q27_baseline"])
    q28_score = map_q28(answers["q28_safety"])
    raw_d5 = q27_score + q28_score  # 0–4
    d5 = normalize_factor(raw_d5, min_sum=0, max_sum=4)

    # --- Total & Verdict ---
    total = d1 + d2 + d3 + d4 + d5  # 0–10

    if total >= 8 and d2 > 0 and d3 > 0:
        verdict = "Aggressive Go"
    elif total >= 6:
        verdict = "Conditional Go"
    else:
        verdict = "Pivot – Hold"

    # 치명적 약점 필터: D2=0 또는 D3=0이면 Aggressive Go 금지
    if verdict == "Aggressive Go" and (d2 == 0 or d3 == 0):
        verdict = "Conditional Go"

    return {
        "Q13_score": q13_score,
        "Q15_score": q15_score,
        "D1": d1,
        "Q16_score": q16_score,
        "Q17_score": q17_score,
        "Q18_score": q18_score,
        "D2": d2,
        "Q19_score": q19_score,
        "Q20_score": q20_score,
        "Q21_score": q21_score,
        "Q22_score": q22_score,
        "D3": d3,
        "Q23_score": q23_score,
        "Q24_score": q24_score,
        "Q25_score": q25_score,
        "D4": d4,
        "Q27_score": q27_score,
        "Q28_score": q28_score,
        "D5": d5,
        "Total_Score": total,
        "Verdict_Label": verdict,
    }
