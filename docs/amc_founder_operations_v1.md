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

This separation is permanent research-data policy: preserve original answer text in `answers_json`; store AMC-generated interpretation in the derived fields; and retain the product version, framework version, Case Type, evidence mode/confidence, timestamps, and both consent states on each historical record. A later framework release must create newly versioned output for new submissions. It must not overwrite raw answers, relabel old derived output, or silently mutate historical rows.

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
- `GET /api/amc/admin/health`
- `GET /api/amc/admin/submissions`
- `GET /api/amc/admin/submission?id=...`
- `GET /api/amc/admin/export`

## Dashboard

Operations provides All time, 30-day, and 7-day windows for funnel counts and rates, language, Case Type, evidence mode, evidence live success, and research consent.

Founder Operations Health reports only safe states: database connection, migration readiness, submission/event storage readiness, admin session configuration, optional email configuration, and External Evidence configuration. It never returns a connection string, database hostname, credential, API key, or stack trace. Data Quality reports record completeness counts and the research consent rate; it does not interpret research or call an AI model.

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
3. From the repository root, run `pnpm --dir manus-ui db:migrate`.
4. Run `pnpm --dir manus-ui db:check` and require a passing result.
5. Configure founder auth variables with strong, unique values.
6. Redeploy Vercel and verify the deployment is Current.

Without `DATABASE_URL`, the public AMC flow continues normally. An authenticated admin sees `Data backend not configured` and no raw database error.

`db:migrate` requires `DATABASE_URL`, applies the non-destructive `001_amc_founder_ops.sql` transaction, does not print the connection string, and is safe to run repeatedly. `db:check` connects without reading submission rows and verifies the required tables and core columns, including product/framework version fields. It prints concise status only and exits nonzero when configuration, connectivity, or schema readiness fails.

## Database Failure Behavior

Submission persistence, usage tracking, and founder notification are best-effort side effects. With `DATABASE_URL` absent, invalid, or unreachable, Preview, Full Intake, External Evidence, Dashboard, and Detailed PDF Report continue. Browser tracking absorbs the failure without repeated visible errors. Authenticated admin endpoints return a clean unavailable/not-configured state and never return driver errors or connection details.

Before Production activation, verify all three cases in a non-Production environment. Temporarily omit `DATABASE_URL`, use a deliberately invalid test-only URL, and block or stop the test database. In every case, complete the public journey through PDF output and confirm the admin status is clean. Never use or print the Production value for failure testing.

## Production Activation Checklist

The founder performs these steps manually; no secret values belong in source, docs, client code, or logs.

### A. Create or connect Postgres

Create a Neon database or another standard Postgres-compatible database and obtain its server-side `DATABASE_URL`.

### B. Configure Vercel Production environment variables

Set these for the **Production** environment:

- `DATABASE_URL`
- `AMC_ADMIN_PASSWORD`
- `AMC_ADMIN_SESSION_SECRET`

`AMC_ADMIN_PASSWORD` must be a strong, unique password that is not reused elsewhere. `AMC_ADMIN_SESSION_SECRET` must be a separate high-entropy random string, independent from the password. Do not prefix either with `VITE_`.

For optional founder email, configure all supported variables listed in Environment Variables and set `AMC_FOUNDER_NOTIFICATIONS_ENABLED=true` only after SMTP has been verified. The email destination remains `report@allofmycareer.com`; notification content is operational summary only, never the full intake or raw 29 answers.

### C. Run the migration

From a secure terminal with `DATABASE_URL` available only to the command environment:

```sh
pnpm --dir manus-ui db:migrate
```

### D. Check the database

```sh
pnpm --dir manus-ui db:check
```

Require Database `connected`, Schema `ready`, Submission storage `ready`, and Usage events `ready`.

### E. Redeploy Production

Redeploy the Vercel Production deployment so the server functions receive the new environment variables. Confirm the deployment is Current.

### F. Complete one real QA journey

Open [AMC Launch V2](https://app.allofmycareer.com/amc-web-mvp). Complete Preview, Full Intake, External Evidence, Dashboard, and Detailed PDF Report with service storage consent **yes** and research consent **yes** for this internal test.

### G. Verify Founder Admin

Open the intentionally unlisted [AMC Founder Admin](https://app.allofmycareer.com/amc-admin) and confirm:

- login and logout/session rejection;
- health shows database/schema/submission/usage readiness;
- Operations metrics and research-consented Research Patterns;
- the QA row in Recent Submissions;
- Submission Detail keeps `RAW USER INPUT` separate from `AMC DERIVED ANALYSIS`;
- usage events are present;
- Summary CSV opens in Excel and excludes raw 29-question responses;
- Full Response CSV requires the authenticated session, is clearly sensitive, and preserves Korean text, commas, quotes, and newlines.

### H. Confirm public isolation

Confirm `/amc-admin` is not linked from landing, Preview, Full Intake, Dashboard, Detailed PDF Report, or the footer. Confirm the public footer still uses `report@allofmycareer.com`, no admin data leaks into the public UI, and the complete public journey still works if the database is unavailable.

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
