# Task 019 — Soft launch QA gate

Goal: Create a practical soft-launch QA gate for AMC before limited customer launch.

Context: The three launch-surface blockers from Task 015 have been addressed: English-first launch copy, Essential vs Executive offer clarity, and payment handoff premium tone. The next step is to verify the full soft-launch experience as an operator-led premium report service.

Scope: Add one QA gate document only.

Add file: docs/amc_soft_launch_qa_gate_task_019.md

Review these areas:
- Home / Intake / FormatHandoff / PaymentHandoff / PaymentSuccess flow
- Essential vs Executive customer-facing clarity
- English-first launch consistency
- Report generation readiness for single and comparative cases
- PDF generation readiness
- Email delivery readiness
- Manus handoff readiness and premium report quality control
- Internal terminology leakage
- AI-smell / coaching / recommendation language risk
- Operator-led soft launch steps

Required output document structure:
- Executive summary
- Soft launch readiness verdict
- Launch blockers remaining
- Required QA checklist
- Single-case report QA
- Comparative report QA
- Manus rendering QA
- Email delivery QA
- Payment / handoff QA
- Essential vs Executive QA
- Internal terminology and tone QA
- Operator run sequence
- Go / hold criteria for limited soft launch
- Recommended next 3 tasks

Rules:
- Do not change product code.
- Do not change report generation logic.
- Do not change payment logic.
- Do not change email logic.
- Do not change payloads or templates.
- Do not edit existing docs except to add the new QA gate document.
- Keep the QA gate practical, not theoretical.
- Prioritize launch readiness and report quality consistency.

Acceptance checks:
- git diff --check
- Manual read check: The document should tell an operator exactly what must pass before AMC can be shown to a limited first customer.
