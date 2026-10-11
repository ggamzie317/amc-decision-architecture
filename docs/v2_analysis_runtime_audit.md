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

The web suite passes 342/342 across 21 files, including 24 focused evidence-reasoning
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

Final deployed live verification remains a separate boundary. The current remote browser
timed out opening the starting Preview, and an unauthenticated HTTP probe redirected to
Vercel login. No shared bypass link, protection change, new provider key or extra paid
research is used to resolve this access condition.
