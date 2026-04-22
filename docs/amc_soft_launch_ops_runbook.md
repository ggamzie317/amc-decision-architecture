# AMC Soft-Launch Ops Runbook

## A) Purpose And Current Soft-Launch Model
- AMC is running an invite-only soft launch.
- Client flow is English-only.
- Current service flow is: case submit -> immediate receipt email -> operator-triggered report delivery email.
- Delivery promise for the report email is within 3 hours of submission.

## B) Required Environment
Required for current soft-launch flow:
- `AMC_EMAIL_FROM`: sender address used for receipt and report-delivery emails.
- `AMC_OPS_SECRET`: shared secret required for ops-only report-delivery endpoints.

Optional:
- `AMC_SENDMAIL_PATH`: sendmail binary path (default: `/usr/sbin/sendmail`).

Runtime requirements:
- `sendmail` must exist and be executable at `AMC_SENDMAIL_PATH` (or default path).
- If `AMC_OPS_SECRET` is missing, ops delivery endpoints fail closed.

## C) Customer-Facing Flow
- Home -> Intake -> FormatHandoff -> Submit AMC Case -> Success.
- Submit action calls `POST /api/submissions/receipt`.
- Receipt email is sent immediately on successful submit.
- Report-delivery email defaults to a PDF attachment (`AMC_Report.pdf`).
- DOCX remains an internal intermediate artifact for render/export and QA traceability.

## D) Ops-Only Flow
Protected endpoints:
- `POST /api/submissions/report-delivery`
- `POST /api/submissions/report-delivery/trigger`

Protection model:
- Header: `x-amc-ops-secret`
- Value must exactly match `AMC_OPS_SECRET`.
- Missing `AMC_OPS_SECRET` in runtime: endpoint returns `403` (disabled/fail-closed).
- Missing or wrong header secret: endpoint returns `401`.

Trigger modes:
- Single submission delivery: pass `submissionId`.
- Batch delivery: process pending submissions from `output/submissions/*`.

## E) Command Examples
Start server:
```bash
cd manus-ui
pnpm exec tsx server/index.ts
```

Single report-delivery trigger:
```bash
curl -X POST http://localhost:3000/api/submissions/report-delivery \
  -H "Content-Type: application/json" \
  -H "x-amc-ops-secret: $AMC_OPS_SECRET" \
  -d '{"submissionId":"<submission_id>","sendEmail":true}'
```

Batch report-delivery trigger:
```bash
curl -X POST http://localhost:3000/api/submissions/report-delivery/trigger \
  -H "Content-Type: application/json" \
  -H "x-amc-ops-secret: $AMC_OPS_SECRET" \
  -d '{"limit":20}'
```

Single submission via trigger endpoint:
```bash
curl -X POST http://localhost:3000/api/submissions/report-delivery/trigger \
  -H "Content-Type: application/json" \
  -H "x-amc-ops-secret: $AMC_OPS_SECRET" \
  -d '{"submissionId":"<submission_id>"}'
```

## F) Delivery States And Meanings
- `report_email_sent`: report generated and report email sent.
- `already_delivered`: delivery already completed earlier; duplicate send skipped.
- `report_prepared_for_delivery`: report generated/handoff prepared, email not sent (`sendEmail=false`).
- `not_ready`: no valid submission handoff found for delivery.
- `invalid`: submission data is invalid or required recipient email missing.
- `generation_failed`: report generation failed.
- `report_email_failed`: report generated but delivery email send failed.

## G) Soft-Launch Operator Checklist
- [ ] `AMC_EMAIL_FROM` is set.
- [ ] `AMC_OPS_SECRET` is set.
- [ ] `sendmail` is available at `AMC_SENDMAIL_PATH` (or `/usr/sbin/sendmail`).
- [ ] Server is running.
- [ ] Submit path sends receipt email successfully (`/api/submissions/receipt`).
- [ ] Ops trigger path sends report delivery email successfully.
- [ ] Ops process is in place to trigger report delivery within 3 hours.

## H) Final Preflight And Cron Attachment Plan
Preflight (before starting server):
- [ ] Confirm env values are exported: `AMC_EMAIL_FROM`, `AMC_OPS_SECRET`, and optional `AMC_SENDMAIL_PATH`.
- [ ] Confirm sendmail binary exists and is executable at the configured path.
- [ ] Confirm protected-header value is available to operator/cron: `x-amc-ops-secret: $AMC_OPS_SECRET`.

Preflight validation (after server start):
- [ ] Run one invite-only submit and confirm receipt email is sent immediately (`status: case_received`).
- [ ] Run one report-delivery trigger for that submission and confirm `status: report_email_sent`.

Minimal cron attachment (next step):
- Recommended cadence: every 10 minutes (15 minutes is also acceptable for lower volume).
- Example cron entry:
```cron
*/10 * * * * curl -sS -X POST http://localhost:3000/api/submissions/report-delivery/trigger -H "Content-Type: application/json" -H "x-amc-ops-secret: ${AMC_OPS_SECRET}" -d '{"limit":20}' >/tmp/amc_report_delivery_cron.log 2>&1
```

Go / No-Go for invite-only soft launch:
- Go: env is valid, receipt send is confirmed, protected report trigger is confirmed, and cron/ops cadence is active to meet the within-3-hours promise.
- No-Go: missing/invalid ops secret, receipt send failure, report trigger failure, or no active cadence for delivery triggers.
