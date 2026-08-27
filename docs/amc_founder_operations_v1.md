# AMC Founder Operations & Research Data Layer V1

## Purpose

This layer supports Launch V2 operations and consent-gated aggregate research without changing AMC's customer-facing decision framework. Public persistence is best-effort: database or notification failure never blocks Preview, Full Intake, External Evidence, Dashboard, or Detailed Report generation.

## Architecture

- Public journey events call `POST /api/amc/ops/track`.
- Server code validates and bounds every accepted field before using parameterized SQL.
- Postgres stores structured submissions and meaningful usage events.
- `/amc-admin` is an unlinked founder route. Signed HttpOnly cookies protect all founder APIs.
- Vercel serverless routes and the local Express server share the same service, auth, and repository code.
- No IP address, fingerprint, exact location, authorization header, payment data, account identity, or database error is intentionally stored.

Postgres.js is the only database dependency. It is lightweight, supports standard `DATABASE_URL` connection strings, and keeps the schema portable to Neon-compatible Postgres or another Postgres host.

## Data Model

Run [001_amc_founder_ops.sql](../manus-ui/db/001_amc_founder_ops.sql) to create:

- `submissions`: anonymous journey stage, timestamps, language, Case Type, consent, evidence status, 29 answers, actual AMC structured outputs, Safety Margin data, Missing Point, Alternative Path, and Decision Conditions.
- `usage_events`: meaningful product events only. It does not log every click.

Raw answers and derived AMC analysis are separate JSON fields. The admin detail view labels them `RAW USER INPUT` and `AMC DERIVED ANALYSIS`.

## Identity and Consent

AMC creates a cryptographically random ID in the form `AMC-YYYYMMDD-XXXXXXXX`. The browser stores only this anonymous ID so later stages update the same journey. There is no fingerprinting.

- Service storage consent is required before Preview begins. It covers report generation, service operation, and AMC improvement.
- Research / education consent is a separate optional checkbox, unchecked by default. Declining does not block AMC.
- Research Patterns include only records where `research_use_consent = true`.
- Operations analytics include service-storage-consented journeys.

## Versioning

Every submission stores:

- `product_version`: `AMC-LAUNCH-V2`
- `framework_version`: `FIFWM-SM-V1`

`FIFWM-SM-V1` is a conservative internal label for the current existing FIFWM-derived and Safety Margin implementation. It does not change or make new claims about framework logic.

## Admin Route and Security

The founder route is `/amc-admin` and is not linked from public navigation.

Login validates `AMC_ADMIN_PASSWORD` on the server. A signed session uses `AMC_ADMIN_SESSION_SECRET` and an eight-hour HttpOnly cookie with `SameSite=Strict`; production cookies are `Secure`. Passwords and session secrets never enter the frontend bundle or localStorage.

Protected APIs:

- `POST /api/amc/admin/logout`
- `GET /api/amc/admin/summary`
- `GET /api/amc/admin/submissions`
- `GET /api/amc/admin/submission?id=...`
- `GET /api/amc/admin/export`

## Dashboard

Operations provides All time, 30-day, and 7-day windows for funnel counts and rates, language, Case Type, evidence mode, evidence live success, and research consent.

Research Patterns uses only consented submissions and existing structured AMC output. It shows Case Type, language, Safety Margin bands, current framework signal distributions, evidence mode, alternative-path presence, and report completion. It does not call an LLM or generate new categories.

Recent Submissions supports language, Case Type, completion, research consent, evidence mode, and time filters. Detail keeps raw responses visually separate from derived analysis and includes the event timeline.

## CSV Exports

- Summary Export excludes raw 29 answers by default.
- Full Response Export includes answers and derived output after a clear browser warning.
- Both endpoints require founder authentication and return UTF-8 CSV with a BOM for Excel compatibility.

## Optional Founder Notification

When enabled, a non-blocking email is sent to `report@allofmycareer.com` after dashboard generation. It contains only submission ID, language, Case Type, completion, evidence status, report status, consent, and timestamp. It never includes the 29 answers.

Notification or SMTP failure does not affect report generation or persistence.

## Environment Variables

Required for persistence and admin access:

- `DATABASE_URL`
- `AMC_ADMIN_PASSWORD`
- `AMC_ADMIN_SESSION_SECRET`

Optional founder notification:

- `AMC_FOUNDER_NOTIFICATIONS_ENABLED` (`true` to enable)
- `AMC_EMAIL_FROM`
- `AMC_SMTP_HOST`
- `AMC_SMTP_PORT`
- `AMC_SMTP_SECURE`
- `AMC_SMTP_USER`
- `AMC_SMTP_PASS`

Existing `AMC_CORS_ORIGIN`, Perplexity, and OpenAI settings remain independent. Never prefix founder secrets with `VITE_`.

## Database Initialization

1. Create a free or paid Postgres-compatible database.
2. Configure `DATABASE_URL` only in the server/deployment environment.
3. Run `psql "$DATABASE_URL" -f manus-ui/db/001_amc_founder_ops.sql` from a secure terminal.
4. Configure founder auth variables with strong, unique values.
5. Redeploy Vercel and verify the deployment is Current.

Without `DATABASE_URL`, the public AMC flow continues normally. An authenticated admin sees `Data backend not configured` and no raw database error.

## Deployment Checklist

- [ ] Apply `001_amc_founder_ops.sql`.
- [ ] Set `DATABASE_URL` for Vercel Production.
- [ ] Set strong `AMC_ADMIN_PASSWORD` and `AMC_ADMIN_SESSION_SECRET` values.
- [ ] Confirm `/amc-admin` rejects an incorrect password.
- [ ] Confirm login creates an HttpOnly, Secure, SameSite=Strict production cookie.
- [ ] Complete one consented QA journey and confirm progressive events.
- [ ] Confirm Research Patterns excludes a research-declined journey.
- [ ] Test Summary and Full Response CSV exports.
- [ ] Enable and test founder notification only after SMTP is configured.
- [ ] Confirm no secret value appears in the client bundle, logs, or source control.
