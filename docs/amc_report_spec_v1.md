# AMC Report Spec v1

## Purpose
Lock customer-facing report terminology, section labels, score presentation, and visual rules before code changes.

## Core Principle
- Logic should remain framework-led.
- Customer-facing language should be simple and clear.
- Comparative reports should use External Comparative Snapshot as the primary external section.
- Manus-like premium visual rhythm should be the target.

## Section Labels
- Executive Dashboard -> 결정 한눈에 보기
- Executive Overview -> 이번 결정의 핵심 구조
- External Snapshot -> 외부 환경 요약
- External Comparative Snapshot -> 선택지 간 환경 비교
- Internal Structural Snapshot -> 현재 나의 준비 상태
- Structural Risk Diagnosis -> 리스크 구조 진단
- FIFWM (internal only) -> 환경–준비 적합도
- Career Value Structure -> 가치 구조 비교
- Career Mobility Structure -> 이동 가능성
- Strategic Temperament -> 성향과 선택의 적합성
- Structural Scorecard -> 핵심 비교 요약
- Hybrid Exploration Plan -> 현실 검증 계획
- 90-Day Execution Map -> 향후 체크 사항
- Decision Conditions -> 결정이 가능한 조건
- Recommendation Box (if used) -> 지금의 판단 방향

## FIFWM Naming Rule
- Keep FIFWM as an internal framework reference only.
- Do not expose unexplained acronym to customers.
- Customer-facing section title: 환경–준비 적합도
- Customer-facing dimensions:
  - Formal -> 기회의 조건
  - Informal -> 연결 가능성
  - Framework -> 구조 적합성
  - Workflow -> 실행 현실성
  - Market-Policy -> 버틸 수 있는가

## Score Presentation Rules
- Customer-facing Structural Diagnosis must use bar-style visuals instead of raw 1/2 notation.
- Preferred bar scale:
  - low -> ■□□
  - medium -> ■■□
  - high -> ■■■
- Every scored item must include a one-line interpretation.

## Visual Rules
- Quiet, premium, memo-like style
- Logic like McKinsey, visual tone like Manus
- One primary message per section
- Card rhythm with restrained borders and generous whitespace
- Scored layers and non-scored layers must be visually distinct
- In 향후 체크 사항, the top 2-3 most important points must be visually emphasized

## Language Toggle Readiness
- All labels and copy must be ready for Korean / English / Chinese
- Avoid unexplained jargon
- Keep headings short and translation-safe
- Prefer plain customer language over internal analysis terms

## Implementation Order
1. Lock this spec
2. Update template/payload/labels
3. Update rendering logic
4. Validate with a second sample case
