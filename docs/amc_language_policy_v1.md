# AMC Language Policy v1

## Core Principle
The selected language is not a UI-only toggle.  
It is the case-level delivery language for AMC.

## Propagation Scope
The same language value should propagate across:
- UI
- submission handoff
- report generation
- email language
- Executive follow-up
- future chatbot language

## v1 Rule
In v1, do not split UI language and report language.  
Use one language value consistently across the whole case.

## Korean Direction: Hybrid EN/KR
Korean delivery should not translate every framework term into Korean.

Use a hybrid EN/KR style:

- Keep major framework labels and strategic keywords in English.
- Write explanations, helper text, questions, evidence notes, and user-facing interpretations in natural Korean.
- Treat the English framework label as the stable conceptual anchor and the Korean sentence as the explanation.
- Avoid literal Korean translations that make business or strategy language feel academic, mechanical, or unfamiliar.

### Framework Labels to Keep in English

- `Decision Snapshot`
- `Core Tension`
- `Safety Margin`
- `Reversibility`
- `External Validation`
- `Risk Diagnosis`
- `Decision Conditions`
- `Commitment Condition`
- `Structural Reading`
- `30 / 60 / 90-Day Validation Plan`
- `Option A`
- `Option B`

Other major report labels should follow the same rule when the English term is already part of the AMC framework.

### Korean Explanation Style

Use Korean for the interpretation beneath or beside the English label.

Examples:

**Safety Margin**

Option A는 현재 소득, 조직 내 신뢰도, 전환 전 검증 시간을 더 안정적으로 보호합니다.

**Core Tension**

장기적 방향성은 Option B로 기울지만, 단기 안정성은 Option A에 더 강하게 남아 있습니다.

**External Validation**

Option B가 실제 시장, 네트워크, 기관, 고객으로부터 충분한 검증을 받고 있는지 확인해야 합니다.

### Tone

Korean customer-facing copy must be:

- professional
- calm
- premium
- structural
- evidence-sensitive
- concise
- non-motivational
- non-directive

Prefer:

- 결정의 구조
- 선택의 조건
- 검증
- 리스크
- 안정성
- 실행 부담
- 구조적으로 설명 가능한 결정
- 전환 전 확인해야 할 조건

Avoid:

- 꿈을 찾으세요
- 최고의 선택
- 정답을 알려드립니다
- 당신은 이 길로 가야 합니다
- 과도한 존댓말 반복
- 영어 전략 용어를 어색한 한자어로 직역한 표현

### Sentence Posture

Korean interpretation should preserve user agency and uncertainty.

Prefer conditional and diagnostic forms such as:

- `~로 보입니다.`
- `~을 시사합니다.`
- `~을 더 안정적으로 보호합니다.`
- `~이 확인될 때 더 구조적으로 설명 가능한 결정이 됩니다.`
- `~이 강화되면 전환의 조건이 더 명확해집니다.`
- `~을 전환 전에 검증할 필요가 있습니다.`

Avoid recommendation, certainty, or coaching language.

## Current Known State
- Language already exists in the flow.
- Some UI copy is still partially hardcoded in English.
- The current need is UI wiring and copy connection, not a new language contract redesign.

## Why This Policy Matters
- Reduces operational error.
- Simplifies submission/report/email contract handling.
- Keeps delivery consistent.
- Matches AMC's report-led philosophy.
