# Task 059A — Session-only input and approved JEV integration

This document supersedes Task 059's raw-answer persistence and blocked live transport. Work continues on `experiment/allofmycareer-interactive-v1`, Draft [PR #91](https://github.com/ggamzie317/amc-decision-architecture/pull/91). Base main remains `8b817ede5683f13ff28d11e92e551c79484d03e9`. The final response identifies the pushed commit (a commit cannot embed its own SHA).

## 25 requested return items

1. **Updated head:** obtain from PR #91; the delivery response records the exact pushed SHA. Starting head was `f5e1d76e8dc1443593bedd8de100d0c83371c5e7`.
2. **Persistence removal:** a shared explicit projection runs before browser Founder tracking and again before server writes. It strips answers, option labels, decision/risk/support/constraint text, evidence prose and URLs, posture sentences, why, Missing Point, alternative-path moves, switch prose, FIFWM readings, experiments, comparisons, and entire scenario objects. Repeated stage updates retain only approved baseline structure. Tagged records cannot downgrade their schema to bypass the projection. Detail/export responses also project tagged records. Existing stored tagged rows are scrubbed when updated; no historical database migration or live database audit was performed.
3. **Exact retained fields:** standard submission ID, creation/update and journey-stage timestamps, product/framework identity, language, experience/schema identity, completed-in-session question count, categorical case type, posture label, Safety Margin band, the seven baseline bands (`financialRoom`, `reversibility`, `downsideExposure`, `internalReadiness`, `optionBSupport`, `constraintLoad`, `externalValidation`), Changing family names/count, decision-switch count, external evidence mode, service/research consent, report/print events. Ordinary interactive metadata permits identity, evidence sync boolean/mode, language from/to and bounded UUID request correlation. Simulator metadata permits variable, old/new band, single/multi mode and posture/Safety/Changing changed booleans. JEV completion metadata contains only three qualitative H/M/L fields. A server-authored SHA-256 packet fingerprint is retained solely for durable reservation; neither packet nor provider response is stored.
4. **Session-only raw text:** the seven Preview and fifteen Full Intake answers, labels and scenario states stay in React memory. No answers are stored in localStorage/sessionStorage or Founder records. Session storage holds only the separate experimental journey ID/status. Leaving/reloading may require re-entry. Existing external-evidence request behavior is unchanged; this is not an upstream zero-retention promise.
5. **Route:** explicit POST `/api/amc/jev-scenario`; Vercel function and local Express registration use the same server handler. Production/default execution is disabled. Runtime permits only Vercel Preview for this experiment branch. Tests inject enabled state and synthetic dependencies.
6. **Exact JEV state fields:** `caseType`, `baselineBands`, `scenarioBands`, `changedVariables`, `baselinePosture`, `scenarioPosture`, `safetyMargin` (two bands), `changingFamilies` (two family arrays). Each is strictly enumerated/bounded; unknown top-level and nested input fields are rejected. Changed-variable names must match changed bands. The server wraps this state in the canonical Choice packet with pinned model and five fixed rubric questions.
7. **Excluded from provider payload:** all raw answers, option labels, names, email, company, submission/user IDs, IP, evidence prose/URLs, missing/switch prose, complete Founder/product/scenario objects and credentials outside Authorization. First-party `x-amc-submission-id` correlates the existing baseline; it is never forwarded to Gateway. No incoming headers are forwarded.
8. **Gateway/auth:** `https://ai-gateway.vercel.sh/typesafe/v1/systemone`; bearer `AI_GATEWAY_API_KEY` first, otherwise request-context `getVercelOidcTokenSync()` from `@vercel/oidc`. Tokens are resolved per request, never cached globally or shipped to the browser. Missing credentials fail soft. No credential was copied from AMU. The pinned public dependency graph/integrities follow canonical AMU's lockfile; Node registry access timed out, and the resulting pnpm lockfile passed offline frozen-lock validation.
9. **Model/routing validation:** exact `typesafe-ai/jev` model, original model and canonical slug; resolved/final provider `typesafe-ai`. Reject fallback headers, wrong routing, malformed or unexpected contract fields. All five Choice answers must have only the allowed keys, valid low/medium/high distributions summing to approximately one (tolerance 0.02), bounded finite confidence and a maximum-probability selected choice. No numerical values cross the response boundary.
10. **Advisory schema:** five internal H/M/L fields: scenarioPlausibility, evidenceSupport, scenarioSensitivity, changingFeasibility, safetyMarginContribution. Customers see the first three, with bounded conditional reading, assumption and uncertainty text. Text is fixed conditional framing after a valid provider response, never fabricated H/M/L fallback. Korean rendering supplies equivalent local copy. Numeric/predictive or extra advisory fields are rejected by the client parser.
11. **Duplicate/cost guard:** no automatic retries; three-second provider abort timeout, five-second browser request timeout, 48 KiB request and 8 KiB streamed response bounds. Same-handler identical in-flight requests share one promise, up to 32 concurrent fingerprints. Browser session cache retains up to 64 outcomes and reuses identical completed/failed requests. Existing PostgreSQL usage_events plus transaction advisory lock reserve BEFORE dispatch, preventing duplicates across instances/restarts. **Six total pilot reservations**, with no automatic reset/refund after timeout or ambiguous dispatch; changing scenario or reloading cannot exceed this allowance. No DB migration. A deliberate future budget review is needed to extend the pilot; the cap is an attempt limit, not a promised dollar amount.
12. **Disclosure:** exact bilingual text is immediately above the assessment button (below).
13. **Failure behavior:** missing DB/credentials/baseline, timeout, HTTP error, size guard, malformed response, bad probabilities/model/provider/routing, duplicate guard and exhausted allowance all yield unavailable. No fake H/M/L result. Invalid request shape is HTTP 400 with unavailable; unsupported method is 405. The deterministic simulator continues.
14. **Core immutability:** the JEV path reads the persisted categorical baseline only to verify eligibility, writes operational events only, and cannot update baseline or deterministic scenario output. Advisory UI state is separate and clears on reset/change. Core engine, signal derivation, report component and external-evidence service have no diff against approved main.
15. **Founder behavior:** interactive expected persisted raw answers = **0**, in-session completion = **15**, requiring both schema/experience tags for completion. Legacy remains 29. Empty answers are not fabricated fifteen-answer records. Raw detail shows **Session-only / not stored**. Case type, posture, Safety, seven bands, Changing families, switches, evidence, simulator events, report/print and consent remain inspectable; summaries use categorical values.
16. **Research consent:** only submissions whose `researchUseConsent === true` contribute to research summaries, including simulator/JEV patterns. Operations keep non-consented cases separate from research eligibility. Events never carry written answers or advisory prose.
17. **Adapter narrative audit:** retain one source narrative in old slot 3 (new1), 6 (new3), 9 (new4), 11 (new5), 15 (new7), 17 (new8), 23 (new12), 25 (new13). Old redundant slots **2, 7, 10, 12, 13, 16, 18, 22, 24, 26, 27** are empty. Other mappings and six selector bands are unchanged. In particular, insideReality no longer concatenates new Q8 twice. The UI still has one primary field per new question and exactly fifteen questions. The legacy route never uses this adapter.
18. **Structural equivalence:** all **72 paired fixtures** pass (nine case families × EN/KO × four band states), including classification, same engine structures, guardrails and Changing plays.
19. **Privacy/transport tests:** sentinel raw strings injected into answers, derived narratives, evidence, metadata and schema downgrade attempts do not survive projection/persistence/export. Strict payload tests reject eight common disallowed fields, nested prose, bad categories, excessive arrays and inconsistent changed variables. Canonical dispatch, qualitative output, immutable baseline, missing credentials, request-scoped OIDC, disabled environment, timeout, HTTP/model/provider/distribution/extra-field/fallback/size/JSON failures, in-flight deduplication, restart-equivalent duplicate guard and six-reservation ceiling are mocked. Built browser assets exclude Gateway endpoint/auth symbols and historical private fixture markers.
20. **Regression:** **219/219 web tests**, TypeScript, Vercel server ESM import smoke and production build pass. **10/10 browser scenarios** pass at EN/KO × 390/430/768/1024/1440: no horizontal overflow, touch target checks, explicit-only JEV calls, cached repeat, seven retained baseline bands, zero persisted answers, reset and report. Legacy EN/KO 390/1440 text at every phase and report heading/table geometry equal the approved-main build. Existing root test baseline from Task 059 remains 74 passed/4 pre-existing failures; no core change was made to those files. No live provider request was used for tests.
21. **Preview:** [interactive experiment](https://amc-decision-architecture-git-experiment-a-788bc4-allofmycareer.vercel.app/amc-interactive-v1). Git push updates Preview only; the final delivery confirms current deployment checks.
22. **Changed files:** see the precise list below and PR diff.
23. **Draft PR:** [#91](https://github.com/ggamzie317/amc-decision-architecture/pull/91), same branch and PR; keep Draft.
24. **No Production:** no merge, Production deployment, public domain change, or replacement of `/amc-web-mvp`.
25. **Remaining review:** human visual review and optional real Preview credential/provider acceptance remain. Mocked integration proves code boundaries, not live upstream availability or retention. No actual JEV request was made. Deployment/CI status is reported separately after push. There is no new endpoint/provider approval blocker. Vercel connector project inspection returned 403 for the allofmycareer scope and no local Vercel CLI was available, so Preview credential configuration was not independently confirmed. GitHub checks and public Preview route checks are used for deployment verification.

## Exact customer disclosure

EN: Optional: this assessment sends only a de-identified structural summary of the scenario to an external AI provider. Your written answers are not sent.

KO: 선택 기능입니다. 이 평가는 시나리오의 비식별 구조 요약만 외부 AI 제공자에게 전송합니다. 작성한 답변 원문은 전송하지 않습니다.

## Verification artifacts

Synthetic screenshots and browser records: `/tmp/task059a-qa/`. No real customer data was used. The local QA server supplies deterministic mocked provider responses, and its memory store enforces the same finite reservation behavior. The first six browser cases exercise available responses; remaining cases exercise guard-exhaustion unavailable responses. The browser script also checks explicit-only dispatch, cached repeat and reset-after-advisory.

## Changed files

- `docs/task_059_interactive_v1.md`
- `manus-ui/client/src/components/InteractiveSimulator.tsx`
- `manus-ui/client/src/data/amcIntakeV4.ts`
- `manus-ui/client/src/data/amcJevAdvisory.ts`
- `manus-ui/client/src/pages/AmcAdmin.tsx`
- `manus-ui/client/src/pages/AmcWebMvp.tsx`
- `manus-ui/package.json`
- `manus-ui/pnpm-lock.yaml`
- `manus-ui/scripts/check_founder_ops_esm.mjs`
- `manus-ui/scripts/check_interactive_browser.cjs`
- `manus-ui/scripts/serve_interactive_qa.ts`
- `manus-ui/server/founderOpsApi.ts`
- `manus-ui/server/founderOpsHealth.ts`
- `manus-ui/server/founderOpsStore.ts`
- `manus-ui/server/founderOpsTypes.ts`
- `manus-ui/server/index.ts`
- `manus-ui/server/jevScenarioContract.ts`
- `manus-ui/server/launchOpsAnalytics.ts`
- `manus-ui/server/simulatorAnalytics.ts`
- `manus-ui/server/vercelFounderOps.ts`
- `manus-ui/tests/interactive-v1.test.tsx`
- `manus-ui/tests/public-bundle-privacy.test.ts`
- `manus-ui/api/amc/jev-scenario.ts`
- `manus-ui/server/jevScenario.ts`
- `manus-ui/shared/interactivePrivacy.ts`
- `manus-ui/tests/jev-scenario.test.ts`

- `docs/task_059a_privacy_jev.md`
