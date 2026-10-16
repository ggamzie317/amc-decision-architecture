# 문구 검토표 (2026-10-16)

기준 `main` `1b9aa16`. 원칙: 의뢰서 §2.2 — `Current Structural Posture`는 조건부 구조 해석이며 행동 명령이 아니다. 점수·Posture 분류·프레임워크 의미는 바꾸지 않고 표시 문구만 바꾼다. 확인 단계("~을 확인하세요")의 명령형은 "다음 확인"으로 허용한다.

표기: ★ = 권장안.

## A. 판단 헤드라인 (가장 많이 보이는 문구)

현재 세 판단의 고객 이름:

| 엔진 판단 | KO 현재 | EN 현재 |
|---|---|---|
| Stronger Transition Case | 옮겨 갈 근거가 더 강해짐 | A stronger case for moving |
| **Preserve and Validate** | **현재 계획 유지** | **Keep the current plan for now** |
| Protect and Reconfigure | 안전 여유를 지키며 경로 조정 | **Adjust the path while protecting your margin** |

**W1. Preserve and Validate 이름** (`v2ReportPresentation.ts:114,122`; 대시보드 첫 줄, 보고서 표지, 경로 지도, 시뮬레이터, 결론 추적, 판단 전환 문장 안)
- 문제: "유지/Keep"이 고객의 행동을 정해 주는 말로 읽힘. 같은 화면의 "정답이나 추천이 아닙니다"와 충돌.
- 선택지:
  - ★ A: `옮기기 전에 확인이 더 필요함` / `More to confirm before a move` — 다른 두 판단과 같은 "상태" 표현, 가장 짧음
  - B: `기반을 지키며 확인하는 단계` / `Keeping your base while checking`
  - C: `기반을 지키며 확인하는 쪽이 더 뒷받침됨` / `Better supported: keeping your base while checking the new path`
- 의미 보존: 예 (엔진 문장 "기반을 지키면서 외부 근거를 확인하는 방향이 더 잘 뒷받침됩니다"의 요약).

**W2. Protect and Reconfigure EN** (`v2ReportPresentation.ts:115`)
- 현재 EN `Adjust the path while protecting your margin`(명령형) → `Adjusting the path while protecting your margin`. KO는 그대로(명사형).

**W3. 헤드라인 아래 질문** (`v2Readings.ts:24`, `trace/traceSchema.ts:183`)
- 현재: `지금 조건에 가장 잘 맞는 움직임은 무엇인가요?` / `Which move fits your current conditions best?` — "가장 잘 맞는 움직임"이 추천으로 읽힘
- 제안: `지금 조건에서는 어느 쪽이 더 뒷받침되나요?` / `Under your current conditions, which direction is better supported?`

**W4. 시뮬레이터 설명** (`V2ScenarioExplain.tsx:41-42`)
- 현재: `중간 구간 · 현재 계획 유지` / `Middle range · keep the current plan`
- 제안: W1 결정에 맞춤. A안이면 `중간 구간 · 옮기기 전 확인 단계` / `Middle range · more to confirm before a move`.

**W13. (현재 화면에 안 나오는) 판단 설명문** (`v2ReportPresentation.ts:124`)
- 현재 KO: `현재 계획을 유지하면서 {B}에 필요한 외부 근거를 먼저 확인하세요. …`
- 제안 KO: `지금 조건에서는 현재 기반을 지키면서 {B}에 필요한 외부 근거를 먼저 확인하는 순서가 더 잘 뒷받침됩니다.`

## B. 판단이 바뀌는 조건 문장

**W5. 전환 판단일 때** (`amcProductApplicationV3.ts:416`)
- 현재: `{B} 쪽 근거가 유지되면 단계적으로 계속 옮겨 가고, 약해지면 투입을 줄여 현재 기반을 다시 지킵니다.` / `If it holds, keep moving in stages; if it weakens, scale back and protect your current base again.`
- 제안: `{B} 쪽 근거가 유지되면 단계적으로 옮겨 가는 쪽이 계속 뒷받침되고, 약해지면 현재 기반을 지키는 쪽으로 판단이 돌아갑니다.` / `If it holds, moving in stages stays better supported; if it weakens, the reading shifts back toward protecting your current base.`

**W6. 머무름 쪽 조건** (`amcProductApplicationV3.ts:419`; #117 이후 "손실 위험 · 높음" 같은 조건 뒤에 붙음)
- 현재: `약해지면 현재 판단을 다시 보고, {A} 쪽 기반을 더 단단히 지킵니다.` / `If it weakens, revisit the current reading and keep more of your footing in your current role.`
- 문제: 조건이 "맞으면"인데 "약해지면"으로 시작해 어색하고, "지킵니다"가 지시로 읽힘.
- 제안: `이 조건이 맞으면 {A}의 기반을 지키며 확인하는 쪽이 더 잘 뒷받침됩니다.` / `If this holds, keeping your base in your current role is better supported.` (이동 쪽 문장 `이 조건이 맞으면 {B} 쪽으로 단계적으로 옮겨 가는 데 힘이 실립니다.`와 짝)

**W9. 안전장치(guardrail) 적용 시** (`amcProductApplicationV3.ts:413-414`)
- 현재 끝: `…보완할 방법이 확인될 때만 검토하세요.` / `Consider moving further only when …`
- 제안: `…보완할 방법이 확인될 때에야 더 본격적으로 옮기는 것을 검토할 조건이 됩니다.` / `Moving further becomes worth considering only once the evidence supports it and a way to cover … is confirmed.`

**W16. 단어 중복** (`v2EngineSwitches.ts`): `시장 근거 근거 확인 전 → …` → `시장 근거: 확인 전 → …` (근거가 이미 있는 단계명일 때 앞말 생략)

## C. 경로 조정(Changing) 문구 — 주로 EN 명령형

| # | 위치 | 현재 | 제안 |
|---|---|---|---|
| W7 | `amcProductApplicationV3.ts:352` EN | Keep your current role as your base while checking the new path against real evidence. | Your current role stays the base while the new path is checked against real evidence. |
| W7 | `amcV2Analysis.ts:935` EN | Stay in your current role and check, one small step at a time, what the new path requires. | Your current role continues while what the new path requires is checked one small step at a time. |
| W8 | `v2ReportPresentation.ts:145` KO 카드 제목 | 현재 계획을 유지하며 대안 확인 | 현재 직무를 이어 가며 대안 확인 |
| W10 | `amcProductApplicationV3.ts:355` EN | Hold off on a fixed move date until the way back is clearer. | The move date stays open until the way back is clearer. |
| W10 | `amcV2Analysis.ts:953` EN | Do not fix a date first; set the timing once a way back (now X) is confirmed. | No date is fixed first; timing is set once a way back (now X) is confirmed. |
| W14 | 대시보드·보고서 소제목 EN | Keep the goal, change how you get there | The goal stays; the way there can change |
| W15 | `v2Language.ts:274` 보고서 부제 | 무엇을 확인하고 무엇을 할지 / What to check, and what to do next | 다음에 확인할 것과 판단이 바뀌는 조건 / What to check next, and what would change the reading |
| W12 | 데모 근거 문구(`externalIntelligenceV2.ts:125,145`, 데모에서만) | 지금 소득을 지키세요 / Keep your income steady… | 실제 제안과 보상 수준을 확인하는 동안에는 소득이 이어지는지가 중요한 조건입니다. / While you collect real offers and pay information, whether your income continues is a key condition. |

## D. 외부 검색 지시문 (고객 화면이 아닌 공급자 프롬프트)

**W11.** `server/externalIntelligenceV2Service.ts` 시스템 지시의 한국어 스타일 규칙
- 현재: 한국어를 `~합니다/~하세요` 존댓말로 쓰라고만 함. 머무르기·떠나기·그만두기를 지시하지 말라는 규칙 없음.
- 제안: `~합니다` 서술형 기본, `~하세요`는 준비·확인 단계에만. `implication`·`whyItMatters`·`action`은 경력 선택지를 유지·이탈·전환·지원·포기하라고 말하지 말고 사실이 조건에 주는 의미만 서술.
- 주의: 검색 결과 문장 생성 방식이 바뀌므로 적용 시 실검색 재검증(2호출 이상) 필요. 검색 대상·출처 검증 기준은 바꾸지 않음.

## E. 실제 동작과 다른 고지 문구 (2부 §9)

| # | 위치 | 현재 | 문제 | 제안 |
|---|---|---|---|---|
| N1 | 시작 화면 방법 항목 (`AmcInteractiveV2.tsx:1107`) | 작성한 답변 원문은 저장하지 않습니다. 검색에는 검색 대상만 씁니다. / Your written answers are not stored. Only the search target is used to search. | 실제로는 지역·결정 유형·고른 주제·보기에서 고른 일부 답(고정 힌트)도 전송 | 작성한 답변 원문은 저장하지 않습니다. 검색에는 검색 대상·지역·결정 유형과 보기에서 고른 일부 답만 보냅니다. / Your written answers are not stored. Search sends only the search target, place, decision type and some of the options you picked. |
| N1 | 처리 화면 2단계 (`V2Processing.tsx:122`) | 검색 대상만으로 검색하고, … / We search with the target only, … | 같음 | 검색 대상·지역과 고른 주제로 검색하고, 인용한 페이지가 실제로 열리는지 확인합니다 / We search with the target, place and topics, then check that each cited page opens |
| N2 | 개인정보 안내 (`v2Language.ts:21`) | 공개 자료 검색은 요청할 때만 실행합니다. / Public search runs only when you ask for it. | 현재는 사실(마지막 단계 버튼). 더 분명히 | 공개 자료 검색은 마지막 단계에서 ‘공개 자료를 찾아 분석하기’를 누를 때만 실행합니다. / Public search runs only when you press ‘Search public sources and analyze’ at the last step. |
| N3 | 처리 화면 3단계 (`V2Processing.tsx:123`) | 근거를 내 조건 옆에 놓습니다. 출처는 점수를 바꾸지 않습니다 / … Sources do not change scores | 사실과 다름: 모든 주제가 확인되면 근거의 방향·신뢰도가 '시장 근거' 단계에 반영됨 | 근거를 내 조건 옆에 놓습니다. 확인된 출처는 ‘시장 근거’ 단계에만 반영되고, 내가 답한 조건은 바꾸지 않습니다 / Evidence sits next to your answers. Confirmed sources inform only the market-evidence level; they never change your own answers |
| N4 | 근거 전송 고지 (`v2Language.ts:133-134`) | KO에만 "검색 주제에는 공개된 직무·기관·산업 키워드를 사용하세요." | KO/EN 불일치 | EN에 같은 문장 추가: Use public role, institution or industry keywords as the search topic. |
| N4 | 방법 항목 제목 (`AmcInteractiveV2.tsx:1107`) | 답변 원문은 저장하지 않음 / Your words stay private | KO/EN 의미 다름 | EN: Your written answers are not stored |

참고: `V2AnalysisView.tsx:291,294`의 "공개 자료는 점수를 바꾸지 않습니다"는 목표 조직·직무 평가(0·1·2) 설명이며 사실과 맞으므로 바꾸지 않는다.

## 적용 방식

승인한 항목만 한 PR로 바꾸고, KO/EN 동시 반영, 기존 문구 테스트(금지어·KO/EN 대응) 갱신, 화면 확인 후 Preview에서 실검색 1회(2호출)로 확인한다. Production 배포는 별도 승인.
