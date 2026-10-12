# V2 analysis runtime audit

Starting HEAD: `9c0d587fe944d0f838bf9783437caf3436a7ae81`.

## Immutable rules and operating inputs

Brand philosophy, report doctrine, Python questions and scoring, generated FIFWM rules,
Product Application V3, current-case signal derivation and the scenario engine are unchanged.
The input adapter is repaired: identical valid inputs produce identical original results;
new valid external inputs may change original results through the existing rules.

| Original layer | Required input | V2 path | Remaining limit |
| --- | --- | --- | --- |
| Decision Structure | Current options, conditions and canonical factors where applicable | `buildV2Input` → original V3 → shared analysis | Private prose is context, never a score source |
| External context | Genuine live signal directions and explicit provider context confidence | Normalized cited cards → `v2ExternalContext` → unchanged `buildCurrentCaseStructuralSignals` | Missing confidence, partial source coverage, unavailable and demo stay unknown |
| Safety Margin | Financial room, reversibility and downside selections | Existing self-check cards → original derivation | Self-report is not independent validation; unknown stays unknown |
| Changing | Original evidence-triggered 0–3 plays | Original V3 fields displayed unchanged | Zero plays remain zero in the map as well as the cards |
| Switching | Original signals and directions | Shared original output in dashboard, map and report | Public facts alone do not establish personal commitment conditions |
| Scenario | Original baseline plus explicit hypothetical band overrides | Unchanged scenario engine and 21-cell sensitivity | Reset restores baseline and evidence; no search on interaction |
| Public-condition comparison | A singly cited claim, current bands, self-report and optional explicit comparison | Same private comparison model in dashboard, report and scenario | No automatic eligibility, purchase validation or new score |

The public context adapter reuses the original snapshot meanings, directions and confidence
enum. It does not derive confidence from source counts, link accessibility, customer notes or
classifier keywords. Provider confidence describes its bounded external context, not a
human claim-verification result. Source access remains separate from claim grounding.
If any cited source is excluded, dependent aggregate confidence is removed along with the
existing provider aggregate summaries/signals. Independent accessible cards still inform
non-scored comparisons. Research-topic coverage is separate from source-access coverage:
a reachable regulatory page does not answer paid customer demand.

## Canonical FIFWM operating scope

The five customer headings remain Opportunity conditions / Connection potential /
Structural fit / Execution reality / Can this endure? Original organization and role
questions remain separate assessment inputs; they are not replaced with case-family bands.

| Case family | Canonical organization/role questions | Operating analysis |
| --- | --- | --- |
| Corporate Stay vs Exit | Available only with a known target organization/role and valid original choices | Original structural bands, applicable factors, public comparisons and scenarios |
| Industry Transition | Same | Same |
| Role Upgrade / Downgrade | Same | Same |
| Entrepreneurship | Not directly applicable; unassessed | Original structural bands, paid-demand gap, scoped public comparisons and scenarios |
| MBA / EMBA / PhD Decision | Not directly applicable; unassessed | Original bands, target/program comparison and scenarios |
| Overseas Relocation | Not directly applicable; unassessed | Original bands, location/requirements comparison and scenarios |
| Burnout-driven Decision | Not directly applicable; unassessed | Original bands, recovery/workload conditions and scenarios |
| Family Constraint-heavy Decision | Not directly applicable; unassessed | Original bands, operating constraints and scenarios |
| General Career Reconfiguration | Not directly applicable; unassessed | Original bands, target-path requirements comparison and scenarios |

This is an applicability limit of the available original input route, not a claim that all
nine families have a fully assessed FIFWM score. Invalid, unknown and inapplicable values
never become zero. No alternative scores or redefined questions are introduced.

## Private comparison records

After public research, a customer can record not compared / my evidence matches / a gap
remains / not applicable, with an optional brief record of actual work, figures or feedback.
These are factual comparison annotations, not ordinal bands or a new assessment framework.
The reading and next check distinguish a reported gap from a claimed match and remain
explicitly unverified. An inapplicable source is not mapped into personal findings.
The key includes language, citation, dimension and the exact fact: a changed claim cannot
silently reuse a prior personal match. State is React/tab memory only, is not sent to any
API, is not tracked, and is not saved to local/session storage, Founder Ops or a database.
The existing five-field public-search request is unchanged. Approved operational summaries
contain only existing enum bands and derived structural metadata, updated after the response.

## Verification contract

The existing 72 equivalence tests exercise the V1 intake adapter. They are useful preservation
checks but are not proof of sufficient V2 analysis. New V2 tests separately exercise native
external-input parity, missing/partial confidence, actual fact-only changes, explicit private
gap/match changes, unrelated facts, stale comparison rejection, research coverage, Changing
zero, original guardrail, scenario reset and EN/KO dashboard-report consistency. Synthetic
source fixtures are not live provider calls or verified public facts.

Live QA is bounded to one EN and one KO request on the final deployed SHA. Record actual
app status/reason headers, upstream metadata, retained source claims and the concrete
condition comparison. Simulator, comparison edits, report and print must not cause another
evidence call. Browser-produced test PDFs and native interactive save are reported separately.

## Implementation checks

At revision `433ab399`, the web suite passed 342/342 across 21 files, including 24 focused evidence-reasoning
checks and the existing canonical 15-choice / 243-combination FIFWM parity checks.
TypeScript, web/server/function builds, Founder Ops ESM and strict single/comparative
renders pass. Ten golden fixtures render with zero unresolved placeholders using the
same fixture runner and a direct Node/tsx launcher; the pnpm wrapper cannot use this
worktree's shared dependency symlink, so no dependency tree is replaced to force it.

Isolated SPA tests use explicitly synthetic API fixtures, not Perplexity. Both languages
verify visible case selection, the exact five-field request, private annotation changes,
keyboard controls, unchanged annotation scores, simulator reset and report consistency.
390px and 430px dashboard/report views have no horizontal overflow. A locally installed
QA Korean font is used to verify real Korean glyphs instead of accepting missing-glyph
boxes. Browser-produced A4 test PDFs have nine physical pages each; source facts are
preserved, with no orphan sections. Logical section numbers and actual print page
counters are separate. The controlled print callback verifies proposed topic/brand/date
titles and the real afterprint listener; it does not claim native Save or Cancel testing.

Final deployed live verification remained a separate boundary for that revision. The remote browser
timed out opening the starting Preview, and an unauthenticated HTTP probe redirected to
Vercel login. No shared bypass link, protection change, new provider key or extra paid
research is used to resolve this access condition.

## Transport repair and execution diagnostics — 2026-10-12

This follow-up starts from `433ab399ba67a75e404ef093fc7c5adc7716096a`.
It changes transport and safe execution reporting, not AMC definitions or analysis.

- The source checker previously passed only the first DNS answer to HTTPS. A real
  TLS fixture listening only on IPv4 reproduced failure when IPv6 came first.
  It now validates the **entire** DNS set before connecting and supplies those pinned
  addresses to Node's bounded family selection. There is no second DNS resolution,
  HTTP-denial retry or additional provider request. The existing four-second total
  probe bound, redirect checks, TLS validation and 4 KiB transient HTML prefix remain.
- Each source request uses its own direct agent. A global proxy agent must not resolve
  the hostname again after the public-address checks. Local fixture tests initially
  exposed this execution environment's global proxy intercepting the pinned test
  connection; with environment proxying disabled for that loopback-only RED test,
  seven existing tests passed and the new address-list regression failed. After the
  repair all reader tests pass without that test environment override.
- A mixed public/private or malformed DNS set is rejected before any connection.
  HTTP 403/404/410 still fail closed with one HTTP attempt. Source accessibility
  remains separate from whether the original page supports the displayed claim.
- The resolver reports a fixed execution stage, diagnostic category/field, source-check
  category and numeric upstream HTTP status through response headers. The browser
  retains only allowlisted labels in tab memory and DOM attributes. No key, source
  URL, customer note, search input or provider text enters this diagnostic channel.
- A throwing browser diagnostic callback previously discarded an otherwise valid
  response. Metadata callback failures now leave successful evidence intact.
- Provider key/preset lookup, the Agent request/schema, 3000-token cap, public request
  fields, original derivation and partial-source confidence rules are unchanged.
  Existing key metadata still targets Production and Preview without a branch override;
  its value was not decrypted or copied. The earlier soft-launch Production stays separate.

The final code passes **361/361 web tests** (21 files), TypeScript, web/server/function
builds, Founder Ops ESM, canonical rule generation and protected-file/diff checks.
The added checks include real TLS address fallback and the resolver → route → browser
metadata flow for configuration, provider, normalization, source and success outcomes.
Local EN/KO SPA QA uses synthetic responses: one mocked request per language,
correct stage/upstream labels, private-note non-transmission/non-storage, unchanged
annotations and baseline, simulator reset, shared report facts, 390/430px no-overflow
and no additional research. Browser-produced PDFs have nine physical pages each;
controlled print/afterprint restoration is not native interactive Save/Cancel proof.

Actual provider requests in this follow-up: **0**. Runtime-log API still returns 403.
Cloud browser control has responded and reached the ordinary Vercel login screen.
Final deployed EN/KO research and native save remain pending the user's existing-account
login in that verification browser; no protection bypass or new credentials are created.
These findings do not prove that all historical source failures had the DNS cause.

## Authenticated live verification and print repair — 2026-10-12

The user completed ordinary Vercel sign-in in the verification browser. The exact
`189376d855fd14b321504fc810561fb555b381e4` Preview was Ready and PR #92 remained
Draft and unmerged. No key, environment scope, protection setting or Production
deployment was changed.

Actual research on that SHA was **two requests total**, one per language:

| Synthetic case | App response | Captured response-derived metadata | Runtime observation |
| --- | --- | --- | --- |
| EN entrepreneurship | 200 | `live`, `ready`, upstream `200` | Perplexity Agent API, 5,245 ms |
| KO industry transition | 200 | `live`, `ready`, upstream `200` | Perplexity Agent API, 7,148 ms |

The displayed EN card was checked against Cal/OSHA's original outdoor heat-illness
prevention page. Both KO cards were checked against the Samsung DS memory/process
technology description and the Samsung Careers DS company/role page, including a
browser check of the exact cited `?lang` URL. The checked claims concern workplace
requirements and published job descriptions; they do not establish paid purchasing,
current process-role vacancies, market-wide demand or the individual's qualifications.

The KO case answered the five original organization/role questions. Their existing
evaluations remained unchanged when a condition-comparison note or hypothetical
scenario changed. The EN business case kept inapplicable organization/role factors
unassessed. Both cases linked public conditions to self-reports, unresolved gaps and
next checks. Keyboard-operated downside changes altered hypothetical Safety Margin
and reset to baseline. The report retained the same source facts and comparison state
in sections 3 and 9, with evidence-check date `2026-10-12`. After these operations the
deployment's runtime log still contained exactly two evidence API requests.

Printing the rendered live Preview DOM with its compiled stylesheet reproduced a
real pagination defect: the KO report's map and five answered factors occupied two
physical pages, producing ten pages for nine sections. Print-only spacing in section
4 now retains the diagram, all five questions, readings and bands on one page. No
text is hidden or truncated and font sizes are unchanged. With the repaired compiled
stylesheet, both live-content renderings have nine physical A4 pages. A separate
synthetic SPA check also covers longer canonical answers, 390/430px no-overflow,
private-note non-transmission/non-storage and controlled afterprint restoration.

The observed EN print title was
`Entrepreneurship_Review_allofmycareer_2026-10-12`. The cloud browser did not expose
the native Save dialog; Escape did not demonstrate cancellation or title restoration.
Offline PDF rendering and controlled afterprint tests are not native Save/Cancel proof.
The source/service/engine code is identical across the print-only follow-up. The two
paid live requests belong to `189376d`; they must not be reported as requests on a
later SHA. No additional provider request was made for the print repair.

The initial lookup for print commit `dcba996` showed no deployment or CI/check objects.
That is an observed publish-trigger gap, not proof of a disconnected Vercel account.
The normal Git push path is checked separately instead of repeatedly polling the
unchanged lookup or changing integrations and access controls.

## Soft-launch language and reading review — 2026-10-12

This follow-up starts from `ddeffdb0fb2441da5eadcc243c93e55800eaff6d`.
A reproduced presentation defect selected evidence by the interface language: changing
EN/KO could turn a valid live snapshot into unknown context and change the original
analysis inputs. Research language now identifies the active snapshot independently
of the interface language. Sources, confidence, check date, self-checks, original factor
answers, comparisons and hypothetical overrides remain the same when the UI changes.
Private comparison identity still includes the research language, citation, dimension
and exact fact; an actually different claim does not inherit an earlier match.

The original reasoning model is retained. Each finding renders its core reading once;
source conditions and the customer's comparison are presented separately, with scope,
current conditions and next check available through a keyboard-accessible disclosure.
The scenario panel uses the same compact reading and a concise executive summary.
The KO diagram labels public evidence in Korean. EN/KO remain visible, accessible
controls; no technical V2 suffix is shown in the customer wordmark.

A report remains open during language changes. In demos the same hypothetical
overrides remain active; changing the demo case still resets them. In a live session
source cards retain the text returned in the research language, with an explicit
notice in the source board and report sections 3/9 when it differs from the UI.
This does not claim automatic translation of private inputs or public source claims.
Print titles restore when the interface language changes, and the next print uses
the existing topic/allofmycareer/customer-local-date convention.

The 21-file web suite passes 363/363, including 72 V1 preservation checks, 26 evidence
reasoning checks and canonical 15-choice/243-combination parity. TypeScript, web/server
builds, the standalone V2 function, Founder Ops ESM and canonical generation checks
pass. Original definitions, Python scoring, generated rules, V3, structural derivation,
scenario engine, provider request/response contracts and source checker are unchanged.

Isolated SPA checks use synthetic API responses and zero paid requests. Both EN/KO
retain the live snapshot, response-derived diagnostic labels, private comparison note,
factor answers, scenario controls and report through UI toggles. A controlled 503
source denial shows no claim rows, preserves the eight-section draft across toggles,
and reaches the same nine-section result after an explicit retry. Neither switching
language nor editing comparisons, simulation/reset, report or print repeats research.
Notes are absent from all API bodies and browser storage; no JS page errors occur.
390/430px dashboard/report views have no horizontal overflow. Four browser-produced
A4 test PDFs (ordinary and failure/retry cases, EN/KO) each have nine physical pages
and no empty page. Normal EN/KO page renderings were visually inspected. Native
interactive Save/Cancel remains distinct from this controlled printing check.

Final deployed real research remains bounded to one EN and one KO request on the
new Ready SHA, recorded in PR #92 after publication. Earlier live success on
`189376d` is historical evidence and is not counted as verification of this follow-up.
The existing Production and draft PR state are retained while preparing the candidate.
