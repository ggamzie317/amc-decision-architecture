# AMC Launch QA Sample Scenarios

## Purpose

These scenarios are used to test whether the AMC Web MVP correctly handles realistic career decision cases across:

- Case Type Detection
- Full Web Dashboard
- Case-Specific Reading
- Premium PDF Report
- EN/KR toggle behavior
- Print/save-to-PDF layout
- Desktop and 390px mobile layout

## 1. Corporate Stay vs Exit

### Short profile

- Mid-career corporate professional
- 15+ years at a large company
- Considering whether to stay, move internally, or leave

### Example keywords to include in intake answers

- Current company
- Corporate career
- Stay
- Internal move
- Resignation
- Exit
- 현 직장
- 대기업
- 조직 내 경력
- 잔류
- 퇴사
- 이직

### Expected case type

`Corporate Stay vs Exit`

### Expected dashboard behavior

- Case Type displays `Corporate Stay vs Exit`.
- The dashboard does not frame the issue as a simple resignation decision.
- Case-Specific Reading tests whether the current role or organization can still create future career value.
- Primary Risk identifies premature binary stay-or-exit framing.
- Decision Conditions address evidence for the next path, its pull, and sufficient Safety Margin.
- Validation Focus tests whether the current role can be redesigned before exit is treated as the only solution.

### Expected premium report behavior

- Executive Summary reads the case as a stay-or-exit structure.
- Structural Risk Diagnosis uses `Binary Stay-or-Exit Framing`.
- Decision Conditions compare current-role redesign with evidence supporting the next path.
- The 30 / 60 / 90-Day Validation Plan tests role redesign, next-path evidence, and exit conditions.
- Closing Reflection asks what would prove that exit creates more career value than redesign.

### EN/KR QA notes

- Case type and framework labels remain English in both modes.
- EN mode uses concise English interpretation.
- KR mode explains organizational value, role redesign, evidence, and stability in natural Korean.
- User-entered company, role, and option names remain unchanged after switching languages.

### Mobile / print QA notes

- Long organization and role names wrap without clipping at 390px.
- Case-Specific Reading cards remain readable in a single-column mobile layout.
- Report risk labels and Decision Conditions wrap cleanly in print.
- No horizontal overflow appears in the dashboard or report.

## 2. MBA / EMBA / PhD Decision

### Short profile

- Experienced professional considering an EMBA or PhD
- Interested in long-term positioning, research, network, and global mobility

### Example keywords to include in intake answers

- MBA
- EMBA
- PhD
- Doctoral program
- Graduate school
- Research
- Academic path
- 박사
- 석사
- 학위
- 대학원
- 연구자
- 유학

### Expected case type

`MBA / EMBA / PhD Decision`

### Expected dashboard behavior

- Case Type displays `MBA / EMBA / PhD Decision`.
- The dashboard does not treat the degree itself as the answer.
- Primary Risk addresses `Degree-as-Answer Bias`.
- Decision Conditions test positioning value, research access, network, credibility, and mobility.
- Validation Focus separates intellectual interest from time cost, opportunity risk, and career positioning value.

### Expected premium report behavior

- Executive Summary discusses positioning value, time cost, and opportunity risk.
- Structural Risk Diagnosis uses `Degree-as-Answer Bias`.
- Decision Conditions require differentiated access to research, network, credibility, or mobility.
- The 30 / 60 / 90-Day Validation Plan includes degree purpose, program fit, network value, alternatives, and investment logic.
- Closing Reflection asks what would make the degree a strategic investment rather than a delay.

### EN/KR QA notes

- The case type remains English in both modes.
- KR copy uses natural terms for 학위, 포지셔닝, 기회비용, 연구 접근성, and 이동 가능성.
- Switching EN/KR does not translate or overwrite program names entered by the user.
- The interpretation remains structural rather than motivational or recommendation-driven.

### Mobile / print QA notes

- `MBA / EMBA / PhD Decision` wraps cleanly on mobile and the report cover.
- Long program names do not clip dashboard cards or report fields.
- Timeline content remains legible at 390px and in A4 output.
- No horizontal overflow appears.

## 3. Overseas Relocation

### Short profile

- Professional considering a move to Singapore, the US, Korea, or China
- Career upside exists, but visa, family, and financial constraints matter

### Example keywords to include in intake answers

- Relocation
- Move abroad
- Overseas assignment
- Visa
- Immigration
- Singapore
- US
- Korea
- China
- 해외 이동
- 해외 근무
- 이주
- 비자
- 주재원
- 해외 커리어

### Expected case type

`Overseas Relocation`

### Expected dashboard behavior

- Case Type displays `Overseas Relocation`.
- Case-Specific Reading discusses career optionality and operating constraints together.
- Primary Risk addresses overestimating upside while underestimating visa, family, financial, and local-market constraints.
- Decision Conditions require workable local demand, visa feasibility, family fit, and income stability.
- Validation Focus tests feasibility before commitment increases.

### Expected premium report behavior

- Executive Summary reads the case as a relocation and optionality question.
- Structural Risk Diagnosis uses `Relocation Upside Bias`.
- Decision Conditions include local role access, visa and family logistics, and financial resilience.
- The 30 / 60 / 90-Day Validation Plan maps constraints, tests local fit, and defines relocation conditions.
- Closing Reflection asks what must be true for relocation to expand optionality without making the operating base too fragile.

### EN/KR QA notes

- Country, company, and city names remain exactly as entered.
- KR copy naturally explains 비자, 가족, 재정, 현지 시장, and 선택지.
- EN/KR switching preserves relocation details and option names.
- The interpretation does not assume relocation is inherently positive.

### Mobile / print QA notes

- Country lists and long location names wrap cleanly.
- Constraint-heavy Korean paragraphs remain readable on 390px mobile.
- Report tables and timeline sections do not create horizontal overflow.
- A4 print output keeps Case Type, risk, and conditions legible.

## 4. Entrepreneurship

### Short profile

- Corporate professional considering a startup, consulting practice, or independent advisory business
- Has strong motivation but limited paying-customer validation

### Example keywords to include in intake answers

- Startup
- Founder
- Venture
- Business launch
- Consulting business
- Independent advisory
- Paying customers
- 창업
- 사업
- 스타트업
- 독립
- 자문 사업
- 컨설팅 사업

### Expected case type

`Entrepreneurship`

### Expected dashboard behavior

- Case Type displays `Entrepreneurship`.
- Case-Specific Reading separates founder motivation from market validation.
- Primary Risk addresses demand and repeatable execution capacity.
- Decision Conditions mention paying demand, delivery capacity, pricing, and income runway.
- Validation Focus requires testing willingness to pay before commitment increases.

### Expected premium report behavior

- Executive Summary reads the case as an entrepreneurship validation problem.
- Structural Risk Diagnosis uses `Founder Motivation vs Market Validation`.
- Decision Conditions require paying demand, repeatable delivery, and protected income runway.
- The 30 / 60 / 90-Day Validation Plan includes offer definition, target-user clarity, paid-demand testing, and commitment-level review.
- Closing Reflection asks what evidence would prove that the decision is more than founder motivation.

### EN/KR QA notes

- `Entrepreneurship` and framework labels remain English.
- KR copy distinguishes 창업 의지, 지불 수요, 제공 역량, 가격, and 소득 안정성.
- User-entered business names, offer descriptions, and customer terms remain unchanged.
- Language remains analytical rather than promotional.

### Mobile / print QA notes

- Offer and customer descriptions wrap without clipping.
- Case-Specific Reading remains compact at 390px.
- The three Decision Conditions and timeline steps remain readable in print.
- No horizontal overflow appears.

## 5. Burnout-driven Decision

### Short profile

- Professional experiencing fatigue, stress, low energy, or a desire to escape the current role
- Considering a career transition mainly because current work feels exhausting

### Example keywords to include in intake answers

- Burnout
- Fatigue
- Exhaustion
- Stress
- Low energy
- Escape
- Recovery
- 번아웃
- 피로
- 지침
- 스트레스
- 회피
- 쉬고 싶음

### Expected case type

`Burnout-driven Decision`

### Expected dashboard behavior

- Case Type displays `Burnout-driven Decision`.
- Primary Risk does not treat fatigue as proof of transition readiness.
- Case-Specific Reading separates recovery needs from career redesign needs.
- Decision Conditions distinguish recovery, market validation, execution capacity, and financial safety.
- Validation Focus identifies what requires recovery and what requires structural career change.

### Expected premium report behavior

- Executive Summary reads the case as a fatigue and transition-readiness question.
- Structural Risk Diagnosis uses `Fatigue-Driven Urgency`.
- Decision Conditions protect recovery, evidence quality, execution capacity, and financial stability.
- The 30 / 60 / 90-Day Validation Plan separates recovery needs, tests energy after workload or boundary changes, and reassesses transition need.
- Closing Reflection asks what would still need to change if energy recovered.

### EN/KR QA notes

- The interpretation remains calm and non-clinical.
- KR copy clearly distinguishes 회복, 피로, 전환 준비도, and 커리어 재설계.
- EN/KR switching preserves the user's description of workload, boundaries, and energy.
- No copy presents career transition as an automatic solution to burnout.

### Mobile / print QA notes

- Longer Korean risk explanations wrap cleanly at 390px.
- Risk cards do not clip `Fatigue-Driven Urgency`.
- Timeline content remains readable in A4 print.
- No horizontal overflow appears.

## 6. Family Constraint-heavy Decision

### Short profile

- Career decision strongly affected by spouse, children, parents, school, location, or family timing
- Preferred career path may be attractive but difficult to execute under family constraints

### Example keywords to include in intake answers

- Family
- Spouse
- Children
- Parents
- Childcare
- School
- Family location
- Timing
- 가족
- 배우자
- 아이
- 자녀
- 부모
- 육아
- 학교
- 가족 사정

### Expected case type

`Family Constraint-heavy Decision`

### Expected dashboard behavior

- Priority logic surfaces `Family Constraint-heavy Decision` over lower-priority matching signals.
- Case-Specific Reading tests whether the path works within family, location, timing, and financial constraints.
- Primary Risk addresses professionally attractive options that fail under family reality.
- Decision Conditions mention realistic support systems, family logistics, timing, and financial stability.
- Validation Focus tests the decision against family operations before treating career upside as sufficient.

### Expected premium report behavior

- Executive Summary reads the case as a family-constraint decision architecture.
- Structural Risk Diagnosis uses `Career-Family Fit Risk`.
- Decision Conditions require family and location fit, resilient finances, and realistic support.
- The 30 / 60 / 90-Day Validation Plan maps family constraints, tests path feasibility, and decides whether to proceed, delay, or redesign.
- Closing Reflection asks what must be true for the path to work within family reality.

### EN/KR QA notes

- The case type remains English in both modes.
- KR copy naturally handles 가족, 지역, 시기, 재정, 지원 체계, and 생활 조건.
- User-entered family details and locations persist after switching languages.
- If burnout, relocation, or another case signal also appears, the family-priority rule remains visible.

### Mobile / print QA notes

- Long family and location descriptions wrap without clipping.
- Dashboard cards remain readable as a single column at 390px.
- Report conditions and timeline items remain compact and legible in print.
- No horizontal overflow appears.

## Global QA Checklist

- [ ] `/amc-web-mvp` loads correctly.
- [ ] EN/KR toggle works.
- [ ] User answers persist after language switching.
- [ ] Full Intake can be completed.
- [ ] Case Type appears in the dashboard.
- [ ] Case-Specific Reading appears in the dashboard.
- [ ] Premium PDF Report opens correctly.
- [ ] Premium PDF Report shows case-specific interpretation.
- [ ] Print/save-to-PDF view remains clean.
- [ ] Desktop layout works.
- [ ] 390px mobile layout works.
- [ ] No horizontal overflow appears.
- [ ] No console errors occur.
- [ ] No backend or API dependency is required for the MVP demo.

## Verification Notes

- This file defines launch QA scenarios only.
- No application behavior, styling, dependency, backend, scoring, payment, chatbot, authentication, email, or document-generation logic should change as part of this task.
- Run `pnpm --dir manus-ui build`.
- Run `git diff --check`.
