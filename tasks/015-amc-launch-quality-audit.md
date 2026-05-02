# Task 015 — AMC launch quality audit

Goal: Audit the current AMC launch surface and identify the highest-priority product quality issues before soft launch.

Context: Codex operating loop is now stable enough. Do not spend more time on workflow automation. Shift focus back to AMC product quality, business model clarity, report quality, and launch readiness.

Scope: Create one audit document only.

Add file: docs/amc_launch_quality_audit_task_015.md

Review these areas:
- Home / landing page copy and positioning
- Intake / format / payment handoff / payment success flow
- Essential vs Executive offer clarity
- Manus handoff runbook quickstart clarity
- Current report-facing language and product tone
- AI-smell, generic consulting language, or motivational/coaching language
- Internal terminology leakage
- English-first launch residue or multilingual leftovers
- Whether the current customer-facing experience feels premium, clear, and launch-ready

Required output document structure:
- Executive summary
- Launch blockers
- Important quality issues
- Nice-to-have improvements
- Business model clarity notes
- Report quality notes
- Website / flow notes
- Manus workflow notes
- Recommended next 3 Codex tasks

Rules:
- Do not change product code.
- Do not change report generation logic.
- Do not change payloads.
- Do not change UI files.
- Do not edit existing docs except to add the new audit document.
- Keep findings specific and actionable.
- Prioritize launch impact over theoretical perfection.

Acceptance checks:
- git diff --check
- Manual read: the audit should clearly tell us what to fix next for launch quality.
