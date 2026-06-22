# AMC Launch Readiness QA Pass

## 1. Summary

- **QA date:** June 22, 2026
- **Scope:** Local AMC Web MVP soft-launch readiness review using the normal customer route, QA-only route, six launch presets, EN/KR switching, Full Web Dashboard, Premium PDF Report, desktop layout, and 390px mobile layout.
- **Routes tested:**
  - `http://127.0.0.1:3000/amc-web-mvp`
  - `http://127.0.0.1:3000/amc-web-mvp?qa=1`
- **Overall status:** **CONDITIONAL GO**

The core Web MVP flow passed local QA. All six launch presets completed 29 / 29 answers, matched their expected Case Type, and returned PASS. Dashboard and Premium Report outputs opened for every preset, case-specific report sections changed by scenario, EN/KR switching preserved answers, and no horizontal overflow or browser console errors were observed.

The status remains CONDITIONAL GO because real payment, automated report delivery, and automated 1-Day Report Q&A handling are not active. A controlled soft launch is supportable if those steps are handled manually and communicated clearly.

## 2. Tested Routes

| Route | Expected behavior | Observed behavior | Result |
| --- | --- | --- | --- |
| `http://127.0.0.1:3000/amc-web-mvp` | Customer flow loads and all QA-only controls remain hidden. | Landing and staged customer flow loaded. Launch QA Presets and QA Validation Status were not present. | PASS |
| `http://127.0.0.1:3000/amc-web-mvp?qa=1` | Launch QA Presets appear; QA Validation Status appears only after preset selection. | Six preset controls appeared. Validation status was absent before selection and appeared after selection. | PASS |

## 3. QA Preset Results

| Preset | Expected Case Type | Detected Case Type | Answers | Status | Dashboard | Premium Report | EN/KR | Mobile | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Corporate Stay vs Exit | Corporate Stay vs Exit | Corporate Stay vs Exit | 29 / 29 | PASS | PASS | PASS | PASS | PASS | Report used Binary Stay-or-Exit Framing and a role-redesign validation plan. |
| MBA / EMBA / PhD Decision | MBA / EMBA / PhD Decision | MBA / EMBA / PhD Decision | 29 / 29 | PASS | PASS | PASS | PASS | PASS | Preset control is labeled `MBA / EMBA / PhD`; report used Degree-as-Answer Bias and degree-purpose validation. |
| Overseas Relocation | Overseas Relocation | Overseas Relocation | 29 / 29 | PASS | PASS | PASS | PASS | PASS | Report used Relocation Upside Bias and tested visa, family, financial, and local-demand constraints. |
| Entrepreneurship | Entrepreneurship | Entrepreneurship | 29 / 29 | PASS | PASS | PASS | PASS | PASS | Report separated founder motivation from market validation and tested paying demand. |
| Burnout-driven Decision | Burnout-driven Decision | Burnout-driven Decision | 29 / 29 | PASS | PASS | PASS | PASS | PASS | Preset control is labeled `Burnout-driven`; report used Fatigue-Driven Urgency and separated recovery from transition readiness. |
| Family Constraint-heavy Decision | Family Constraint-heavy Decision | Family Constraint-heavy Decision | 29 / 29 | PASS | PASS | PASS | PASS | PASS | Preset control is labeled `Family Constraint-heavy`; family constraints correctly took priority and shaped the validation plan. |

For every preset:

- Selected Preset, Expected Case Type, Detected Case Type, Answer Completion, and Status rendered in QA Validation Status.
- Expected and detected Case Type matched.
- Full Web Dashboard generated successfully.
- Detailed PDF Report opened and returned to the dashboard successfully.
- EN/KR switching retained the populated intake answers.
- Dashboard and report remained within the 390px viewport without horizontal overflow.

## 4. Customer Flow QA

| Check | Result | Evidence |
| --- | --- | --- |
| Landing loads | PASS | Core message and primary CTA rendered on the normal route. |
| EN/KR toggle works | PASS | Landing and flow copy switched between EN and KR. |
| Free Preview starts | PASS | Start Free Preview opened the seven-question intake. |
| Preview Dashboard appears | PASS | Preview Dashboard rendered after the required preview answers were supplied. |
| Unlock section is clear | PASS | Essential and Executive contents, Full Intake continuation, and payment-simulation notice were visible. |
| Full Intake can be completed | PASS | Sample answers and each QA preset populated the full 29-question intake. |
| Full Dashboard generates | PASS | The button remained disabled before completion and enabled after completion. |
| Detailed PDF Report opens | PASS | Dedicated report view opened from the generated dashboard. |
| Back to Dashboard works | PASS | The report control returned to the Full Web Dashboard. |
| 1-Day Report Q&A wording is visible and does not overpromise automation | PASS | The offer remained framed as part of the Executive flow; the page also states that chatbot and automated delivery are not implemented. |

## 5. Report Quality QA

| Check | Result | Evidence |
| --- | --- | --- |
| Case Type appears | PASS | The detected Case Type appeared in dashboard and report output for all six presets. |
| Case-Specific Reading appears | PASS | The dashboard rendered the Case-Specific Reading section for every preset. |
| Primary Risk changes by case type | PASS | Observed distinct risks including Binary Stay-or-Exit Framing, Degree-as-Answer Bias, Relocation Upside Bias, Founder Motivation vs Market Validation, Fatigue-Driven Urgency, and Career-Family Fit Risk. |
| Decision Conditions change by case type | PASS | Each preset produced scenario-specific conditions. |
| Validation Focus changes by case type | PASS | Validation Focus rendered in each case-specific dashboard. |
| Premium Report Executive Summary is case-specific | PASS | Executive Summary included the selected Case Type interpretation. |
| Structural Risk Diagnosis is case-specific | PASS | Distinct primary risk diagnosis appeared for each preset. |
| 30 / 60 / 90-Day Validation Plan is case-specific | PASS | Plans changed across role redesign, degree purpose, relocation constraints, paid demand, recovery needs, and family constraints. |
| Closing Question is case-specific | PASS | Closing Reflection questions changed for each preset. |
| KR copy is readable | PASS | Korean interpretation rendered with English framework labels retained; no overflow was observed. |
| EN copy is readable | PASS | English interpretation and framework hierarchy remained clear. |
| Report does not feel generic | PASS | Risk, conditions, timeline actions, and closing questions materially changed by case type. |

## 6. Technical QA

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm --dir manus-ui build` passes | PASS | Production build completed successfully on June 22, 2026. |
| `git diff --check` passes | PASS | No whitespace errors were reported. |
| Browser console clean | PASS | No browser console errors were captured during the tested flow. |
| No horizontal overflow | PASS | Document width matched viewport width on desktop and 390px mobile across tested dashboard and report views. |
| Desktop layout works | PASS | Normal route and staged flow rendered at the default 1280px viewport. |
| 390px mobile layout works | PASS | All six preset dashboards and reports remained within the 390px viewport. |
| Print/save-to-PDF controls work | PASS | Report control rendered in EN and KR, is wired to `window.print()`, and print-specific CSS is present. |
| QA tools hidden on normal route | PASS | Neither Launch QA Presets nor QA Validation Status appeared. |
| QA tools visible only on `?qa=1` | PASS | Presets appeared only on the QA route; status appeared after selection. |
| No backend/API dependency required for MVP demo | PASS | The tested flow used local UI state and completed without backend or external API calls. |

## 7. Known Limitations

- Real payment is not active yet.
- Report delivery is not automated yet.
- 1-Day Report Q&A is represented in the flow but is not fully automated.
- External user onboarding instructions are not finalized yet.
- A manual soft-launch process may be required before payment, delivery, and Q&A are automated.
- Production deployment behavior was not part of this local QA pass and must be verified separately.

## 8. Soft Launch Decision

**CONDITIONAL GO**

AMC Web MVP is conditionally ready for controlled soft launch testing. Core customer flow, EN/KR behavior, Case Type Detection, dashboard interpretation, Premium Report interpretation, QA mode, and mobile layout are working. Payment, delivery, and Q&A remain manual or simulated and must be clearly managed during soft launch.

This decision applies to controlled testing with a limited number of external users. It is not approval for an unattended, fully automated commercial launch.

## 9. Next Actions

1. Confirm the Vercel production route.
2. Run the same QA pass on production.
3. Decide the manual payment and report-delivery process.
4. Prepare first external tester instructions.
5. Prepare a manual report-delivery email.
6. Prepare a feedback collection method.
7. Decide whether to hide or keep MVP simulation copy.
