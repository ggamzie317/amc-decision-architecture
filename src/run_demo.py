from engine import calculate_score

# 샘플 응답 (테스트용)
answers = {
    "income_stability": 4,
    "risk_tolerance": 2,
    "global_mobility": 5,
    "entrepreneurial_drive": 3
}

result = calculate_score(answers)

print("=== AMC Decision Score Demo ===")
print(result)
