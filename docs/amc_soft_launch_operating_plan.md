# AMC Soft Launch Operating Plan

## 1. Purpose

This document defines how to run a controlled soft launch of the current AMC Web MVP.

The launch is designed to test:

- Real customer interest
- Free Preview and Full Intake completion
- Perceived value of the Full Web Dashboard and Detailed PDF Report
- Pricing acceptance for Essential and Executive
- Demand for 1-Day Report Q&A
- Operational friction before payment, delivery, and Q&A are automated

The goal is not to fully automate operations yet. AMC is ready for controlled soft-launch testing, not full public automation.

This plan governs the current `/amc-web-mvp` launch flow. Operators should not assume that payment, report delivery, or Q&A automation from another AMC workflow is available on this route.

## 2. Soft Launch Status

**Current status: CONDITIONAL GO**

This means:

- The product flow works.
- All six launch QA presets pass.
- The EN/KR flow works and preserves answers.
- Full Web Dashboard and Premium PDF Report outputs are usable.
- Manual operation is still required for payment, report delivery, and 1-Day Report Q&A.

The product can be tested with a limited group of real users if the manual operating steps and current limitations are explained clearly.

## 3. Target Test Users

### Primary users

- Experienced professionals with 10+ years of career experience
- People facing a significant career decision
- People considering:
  - Staying at or leaving a company
  - MBA, EMBA, or PhD study
  - Overseas relocation
  - Entrepreneurship
  - Industry transition
  - Role upgrade or downgrade
  - A burnout-driven career decision
  - A family constraint-heavy career decision

### Recommended first test group

- 5 to 10 trusted users
- People willing to provide candid, specific feedback
- People who understand that AMC is in a controlled MVP soft launch
- A mix of decision types, language preferences, and device usage where possible

## 4. Soft Launch User Flow

### Step 1 — Invite the user

- Share the production AMC URL.
- Explain that this is a controlled soft launch.
- Explain that payment, delivery, and Q&A may be handled manually.
- Do not share the `?qa=1` route with external users.

### Step 2 — User completes Free Preview

- The user answers the seven Free Preview questions.
- The user reviews the initial structure of the career decision.
- The user decides whether to continue to the full experience.

### Step 3 — User completes Full Intake

- The user continues to Full Intake.
- The user answers all 29 questions.
- The user generates the Full Web Dashboard.
- The user opens and reviews the Detailed PDF Report.

### Step 4 — User selects a package

- **Essential:** Full Web Dashboard + Detailed PDF Report
- **Executive:** Full Web Dashboard + Detailed PDF Report + 1-Day Report Q&A

During the current MVP, package interest may need to be confirmed directly with the operator rather than through an automated checkout.

### Step 5 — Manual payment or confirmation

Payment or test access may be handled through:

- Bank transfer
- Manual invoice
- Direct payment link
- No-charge test-user code or operator approval

Do not hard-code one payment provider into the operating plan yet. Record the method used for each tester and confirm access only after the agreed step is complete.

### Step 6 — Report delivery

- If the user can save the PDF directly, ask the user to confirm that the output was saved and is readable.
- If manual delivery is needed, the operator sends the PDF or report link by email.
- Confirm the recipient, package, language, and final report file before sending.
- Record the delivery time and any delivery issue.

### Step 7 — Executive 1-Day Report Q&A

- Offer this step only to Executive users.
- Ask the user to submit follow-up questions on the same day as report delivery.
- Answer only from the generated report and the decision structure reflected in it.
- Keep the exchange focused on report interpretation, evidence, risk, Decision Conditions, and validation steps.
- Do not expand the exchange into open-ended career coaching, therapy, or life advice.

### Step 8 — Collect feedback

- Use a consistent feedback form or interview template.
- Record confusing copy, unanswered questions, perceived value, and willingness to pay.
- Capture whether the user completed each stage and where friction occurred.
- Separate product feedback from requests for personal advice.

## 5. Package Operation

### Essential

Includes:

- Full Web Dashboard
- Detailed PDF Report
- Manual delivery support if needed

Essential is for users who want a complete structured reading of their career decision without follow-up Q&A.

### Executive

Includes:

- Full Web Dashboard
- Detailed PDF Report
- 1-Day Report Q&A
- Manual delivery support if needed

Executive is for users who want to review the report and ask report-based follow-up questions on the same day.

The Q&A must remain tied to the report. It is not broad career coaching and should not become an ongoing advisory relationship.

## 6. Manual Payment / Delivery Policy

During soft launch:

- Payment may be manual.
- Report delivery may be manual.
- 1-Day Report Q&A may be manual.
- The user must be informed clearly before payment or commitment.
- The operator must record the agreed package, price or test status, payment method, delivery method, and Q&A eligibility.

Suggested user-facing note:

**EN**

> This is a controlled soft launch. Payment, report delivery, and 1-Day Report Q&A may be handled manually during this phase.

**KR**

> 현재는 통제된 Soft Launch 단계입니다. 결제, 리포트 전달, 1-Day Report Q&A는 이 기간 동안 수동으로 운영될 수 있습니다.

## 7. First Tester Instructions

### EN

1. Open the AMC link.
2. Start Free Preview.
3. If the preview is useful, continue to Full Intake.
4. Answer all 29 questions.
5. Generate Full Dashboard.
6. Open Detailed PDF Report.
7. Choose Essential or Executive.
8. Send feedback on clarity, usefulness, and willingness to pay.

### KR

1. AMC 링크를 엽니다.
2. Free Preview를 시작합니다.
3. Preview가 유용하면 Full Intake로 계속합니다.
4. 29개 질문에 답합니다.
5. Full Dashboard를 생성합니다.
6. Detailed PDF Report를 확인합니다.
7. Essential 또는 Executive 중 적합한 방식을 선택합니다.
8. 이해도, 유용성, 지불 의향에 대한 피드백을 전달합니다.

## 8. Feedback Questions

### Product clarity

- Did you understand what AMC does?
- Was the difference between Free Preview and Full Report clear?
- Was the difference between Essential and Executive clear?

### Report value

- Did the report feel specific to your situation?
- Did the Case Type feel accurate?
- Did the Primary Risk feel useful?
- Did the Decision Conditions feel practical?
- Did the 30 / 60 / 90-Day Validation Plan feel actionable?

### UX

- Were any questions hard to answer?
- Was the Korean or English copy natural?
- Did the mobile layout work for you?
- Was the PDF report easy to save and read?

### Commercial

- Would you pay for Essential?
- Would you pay for Executive?
- What price feels reasonable?
- Would 1-Day Report Q&A increase your willingness to pay?

## 9. Operator Checklist

### Before inviting a user

- [ ] Confirm the production route works.
- [ ] Confirm the normal route hides QA tools.
- [ ] Confirm the QA route is not shared with users.
- [ ] Confirm Essential and Executive package copy is clear.
- [ ] Confirm the manual payment or test-access method.
- [ ] Confirm the manual report-delivery method.
- [ ] Confirm who will handle Executive Q&A and during what hours.
- [ ] Confirm the feedback collection method.
- [ ] Prepare a private record for package, payment, delivery, Q&A, and feedback status.

### After the user completes the flow

- [ ] Record whether the user completed Free Preview.
- [ ] Record whether the user completed Full Intake.
- [ ] Record whether the user generated Full Web Dashboard.
- [ ] Record whether the user opened or saved Detailed PDF Report.
- [ ] Record the selected package.
- [ ] Record payment or test-access status.
- [ ] Record delivery status and time.
- [ ] Record whether the user asked for Q&A.
- [ ] Record user feedback and willingness to pay.
- [ ] Record major friction points and any follow-up required.

## 10. Soft Launch Success Criteria

### Minimum success

- 5 users complete Free Preview.
- 3 users complete Full Intake.
- 2 users review Detailed PDF Report.
- At least 1 user expresses willingness to pay.

### Strong signal

- Users say the report feels specific to their situation.
- Users understand Case Type and Decision Conditions.
- Users ask meaningful report-based follow-up questions.
- Users show willingness to pay for Executive.

### Red flags

- Users do not understand the service.
- Users consistently stop before Full Intake.
- The report feels generic.
- Case Type feels wrong.
- Korean copy feels awkward.
- Users expect coaching instead of report interpretation.
- Manual payment or delivery creates confusion.
- Operators cannot reliably track package, payment, delivery, or Q&A status.

## 11. Soft Launch Boundaries

- AMC does not decide for the user.
- AMC does not promise or guarantee career outcomes.
- AMC does not provide immigration, legal, tax, medical, or financial advice.
- AMC provides structured career decision interpretation.
- Q&A is report-based, time-limited, and focused on clarifying the report.
- Operators should not recommend a choice as the correct or best answer.
- Sensitive user information and report files should be shared only through the agreed private channel.

## 12. Next Actions

1. Confirm the production route.
2. Prepare the first tester invitation message.
3. Prepare a manual payment or test-access option.
4. Prepare a manual report-delivery email.
5. Prepare a feedback form or feedback template.
6. Run the first five-user controlled soft launch.
7. Review results and decide whether to automate payment, delivery, and Q&A.
