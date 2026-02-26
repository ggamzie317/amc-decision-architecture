from engine import compute_scores

# engine.py의 mapping 키(소문자 리터럴)와 100% 일치하게 작성
answers = {
    "q13_outlook": "growing",                # declining | mixed | growing
    "q15_diff": "highly_unique",             # many_similar | some_diff | highly_unique
    "q16_health": "high",                    # low | medium | high
    "q17_stability": "stable",               # unstable | mixed | stable
    "q18_change": "no_changes",              # major_changes | some_changes | no_changes
    "q19_sponsor": "strong",                 # none | weak | strong
    "q20_clarity": "clear",                  # not_clear | somewhat_clear | clear
    "q21_workflow": "clear_and_sustainable", # very_slow_or_chaotic | mixed | clear_and_sustainable
    "q22_exposure": "low_exposure",          # high_exposure | medium_exposure | low_exposure
    "q23_temperament": "balance",            # maximize_upside | balance | protect_downside
    "q24_risk_comfort": "comfortable",       # not_comfortable | somewhat_comfortable | comfortable
    "q25_commit_style": "deliberate",        # impulsive | gradual | deliberate
    "q27_baseline": "upside_room",           # downside_heavy | neutral | upside_room
    "q28_safety": "strong",                  # none | some | strong
}

result = compute_scores(answers)

print("=== AMC Decision Score Demo ===")
print(result)
