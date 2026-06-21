# AMC Launch Readiness Checklist

## Purpose

This checklist defines what must be verified before launching the AMC Web MVP to real users.

## 1. Product Positioning

- [ ] Core message is clear:
  - [ ] EN: “AMC sees structure.”
  - [ ] KR: “AMC는 구조를 봅니다.”
- [ ] AMC is positioned as a Private Career Decision Report, not coaching.
- [ ] AMC does not promise the “right answer.”
- [ ] AMC explains structure, risk, Decision Conditions, and validation steps.
- [ ] Tone is calm, professional, and not motivational coaching.

## 2. Customer Flow

- [ ] Landing page loads correctly.
- [ ] EN/KR toggle works.
- [ ] Free Preview starts clearly.
- [ ] Preview Dashboard appears after Free Preview.
- [ ] Unlock section explains Essential and Executive clearly.
- [ ] Full Intake can be completed.
- [ ] Full Dashboard can be generated.
- [ ] Detailed PDF Report can be opened.
- [ ] Back to Dashboard works.
- [ ] 1-Day Report Q&A is explained without overpromising automation.

## 3. Free Preview

- [ ] Free Preview purpose is clear.
- [ ] Questions are understandable in EN and KR.
- [ ] Preview does not feel like the full paid report.
- [ ] Preview gives enough value to encourage unlock.
- [ ] Preview does not overclaim precision.

## 4. Full Intake

- [ ] All 29 questions are visible and understandable.
- [ ] Answer progress works.
- [ ] Generate Full Dashboard remains disabled until the intake is complete.
- [ ] EN/KR toggle preserves answers.
- [ ] Long answers do not break the layout.
- [ ] Mobile 390px layout works.

## 5. Case Type Detection

- [ ] Corporate Stay vs Exit works.
- [ ] MBA / EMBA / PhD Decision works.
- [ ] Overseas Relocation works.
- [ ] Entrepreneurship works.
- [ ] Industry Transition works.
- [ ] Role Upgrade / Downgrade works.
- [ ] Burnout-driven Decision works.
- [ ] Family Constraint-heavy Decision works.
- [ ] General Career Reconfiguration fallback works.
- [ ] Priority rules work, especially for:
  - [ ] Family Constraint-heavy Decision
  - [ ] Burnout-driven Decision

## 6. Full Web Dashboard

- [ ] Case Type appears correctly.
- [ ] Case-Specific Reading appears.
- [ ] Primary Risk is case-specific.
- [ ] Decision Conditions are case-specific.
- [ ] Validation Focus is case-specific.
- [ ] Dashboard does not feel too generic.
- [ ] Dashboard is readable in EN and KR.
- [ ] Dashboard works on desktop and 390px mobile.
- [ ] No horizontal overflow.

## 7. Premium PDF Report View

- [ ] Detailed PDF Report opens correctly.
- [ ] Report has a clear premium structure.
- [ ] Executive Summary includes case-specific reading.
- [ ] Structural Risk Diagnosis changes by case type.
- [ ] Decision Conditions change by case type.
- [ ] 30 / 60 / 90-Day Validation Plan changes by case type.
- [ ] Closing Question changes by case type.
- [ ] KR report copy is natural.
- [ ] EN report copy is clear.
- [ ] Print/save-to-PDF controls work.
- [ ] Print layout is clean.
- [ ] No clipped text.
- [ ] No horizontal overflow.

## 8. Pricing / Unlock

- [ ] Essential package is clear:
  - [ ] Full Web Dashboard + Detailed PDF Report
- [ ] Executive package is clear:
  - [ ] Full Web Dashboard + Detailed PDF Report + 1-Day Report Q&A
- [ ] 1-Day Report Q&A wording is consistent.
- [ ] MVP payment simulation is clear if real payment is not active.
- [ ] No copy implies live automated payment if it is not implemented.
- [ ] No copy implies the chatbot is fully implemented if it is still a placeholder.

## 9. QA Mode

- [ ] Normal route hides QA tools:
  - [ ] `/amc-web-mvp`
- [ ] QA route shows QA tools:
  - [ ] `/amc-web-mvp?qa=1`
- [ ] Launch QA Presets appear only in QA mode.
- [ ] QA Validation Status appears only in QA mode after preset selection.
- [ ] All six presets populate 29 / 29 answers.
- [ ] All six presets show PASS.
- [ ] QA mode does not affect the normal customer flow.

## 10. Technical QA

- [ ] Build passes:
  - [ ] `pnpm --dir manus-ui build`
- [ ] Git diff check passes:
  - [ ] `git diff --check`
- [ ] Browser console is clean.
- [ ] No horizontal overflow.
- [ ] Desktop layout works.
- [ ] 390px mobile layout works.
- [ ] EN/KR toggle works across all major sections.
- [ ] User answers persist across language switching.
- [ ] No new packages are introduced.
- [ ] No backend/API dependency is required for the current MVP demo.

## 11. Soft Launch Go / No-Go Criteria

### GO if

- [ ] Normal route works end-to-end.
- [ ] At least six QA presets pass.
- [ ] EN/KR flows are readable.
- [ ] Premium Report output feels case-specific.
- [ ] Print/save-to-PDF view is usable.
- [ ] No major layout or console issues remain.
- [ ] Payment and delivery limitations are clearly framed as an MVP/manual flow if they are not automated.

### NO-GO if

- [ ] Case Type Detection is inconsistent.
- [ ] Report feels generic across different scenarios.
- [ ] Korean copy feels awkward or literal.
- [ ] Mobile layout breaks.
- [ ] Print view clips key content.
- [ ] QA tools appear in the normal customer route.
- [ ] Any copy overpromises payment, chatbot, or automated delivery.

## 12. Next Launch Tasks

1. Run full QA using all six presets.
2. Review Premium Report output for Korean and English tone.
3. Confirm the Vercel production route.
4. Confirm the normal route hides QA tools.
5. Decide the soft-launch payment/manual-delivery approach.
6. Prepare first external test-user instructions.
7. Prepare a manual report-delivery email template if needed.
