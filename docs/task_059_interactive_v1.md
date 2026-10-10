# Task 059 — Experimental intake and interactive decision simulator

> Historical Task 059 record. Task 059A explicitly supersedes the raw-answer storage, duplicate narrative mapping, and blocked live-JEV sections below. The current implementation and verification are documented in [Task 059A](task_059a_privacy_jev.md).

## Review status

Implemented for **draft review only**, based on approved main `8b817ede5683f13ff28d11e92e551c79484d03e9`.

- Branch: `experiment/allofmycareer-interactive-v1`.
- Experimental route: `/amc-interactive-v1`.
- Existing route: `/amc-web-mvp`, still the original 29-question journey.
- No Production deployment, domain change, merge, historical migration, or backfill.
- The deterministic experiment works without any JEV provider.
- **Live JEV transmission is blocked by automatic approval review**. The canonical AMU implementation was found; this is not a missing-source fallback. The review rejected adding a credentialed Gateway request carrying user-derived structural context because it judged destination/payload authorization insufficient. No rejected live transport was implemented or invoked. The interface, offline packet/response contract, session cache, customer UI and unavailable behavior are reviewable.

## Intake and compatibility

Internal schema: `AMC-INTAKE-V4-15`; experience: `interactive-v1`. Both are internal metadata, never rendered to customers.

The same seven-question Preview supplies the decision and two option names. The new Full Intake has exactly fifteen text responses, the same eight category names, and selectors only at Q8–Q13. Progress is X / 15. It displays the supplied EN/KO explanation that Preview information is already available. Preview context is displayed without asking for the three labels again.

`manus-ui/client/src/data/amcIntakeV4.ts` contains the verbatim bilingual questions and engine-only compatibility adapter.

| New question | Existing engine answer slots | Category |
| --- | --- | --- |
| Preview decision | 1 | Context only |
| Preview Option A | 5 | Context only |
| Preview Option B | 8 | Context only |
| 1 | 2, 3 | Current Situation |
| 2 | 4 | Current Situation |
| 3 | 6, 7 | Option A / Option B |
| 4 | 9, 10 | Option A / Option B |
| 5 | 11, 12, 13 | External Pressure |
| 6 | 14 | External Pressure |
| 7 | 15, 16 | Internal Readiness |
| 8 | 17, 18 | Internal Readiness |
| 9 | 19 | Safety Margin |
| 10 | 20 | Safety Margin |
| 11 | 21 | Safety Margin |
| 12 | 22, 23, 24 | Support System |
| 13 | 25, 26, 27 | Timing and Constraints |
| 14 | 28 | Decision Switches |
| 15 | 29 | Decision Switches |

Selectors preserve the existing values/provenance exactly: Q8 → internal readiness; Q9 → financial room; Q10 → reversibility; Q11 → downside exposure/structural risk; Q12 → Option B support; Q13 → constraint load. Each also allows the existing explicit “Not Yet Established” selection. Financial, recovery and downside remain independent dimensions. Free text never creates a new scored signal. External validation still comes from the existing live-evidence logic, and Missing Point Impact is unchanged.

The new route sends semantic Q5 once as `externalPressure`, and Q6 once as `validationNeed`. The decision and option labels come from Preview. Compatibility-expanded repeated strings never enter the evidence request. The baseline requests evidence once; simulator controls, reset and advisory interactions do not request it again.

## One engine and two separate states

No changes were made to:

- `amcProductApplicationV3.ts`, including posture, Safety Margin, Changing and guardrails;
- `amcCurrentCaseStructuralSignals.ts`;
- `ProductApplicationViews.tsx`, including baseline Dashboard/Report intelligence;
- `externalSnapshotService.ts` or its Agent API integration;
- case-classification rules, research-consent rules, or Founder authentication.

`AmcWebMvp` shares the existing presentation and classifier, with an explicit experimental prop only on the new route. The default prop preserves legacy behavior. The engine build-input object is shared between the baseline calculation and the simulator. The experiment and legacy use separate opaque session journey keys, preventing accidental reuse of an unfinished legacy submission when visiting the new route.

`amcScenario.ts` clones the existing build contract, overrides only permitted bands, invokes the original Safety Margin function where required, and calls `buildProductApplicationV3()` again. It never writes answers or external evidence. Its outputs are never passed to Founder baseline persistence or the canonical report.

| Variable | Customer bands |
| --- | --- |
| Financial Room | Constrained / Developing / Strong |
| Reversibility | Constrained / Developing / Strong |
| Downside Exposure | Contained / Moderate / Elevated |
| Internal Readiness | Constrained / Developing / Strong |
| Option B Support | Constrained / Developing / Strong |
| Constraint Load | Light / Material / Heavy |
| External Validation, advanced | Weak / Developing / Strong |

The advanced external variable is explicitly labeled “Hypothetical external assumption”; real evidence remains unchanged. The scenario wrapper marks hypothetical scope; the existing engine's provenance type system was not extended or redefined.

Default **Test One Change** replaces any prior override. **Build a Scenario** allows multiple overrides. Both recalculate locally. **Reset to Baseline** clears overrides and the displayed advisory, invalidates pending advisory display, and restores deep equality with the baseline without a network request or baseline write. Scenario state stays in component memory; leaving the dashboard or refreshing can discard it intentionally.

The comparison is side by side at desktop widths and stacked on mobile. Mobile order is baseline, scenario, controls, impact, optional lens. Mode buttons show selected state. Controls have at least 44px height. No numeric probability, readiness score, gauge, or percentage is introduced into the simulator.

**Scenario Impact** deterministically compares posture, Safety Margin, Changing families/count, Missing Point, Decision Switches, Core Trade-off and Next Test. Changed/unchanged sections show exact existing output differences. Long Decision Switch comparisons are expandable. “Why” shows changed assumptions, original engine drivers and Safety Margin reading; it does not generate AI prose or claim that an improved assumption predicts an outcome.

## JEV: source found; live transport withheld

Canonical source was located in `/Users/kwonkibum/Documents/ChatGPT/AMU Business Model`:

- `src/decision-assist/jev.ts`;
- `src/decision-assist/gateway-directional.ts`;
- `src/decision-assist/gateway-second-line.ts`;
- `src/decision-assist/gateway-policy.ts`;
- `src/deployment/gateway-credential.ts` and the opt-in wiring in `vercel-handler.ts`;
- `docs/AMU_RC1_JEV_CHECKPOINT.md`.

Source repository HEAD observed: `e8acedc26ff2a75c65e0f64876c94942c2c54a94`. Observed `jev.ts` SHA-256: `912e4eee11980283b9218bf6c5c24d8c97c109ee6d58f97c3996d6f47b6e2daf`.

Established transport is `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone`, model `typesafe-ai/jev`. The public Gateway catalog confirmed that model as an evaluation model on 2026-10-09. The [official TypeSafe-compatible contract](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) was also checked. Canonical authentication resolves `AI_GATEWAY_API_KEY`, otherwise request-context OIDC through `getVercelOidcTokenSync()`. No credentials were copied, invented, committed, or sent to the browser.

Canonical conventions to preserve for a later approved live integration:

- bounded `{model, state, questions}` Choice packet;
- explicit opt-in Preview policy, no auto-invocation;
- public/de-identified minimal inputs; no raw intake or dossier;
- strict model/routing/choice/distribution validation and rejection of fallback routing;
- bounded request/response sizes, short timeout, no retry;
- durable per-packet reservation and finite pilot ledger before dispatch; retain uncertain outcomes to prevent paid duplicates;
- separate advisory receipts, never core mutations.

The existing AMU candidate-selection/public-directional rubric is not a career-scenario scoring system. `server/jevScenarioContract.ts` is an **offline-only** adaptation of its Choice packet and response validation to the five requested advisory dimensions. It has no transport, authentication, side effects or runtime customer import. It strips numerical confidence/distributions before producing the customer advisory. No pricing claim or fake assessment is used.

Reviewable proposed input in `makeJevInput()`: case type, baseline/scenario bands, changed variable names, baseline/scenario posture, Safety Margin and Changing families. No raw answers, option labels or confidential free text are included. Live-evidence text is not sent.

Advisory schema:

- `scenarioPlausibility`, `evidenceSupport`, `scenarioSensitivity`, `changingFeasibility`, `safetyMarginContribution`: `low | medium | high`;
- `assumptions` and `uncertainties`: at most three bounded items each;
- `conditionalReading`: one bounded, non-prescriptive paragraph;
- no total, winner, recommendation or outcome probability.

The runtime supplies no provider. **Assess This Scenario** explicitly requests a local assessment result and gets the restrained unavailable state. No provider is called. The injectable provider interface supports in-flight/completed session deduplication, timeout/error/malformed fail-soft behavior, and qualitative validation. Valid offline mock results remain in the separate advisory UI only. The customer label is **Scenario Plausibility Lens**, with EN/KO disclosure that it cannot change structural analysis.

Before live activation: approval is needed for sending the listed structural summary to the verified Gateway destination. Then implement the canonical server-only authentication and durable cost/duplicate guard in this repository and test a bounded Preview invocation. The runtime currently contains none of that rejected live request code. Lack of live JEV verification is a blocker for calling the auxiliary integration live-ready, not for testing the deterministic experiment.

## Founder Ops and privacy

One baseline submission stores the actual fifteen raw answers. No fabricated twenty-nine-answer raw record is persisted. Metadata uses existing event JSON plus top-level identity fields in `structuralOutputJson`; it never changes an analytical field. Schema identity is present on intake completion and retained on later derived syncs. No database migration is required.

Founder detail displays the new schema, count and actual EN/KO question text. Data-quality checks and Launch Ops integrity use 15 for the new schema and 29 for historical/unspecified schemas. Historical records are not rewritten. Existing legacy record handling remains intact.

Supported operational events: `simulator_opened`, `scenario_variable_changed`, `scenario_evaluated`, `scenario_reset`, `jev_assessment_requested`, `jev_assessment_completed`, `jev_assessment_unavailable`.

The server requires an existing baseline ID for simulator events, ignores all submission patches carried by them, and uses a strict bounded metadata allowlist. It drops raw text, complete scenarios, extra fields, and provider details. An orphan simulator event cannot create a submission. JEV H/M/L metadata is separate from core analysis.

Founder Launch Ops adds simulator opens, adoption, evaluations, single/multi usage, resets, JEV requests/completions/unavailable counts, seven variable counts and posture/Safety Margin/Changing changed-versus-unchanged counts. Adoption divides unique adopted experimental dashboard journeys by eligible experimental dashboard journeys; it never invents visitors.

Research Patterns shows directions, most-tested variables, structural-change counts and advisory H/M/L distributions only for `researchUseConsent === true`. Operational and research aggregation remain separate. The label is always “Operational / exploratory pattern, not a research conclusion.” Existing storage consent, optional research consent, Founder authentication and public privacy boundaries remain in place.

## Verification evidence

| Check | Result |
| --- | --- |
| Typecheck | PASS |
| Build | PASS; existing Vite large-chunk advisory |
| All current web Vitest tests | 193 / 193 PASS, 11 files |
| Paired structural equivalence | 72 pairs PASS: 9 case families × 2 languages × 4 structured-band fixtures |
| Equivalence fields | Case type, posture candidate/effective, guardrail/triggers, financial/recovery/downside, readiness/support/constraints/external bands, Safety Margin, Changing plays/families/count, evidence coverage |
| Zero override / reset | Full result deep equality PASS |
| Financial / recovery / downside controls | Original Safety Margin and guardrail behavior PASS |
| Single/multi determinism and baseline/evidence immutability | PASS |
| JEV absent/error/timeout/malformed/cache/HML boundary | PASS, offline only |
| Founder Ops, lifecycle, JSONB, Launch Ops and consent | PASS |
| Founder Ops ESM | PASS |
| Customer firewall, public bundle privacy, external evidence / Agent API, brand render | Existing suites PASS |
| Core engine, shared intelligence and external-evidence source diff | No changes from approved baseline |
| `git diff --check` | PASS |

Browser QA used Chromium with synthetic inputs, real tracking handlers, isolated `MemoryFounderOpsStore`, and fallback evidence. No real customer records, provider key, paid research or Production resources were used.

EN and KO each passed at **390, 430, 768, 1024 and 1440**: seven-question Preview → fifteen-question intake with six selectors → fallback-safe baseline → single change → impact → exact reset → multi-variable scenario → explicit advisory unavailable → baseline report. No page-level horizontal overflow or browser application errors. Simulator buttons met 44px height. Each journey issued exactly one evidence request, carried Q5/Q6 once, stored fifteen raw responses in one baseline record, and retained identical baseline raw/derived JSON through simulator use. Brand and Korean typography were visually reviewed in screenshots; baseline report lettermark remains intact.

The approved baseline was separately built from the exact main SHA. At EN/KO × 390/1440, `/amc-web-mvp` entry, Preview, original 29-question intake, Dashboard and Report text were exactly identical between builds; measured report heading/table geometry was also identical. No simulator rendered on the legacy route.

Local review artifacts: `/tmp/task059-qa/` (screenshots, `results.json`, `legacy-comparison.json`). Final web log: `/tmp/task059-final-web.log`; browser log: `/tmp/task059-final-browser.log`; legacy comparison log: `/tmp/task059-legacy.log`.

Additional out-of-scope root Node tests: 74 / 78 passed. The same four failures were reproduced on unchanged original code; `src/` and root `tests/` have zero diff against approved main. They are the English fallback expectation in `buildDecisionConditions.test.ts:201`, title expectations in `buildInternalStructuralSnapshot.test.ts:80` and `buildStrategicTemperament.test.ts:80`, and fallback wording in `buildStrategicTemperament.test.ts:196`. The analytical engine was not changed to force these historical assertions to pass. These are not failures in the current web regression suite.

An initial broad Vitest invocation also discovered root `node:test` files and correctly reported no Vitest suite; the roots were subsequently run with their own Node test runner. Final web counts above use the intended web-only command.

Reproduce locally from `manus-ui`:

```sh
npm run check
npm run build
node_modules/.bin/vitest run --root .. manus-ui/tests
npm run test:founder-ops-esm
node_modules/.bin/tsx scripts/serve_interactive_qa.ts
# In another terminal; use an existing Playwright installation, no production traffic:
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check_interactive_browser.cjs
```

The QA server is loopback-only with memory storage and fixed unavailable evidence. Its synthetic-record inspection route is not part of the production server.

## Changed files

- `client/src/App.tsx`: additional route only.
- `client/src/pages/AmcWebMvp.tsx`: shared presentation, experimental intake adapter and simulator hook-up; unchanged default behavior.
- `client/src/data/amcIntakeV4.ts`: fifteen bilingual questions, grouping and mapping.
- `client/src/data/amcScenario.ts`: pure overrides, mode behavior and deterministic impact.
- `client/src/data/amcJevAdvisory.ts`: separate advisory types, validation and session cache.
- `client/src/components/InteractiveSimulator.tsx`: controls, comparison and optional lens.
- `client/src/data/amcFounderOps.ts`: bounded event types and isolated experimental journey session.
- `server/simulatorAnalytics.ts`: schema counts, metadata allowlist and analytics.
- `server/founderOpsApi.ts`: baseline-only event boundary.
- `server/founderOpsTypes.ts`, `founderOpsAnalytics.ts`, `founderOpsHealth.ts`, `launchOpsAnalytics.ts`: additive event/schema/summary support.
- `client/src/pages/AmcAdmin.tsx`, `components/LaunchOps.tsx`, `components/SimulatorAnalytics.tsx`: additive internal views.
- `server/jevScenarioContract.ts`: offline canonical provider contract; no transport.
- `tests/interactive-v1.test.tsx`: hard gates and privacy/persistence/advisory tests.
- `scripts/check_founder_ops_esm.mjs`: include new server analytics dependency.
- `scripts/serve_interactive_qa.ts`, `check_interactive_browser.cjs`: reproducible local synthetic QA.
- This review document.

All paths above are relative to `manus-ui/`, except this document. No engine copy, V4 scorer, historical rewrite, paid provider request, Production deployment or merge was introduced.
