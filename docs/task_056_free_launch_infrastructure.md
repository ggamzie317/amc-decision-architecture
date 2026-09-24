# Task 056 — Free public launch infrastructure

Baseline: `65f220225dd4a10008e9749ecca645b50b8aab78` (latest `origin/main` when branch was created).
Branch: `codex/task-056-free-launch-infrastructure`.
Audit/verification date: 2026-09-24. No Production deployment, billing change, schema migration, historical backfill, or Production submission writes were performed.

## Perplexity contract checked before implementation

Official sources only:

- [Sonar migration guide](https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/how-to)
- [Migration overview and retirement notice](https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/overview)
- [Agent endpoint reference](https://docs.perplexity.ai/api-reference/agent-post)
- [Structured output control](https://docs.perplexity.ai/docs/agent-api/output-control)
- [Current presets](https://docs.perplexity.ai/docs/agent-api/presets)
- [Define an Agent run](https://docs.perplexity.ai/docs/agent-api/building-agents/define-the-run)

The deployed web service integration in `manus-ui/server/externalSnapshotService.ts` no longer calls `/chat/completions` or selects `model: sonar`. It now calls `POST https://api.perplexity.ai/v1/agent`, authenticated with `Authorization: Bearer <PERPLEXITY_API_KEY>`.

Exact AMC request:

```json
{
  "preset": "fast",
  "input": [
    { "type": "message", "role": "system", "content": "AMC evidence instructions" },
    { "type": "message", "role": "user", "content": "Bounded career-decision context" }
  ],
  "max_output_tokens": 2500,
  "stream": false,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "AmcWebExternalSnapshot",
      "strict": true,
      "schema": "SNAPSHOT_SCHEMA object in externalSnapshotService.ts"
    }
  }
}
```

The schema requires confidence, 3–4 external signals, 1–4 source notes, 1–4 uncertainty notes, and one implication. Objects reject additional properties at the provider schema boundary. Direction/evidence/confidence enums and nonempty text are checked again server-side. Source notes additionally contain a provider-only `sourceUrl`.

AMC accepts only the completed HTTP response envelope (`object: response`, `status: completed`, no error). It reads the final completed assistant message's `output_text` content, parses JSON, and validates it. It does not rely on the SDK convenience `output_text` property or parse reasoning/tool text. Every cited source URL must match an HTTP(S) URL in the returned `search_results`. URLs with credentials are rejected. This checks source provenance; it is not independent factual verification of each model statement. Provider-only URLs are removed when normalizing to the unchanged customer contract.

`WebExternalSnapshot` still contains `status`, `confidence`, `reasonCode`, `generatedAtLabel`, `externalSignals`, `sourceNotes`, `uncertaintyNotes`, and `implication`. No Agent envelope reaches the client. The customer firewall and analysis logic are unchanged.

### Configuration and cost bounds

- Keep `PERPLEXITY_API_KEY` server-side. Existing `PPLX_API_KEY` alias remains supported; no secret rotation is required by this migration.
- Optional `PERPLEXITY_AGENT_PRESET=fast`; unset/invalid values default to `fast`. Supported explicit overrides are `fast`, `low`, `medium`, `high`, `xhigh`. Do not upgrade the preset without measured benefit.
- `PERPLEXITY_MODEL` is ignored by the web integration. `fast` is the official economical Sonar replacement. AMC does not pin the preset's underlying model.
- AMC uses the Perplexity `fast` preset and allows the preset to manage its own optimized Agent API step budget; the request does not override `max_steps`. One request, 2,500 output-token ceiling, no automatic provider retries. Provider timeout: 45 seconds. First schema compilation can take longer than a warm call according to the output-control documentation.
- `manus-ui/vercel.json` gives this specific Node function a 60-second maximum; telemetry waits at most two seconds. See [Vercel duration configuration](https://vercel.com/docs/functions/configuring-functions/duration).
- Official responses expose `usage.cost` metadata. This task deliberately does not persist dollar values or integrate billing APIs. Founder request counts are useful inputs to later cost estimation, not an invoice.
- The older offline `src/perplexity` report/CLI pipeline is separate from the deployed AMC web path and remains outside this migration. Its Sonar commands should not be used after retirement without a separate migration.

Missing key, HTTP/network failure, timeout, incomplete envelope, malformed JSON, invalid enums/counts/text, or ungrounded source URLs all return safe fallback. Raw provider errors never reach customers or metadata. Normal customer mode replaces fallback evidence with the existing neutral snapshot; QA mock evidence remains confined to explicit QA mode.

### Operational metadata

Server logs emit only provider, `apiGeneration: agent-api`, preset, live/fallback, reason code, elapsed milliseconds, timeout flag, and completion timestamp. No prompts, answers, keys, provider error body, or raw provider payload are logged.

The customer sends opaque submission/request IDs. Its existing `external_evidence_requested` tracking event carries the request UUID. The provider call waits up to 1.5 seconds for that event, then proceeds even if storage is slow. The server annotates only a matching request event under service-storage consent, within two minutes of creation, and only once. Native JSONB binding is retained. Client-supplied `providerObservation` is stripped. Submission rows and derived analysis are never changed by provider telemetry. Missing/unrecorded telemetry remains unknown. No new event type, table, column, or historical rewrite is required.

## Founder Launch Ops

Authenticated `/api/amc/admin/launch` feeds the new default LAUNCH OPS tab. Existing Operations, Research Patterns, Recent Submissions, detail, Health, and CSV remain available.

- **Cohorts:** service-storage-consented journeys created within the last 7 days, 30 days, or all time, followed through now. These are journey cohorts, not events occurring only inside the window.
- **Funnel:** Preview Started → Preview Completed → Full Intake Started → Full Intake Completed → Dashboard Generated → Detailed Report Opened → Print/Save. Each stage counts unique submission IDs. Conversion is the intersection of the two stage sets divided by the earlier set. Missing prior stages are flagged rather than inventing events. Visitors are not measured. A zero denominator displays an em dash.
- **Journey quality:** intake completion, Dashboard→Report, Report→Print, incomplete journeys, and incomplete journeys with no recorded activity for 24 hours. The latter is not asserted to be abandonment. Mean/median intake time uses valid ordered start/completion event pairs and includes time away. Sample count is shown.
- **Patterns:** completed-submission case type, normalized EN/KR posture, Safety Margin, final Changing count (0–3 or Unknown), unique family occurrence per journey, and cohort language. Missing Changing is not interpreted as zero. The view says “Operational pattern, not a research conclusion.” No statistical significance is implied.
- **Evidence health:** current persisted live/fallback journey counts and percentages; recorded requests; verified live/fallback/unknown request counts; provider failures, invalid responses, missing configuration, timeouts, average/recent latency, recent recorded live success. Historical outcomes and new server diagnostics are explicitly distinguished.
- **Integrity:** duplicate starts, missing/out-of-order stages, completed intake without exactly 29 nonempty answers, dashboard missing structured output, live evidence missing final sync, report/print before sync or with missing output, malformed submission JSONB, missing final Changing, detectable orphan events, latest stored row/event timestamp. Counts overlap and are observation-only. Older missing sync markers may be flagged; no repairs run.
- **Research:** opt-in completed submissions / all completed submissions, with percentage. Launch Ops uses service-consented operations data. The unchanged Research Patterns path still filters `researchUseConsent === true` before aggregation.
- **Status:** free launch, FREE pricing, no customer accounts, opt-in research, Agent provider/preset. Production SHA appears only when Vercel identifies the environment as Production and supplies a valid commit SHA; Preview/local SHA is omitted.
- **Recent activity:** 12 newest cohort journeys with safe metadata. Raw answers and derived narratives are omitted from overview API responses; explicit authenticated detail/full export retains them.

The aggregate read uses two bulk queries over existing tables, avoiding per-journey event queries and arbitrary truncation. For a small launch this is straightforward; if volume grows substantially, move aggregation into SQL and add pagination/refresh controls before the all-time scan becomes expensive. No scientific or visitor analytics are inferred.

## Vercel read-only readiness audit

Project: `allofmycareer/amc-decision-architecture` (`prj_xMLIuUD9WMSfB9L4XJp7JE64tvMZ`). CLI read-only APIs were used because the connected project tool's parameter schema did not match its backend.

| Check | Observed result |
| --- | --- |
| Plan | **Hobby**, billing status active |
| Production | READY / PROMOTED, `dpl_2CryKKXwJCQD23CbJofbrRe7Qq5x`, baseline SHA `65f220225dd4a10008e9749ecca645b50b8aab78` |
| Domain | `app.allofmycareer.com`, verified; customer route returned HTTP 200 |
| Framework / root | Vite / `manus-ui` |
| Commands / output | `pnpm install`, `pnpm build`, `dist/public` |
| Runtime | Node 24.x, Fluid enabled, function default region `iad1` |
| Build machine | Basic fixed build machine, 2 cores / 8 GB; no upgrade made |
| Protection | Vercel authentication `all_except_custom_domains`; password protection absent. Public custom domain remains accessible; Founder data still requires AMC auth. |
| Environment separation | Retrieved variables are Production-scoped; no Preview entries were returned. Preview database/admin/provider configuration needs a separate setup. |
| Runtime logs | Read-only query completed with zero returned entries in the available retention window. This is **not** proof of no historical errors. |
| Spend controls | No verified configured budget was available from the read-only response; do not assume a cap exists. |

Environment **names only** observed: `PERPLEXITY_API_KEY`, `AMC_ADMIN_PASSWORD`, `AMC_ADMIN_SESSION_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_DATABASE`, `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL`, `PGUSER`, `PGHOST`, `PGHOST_UNPOOLED`, `PGDATABASE`, `PGPASSWORD`, `NEON_PROJECT_ID`, `NEON_AUTH_BASE_URL`, `VITE_NEON_AUTH_URL`. No `PERPLEXITY_AGENT_PRESET` is required because fast is the default. No secret values were printed or committed.

Current [Vercel Hobby documentation](https://vercel.com/docs/plans/hobby) describes personal/non-commercial use. It lists 300 seconds for Hobby Fluid functions and Pro's standard maximum of 800 seconds (longer durations are beta); AMC's proposed 60 seconds is conservative. Listed runtime log retention is one hour on Hobby and one day on Pro.

### HUMAN ACTION REQUIRED — UPGRADE TO VERCEL PRO BEFORE PUBLIC BUSINESS LAUNCH

1. Open the [Vercel dashboard](https://vercel.com/dashboard) and select **allofmycareer**.
2. Open **Settings → Billing**.
3. Under **Plan**, select **Upgrade** (or **Upgrade a Team**, then select the existing team).
4. Select Pro, review seats and the displayed billing terms; extra developer seats are unnecessary for this launch.
5. Enter payment details and select **Confirm and Upgrade** yourself.

No purchase or billing change was made by this task. Enterprise is unnecessary.

### Conservative launch settings for the owner

In **allofmycareer → Settings → Billing → Spend Management**, enable management and set an initial **$25 on-demand budget** as a proposed small-launch threshold, subject to your chosen operating budget. Enable 50%, 75%, and 100% notifications under **My Notifications → Team → Spend Management**. Consider **Pause Production Deployments** only if stopping all team Production sites is preferable to further overage. A notification budget alone is not a cap; checks can lag several minutes. This excludes seats/integrations and does not cap direct Perplexity or database billing. [Official spend-management documentation](https://vercel.com/docs/spend-management)

Retain the custom domain, existing Production secrets, Fluid runtime, and standard build machine. Review **project → Logs / Observability** for errors after release and watch `amc_external_evidence` outcomes. Avoid paid observability/build upgrades until usage warrants them. Review the provider account's usage/credit settings separately.

Before release, configure **Preview-only** `DATABASE_URL` for an isolated test database, `AMC_ADMIN_PASSWORD`, `AMC_ADMIN_SESSION_SECRET`, and a provider key; retain Preview deployment protection. Optional `PERPLEXITY_AGENT_PRESET=fast`. Do not point Preview at Production data. Run an actual EN/KR Agent response smoke test and confirm live normalization, latency, source quality, and corresponding Founder counters. No credentials were pulled into this workspace and no live paid provider call was made in this task, so real account/model quality and live PostgreSQL round-trip verification remain release checks.

## Security and product preservation

Password auth, eight-hour signed sessions, HttpOnly, SameSite Strict, and Secure-in-Production cookies are unchanged. The new aggregate endpoint authenticates before reading data and sets `Cache-Control: no-store`. Backend errors return unavailable rather than fake zero metrics or sensitive messages. Provider configuration stays server-side; no secrets/raw historical answers enter the public bundle.

No pricing, checkout, tiers, account requirement, report lock, chatbot, or customer redesign was added. Approved Start Free Preview, seven preview questions, 29 intake questions, Changing/Safety Margin/Decision Switches, report/dashboard architecture, submission isolation, final derived sync, language firewall, and consent boundaries remain intact.

## Verification record

Automated checks and browser results are recorded below; live external-account and Production-database checks are explicitly excluded.

- Production frontend/server build and TypeScript check: PASS. Existing Vite chunk-size advisory remains.
- Agent API tests: 25 cases including EN/KR live envelopes, strict request format, malformed responses, enums/counts/source provenance, refusal/error/incomplete responses, HTTP/network failure, timeout/abort, missing key, old model deprecation, neutral normal-mode fallback, and stalled telemetry.
- Launch Ops tests: 14 cases covering funnel/conversions, zero denominators, windows, timing, distributions, evidence health, integrity, consent isolation, auth, overview privacy, unavailable storage, fresh-only metadata and client-forgery stripping.
- Native JSONB tests: 3 cases including native object metadata and consent/freshness/request-match/no-overwrite SQL predicates.
- Existing product application, customer-language firewall, public-bundle privacy, external-evidence route, Founder Ops, ESM import smoke, lifecycle, and structural-signal tests: PASS.
- Broader Node suite: 78 tests, 74 pass, 4 fail. The same four fail on an untouched archive of the exact baseline: `buildDecisionConditions` weak/missing-signal fallback; `buildInternalStructuralSnapshot` single-case shape; `buildStrategicTemperament` single-case shape and weak/missing-signal fallback. No files in that broader pipeline were modified.
- `git diff --check`: PASS.

Manual browser QA used a local production build and the real handlers with an isolated MemoryFounderOpsStore. No Production rows or credentials were used. EN desktop and KR 390px journeys each completed service consent → seven-question Preview → all 29 intake answers and six structured selectors → Dashboard → Report → Print/Save. EN and KR report PDFs were rendered. Dashboard/report and entry were also inspected at desktop and 390px. No horizontal page overflow or browser application errors were observed. No payment gate appeared, and no QA mock evidence was enabled. The absent provider key exercised neutral fallback and final derived synchronization.

Founder QA at desktop and 390px covered LAUNCH OPS, 7/30/all filters, Operations Health, Research Patterns, Recent Submissions, explicit detail, Summary CSV, Full Response CSV and its existing confirmation. Both CSV endpoints returned 200, with the correct CSV content type. Detail retained 29 answers; overview responses excluded them. Tables scroll within their containers without page overflow.

Observed end-to-end synthetic results: 2 journeys at every funnel stage, 2 recorded requests / 2 fallback outcomes / 2 missing-configuration observations, zero integrity flags, EN=1/KR=1. Research consent was 1/2 (50%), and Research Patterns included only the Korean opt-in. Stored final Changing arrays remained available and raw/derived sections stayed separate.

Screenshots and PDFs were saved locally under `/tmp/amc-task056-docs/`; they are synthetic QA artifacts and are not part of the customer build.

## Changed-file map

- Provider/wire adapter: `manus-ui/server/externalSnapshotService.ts`, `server/providerObservation.ts`, `api/amc/external-snapshot.ts`, `server/index.ts`, `vercel.json`.
- Provider correlation: `client/src/data/amcFounderOps.ts`, `client/src/pages/AmcWebMvp.tsx` (opaque IDs only).
- Analytics/persistence/authenticated route: `server/launchOpsAnalytics.ts`, `server/founderOpsTypes.ts`, `server/founderOpsStore.ts`, `server/founderOpsApi.ts`, `server/vercelFounderOps.ts`, `server/founderOpsExpress.ts`, `api/amc/admin/launch.ts`.
- Founder presentation: `client/src/components/LaunchOps.tsx`, `client/src/pages/AmcAdmin.tsx`.
- Verification: `tests/perplexity-agent.test.ts`, `tests/launch-ops.test.ts`, `tests/founder-ops-jsonb.test.ts`, `scripts/check_founder_ops_esm.mjs`, `package.json`.
- Documentation: this runbook.

## Release boundary

This task produces a PR only. Owner actions before public business launch: upgrade Vercel to Pro, configure spend notifications, provision isolated Preview credentials/data and verify real Agent API responses, review/merge the PR, then separately authorize the Production deployment. Do not execute the older offline Sonar scripts after retirement without migrating that separate pipeline.
