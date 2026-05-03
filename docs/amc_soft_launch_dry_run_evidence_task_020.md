# AMC Soft-Launch Dry-Run Evidence Pack (Task 020)

## Executive summary

This document records dry-run evidence against `docs/amc_soft_launch_qa_gate_task_019.md` for a limited first-customer launch decision. It is intentionally strict: checks are marked as passed only when command output or operator-confirmed evidence exists.

Status legend:

- `PASS`: supported by command output or explicit operator confirmation.
- `NEEDS OPERATOR CONFIRMATION`: cannot be validated from repository state alone (secrets/live delivery/runtime UI session required).
- `NOT RUN IN THIS PACK`: step was not executed during this evidence pass.

## Dry-run verdict

Current dry-run verdict: **GO WITH MANUAL CONTROLS (PENDING OPERATOR CONFIRMATION)**.

Interpretation:

- Documentation and launch-governance alignment are in place.
- Live delivery and runtime checks still require operator execution with environment secrets and active services.

## Evidence table

| Area | Status | Evidence |
| --- | --- | --- |
| QA gate definition exists | PASS | `docs/amc_soft_launch_qa_gate_task_019.md` present with pass/fail criteria. |
| Customer flow copy hardening (Home->Success) | PASS | Task 016/017/018 updates align English-first, tier boundary, and premium handoff tone. |
| Essential vs Executive boundary wording | PASS | Customer-facing copy now defines report-only vs bounded 7-day interpretation window. |
| English-first launch consistency (customer-facing launch copy) | PASS | Landing copy/docs updated in Task 016 to English-first phrasing. |
| Single-case report generation runtime | NEEDS OPERATOR CONFIRMATION | Requires run evidence from render command and output artifact check. |
| Comparative report generation runtime | NEEDS OPERATOR CONFIRMATION | Requires run evidence from comparative render command and output artifact check. |
| PDF output path readiness | NEEDS OPERATOR CONFIRMATION | Ops runbook defines PDF delivery; requires live trigger confirmation. |
| Receipt email delivery | NEEDS OPERATOR CONFIRMATION | Requires live `/api/submissions/receipt` test with mail path available. |
| Report-delivery email | NEEDS OPERATOR CONFIRMATION | Requires ops trigger with `AMC_OPS_SECRET` and positive delivery state. |
| Ops-protected trigger behavior | NEEDS OPERATOR CONFIRMATION | Requires validation of success with valid secret + fail-closed with invalid/missing secret. |
| Manus handoff package readiness | PASS | `docs/amc_manus_handoff_package_runbook.md` and fixed workflow doc are present and aligned. |
| Manus output quality for target case | NEEDS OPERATOR CONFIRMATION | Requires actual Manus render artifact review against fixed workflow checklist. |
| Terminology/tone guardrails | PASS | Governance docs explicitly ban recommendation/drift terms and define required visible terms. |

## Commands run

Commands executed for this evidence pack preparation:

```bash
sed -n '1,260p' docs/amc_soft_launch_qa_gate_task_019.md
sed -n '1,260p' docs/amc_soft_launch_ops_runbook.md
sed -n '1,260p' docs/amc_web_launch_qa_checklist.md
```

Operator-run commands required to complete dry-run verification:

```bash
# Build/runtime sanity
cd manus-ui
pnpm build
pnpm exec tsx server/index.ts

# Single-case report render
cd ..
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --strict-undeclared

# Comparative-case report render
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --comparative --strict-undeclared

# Receipt path (example)
curl -X POST http://localhost:3000/api/submissions/receipt \
  -H "Content-Type: application/json" \
  --data-binary @manus-ui/server/fixtures/amc_submission_handoff_single_example.json

# Report delivery trigger (example)
curl -X POST http://localhost:3000/api/submissions/report-delivery \
  -H "Content-Type: application/json" \
  -H "x-amc-ops-secret: $AMC_OPS_SECRET" \
  -d '{"submissionId":"<submission_id>","sendEmail":true}'
```

## Single-case trace

Observed in this pack:

- QA criteria source exists (`docs/amc_soft_launch_qa_gate_task_019.md`).
- Doctrine and section rules for single-case are defined (`External Snapshot` primary).

Still required from operator:

- Run single-case render command.
- Confirm generated output artifact(s).
- Confirm single-case section emphasis and terminology on final deliverable.

## Comparative-case trace

Observed in this pack:

- Comparative rules are documented (table-first, `External Comparative Snapshot` primary).

Still required from operator:

- Run comparative render command.
- Confirm generated output artifact(s).
- Confirm table-first comparative output in final deliverable.

## PDF evidence

Observed in this pack:

- Soft-launch ops runbook defines PDF as default report delivery attachment.

Still required from operator:

- Confirm report-delivery email includes expected PDF attachment for one single and one comparative submission.

## Email delivery evidence

Observed in this pack:

- Receipt and report-delivery endpoint paths are documented.
- Delivery status taxonomy is documented (`report_email_sent`, `report_email_failed`, etc.).

Still required from operator:

- Confirm receipt email success on submit path.
- Confirm report-delivery email success on ops trigger path.
- Record submission IDs, timestamps, and resulting delivery statuses.

## Manus evidence

Observed in this pack:

- Fixed renderer governance is documented.
- Handoff package and quickstart prompt instructions are documented.

Still required from operator:

- Execute one Manus handoff cycle (single or comparative).
- Attach operator notes on whether output passed terminology, section-mode, and tone checks.

## Customer-flow evidence

Observed in this pack:

- Landing and flow copy has been hardened for English-first launch, tier clarity, and premium handoff tone (Tasks 016-018).

Still required from operator:

- Manual runtime walkthrough:
  - Home -> Intake -> FormatHandoff -> PaymentHandoff -> PaymentSuccess
  - Direct entry/refresh resilience checks
  - Confirmation that no false-success states appear.

## Tier-boundary evidence

Observed in this pack:

- Essential is defined as report-only structured decision brief delivery.
- Executive is defined as report + bounded 7-day report-linked interpretation window.
- Executive non-coaching boundary is explicitly stated.

Still required from operator:

- Confirm tier text appears consistently in live flow (format, handoff, success).

## Terminology and tone evidence

Observed in this pack:

- Required terms and banned terms are documented in governance and Manus workflow docs.
- Recommendation/coaching drift is explicitly prohibited.

Still required from operator:

- Final human read on generated customer-facing report output for AI-smell, coaching tone, or recommendation leakage.

## Blockers / risks

Blockers if unresolved:

- Missing live confirmation of receipt/report-delivery email paths.
- Missing runtime confirmation of single/comparative output generation and quality.
- Missing ops-secret protection checks in active runtime.

Operational risk:

- Launch decision made without timestamped operator evidence could create false confidence in delivery readiness.

## Launch decision recommendation: Go / Hold / Go with manual controls

Recommended decision now: **GO WITH MANUAL CONTROLS**.

Condition for this recommendation:

- Operator completes and records all `NEEDS OPERATOR CONFIRMATION` items before first limited customer invite.

If any blocker fails during operator run:

- Move to **HOLD** until corrected and re-verified.

## Next required action

Execute a single operator session that captures:

1. Build/server startup result.
2. One single-case end-to-end trace (submit -> receipt -> report delivery).
3. One comparative-case end-to-end trace (submit -> receipt -> report delivery).
4. One Manus render QA check against fixed workflow criteria.
5. Timestamped final gate sign-off against Task 019 checklist.
