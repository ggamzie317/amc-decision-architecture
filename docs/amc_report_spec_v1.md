# AMC Report Spec v1

## Purpose
Lock customer-facing report terminology, section labels, score presentation, and visual rules before code changes.

## Core Principle
- Logic should remain framework-led.
- Customer-facing language should be simple and clear.
- Comparative reports should use External Comparative Snapshot as the primary external section.
- Manus-like premium visual rhythm should be the target.

## Section Labels
Korean delivery uses hybrid EN/KR labels. Keep the framework label in English and place the Korean interpretation beneath or beside it.

- Executive Dashboard
- Executive Overview
- Decision Snapshot
- External Snapshot
- External Comparative Snapshot
- Internal Structural Snapshot
- Structural Risk Diagnosis / Risk Diagnosis
- Career Value Structure
- Career Mobility Structure
- Strategic Temperament
- Structural Scorecard
- Hybrid Exploration Plan
- 30 / 60 / 90-Day Validation Plan
- Decision Conditions
- Structural Reading

Do not convert these labels into literal Korean section titles. Korean should explain what the section means and why the signal matters.

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
- For Korean, retain major AMC framework labels in English
- Use natural Korean for explanations, helper text, questions, and interpretation
- Prefer plain customer language over internal analysis terms
- Avoid awkward literal translations of business and strategy terminology

## Implementation Order
1. Lock this spec
2. Update template/payload/labels
3. Update rendering logic
4. Validate with a second sample case
