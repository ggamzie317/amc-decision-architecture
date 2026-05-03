# Task 020 — Soft-launch dry-run evidence pack

Goal: Create a soft-launch dry-run evidence pack for AMC using the QA gate from Task 019.

Context: Task 019 defined AMC as CONDITIONAL GO pending full gate execution. This task should create a practical evidence document that records whether AMC can pass a limited first-customer launch dry run.

Scope: Add one evidence pack document only, unless a tiny docs-only reference update is strictly necessary.

Add file: docs/amc_soft_launch_dry_run_evidence_task_020.md

Use the QA criteria from:
- docs/amc_soft_launch_qa_gate_task_019.md

Evidence pack must cover:
- Current repo/build status
- Home -> Intake -> FormatHandoff -> PaymentHandoff -> PaymentSuccess flow status
- Essential vs Executive tier-boundary status
- English-first launch status
- Single-case report generation status
- Comparative-case report generation status
- PDF output status
- Receipt email status
- Report-delivery email status
- Ops-protected trigger status
- Manus handoff package status
- Manus output quality status
- Internal terminology / AI-smell / recommendation-language status
- Known blockers
- Final dry-run verdict

Required output document structure:
- Executive summary
- Dry-run verdict
- Evidence table
- Commands run
- Single-case trace
- Comparative-case trace
- PDF evidence
- Email delivery evidence
- Manus evidence
- Customer-flow evidence
- Tier-boundary evidence
- Terminology and tone evidence
- Blockers / risks
- Launch decision recommendation: Go / Hold / Go with manual controls
- Next required action

Rules:
- Do not change product code.
- Do not change report generation logic.
- Do not change payment logic.
- Do not change email logic.
- Do not change payloads or templates.
- Do not edit existing docs except to add the evidence document if possible.
- Keep the evidence practical and operator-readable.
- Where secrets or live delivery are required, include a clear placeholder for operator confirmation rather than inventing results.
- Do not claim a pass unless the command or operator evidence supports it.

Acceptance checks:
- git diff --check
- Manual read check: The evidence pack should make it clear what has actually passed, what still needs operator confirmation, and whether AMC is ready for limited first-customer launch.
