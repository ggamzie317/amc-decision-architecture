# V2 launch hardening — 2026-10-14

Branch `claude/v2-launch-hardening`, based on `d6a86fc255c7ccc64eb0b193e0ad24993f7da29d`
(PR #92 head, recorded production SHA; `origin/main` = `8b817ed…`, re-verified 2026-10-14).
Not pushed, not deployed. Release status from PR #92 (STOP-SHIP) still applies.

## Diagnosis

| # | Sev | Symptom (handoff §) | Failure stage | Finding | Evidence | Status |
|---|---|---|---|---|---|---|
| 1 | Blocker | Results open before external analysis (§7.2) | Client flow | `finish()` called `setPhase("dashboard")` and recorded `dashboard_generated` before `checkCurrentEvidence()` resolved; no processing phase existed | Code; browser run | **Fixed** |
| 2 | Blocker | Degree case: provider 200, 0 evidence blocks, 10 eligible URLs (§7.1) | Provider output (before source probe) | Not confirmed — no request/provider text was recorded. Hypotheses from code: (a) degree had no case-specific search guidance, unlike startup/industry; (b) the provider saw only bare labels "Program outcomes / Employment relevance / Funding" with no scope, while the instructions say to return an empty array when no source fits a bounded claim; (c) default degree scope omits `opportunityCost` (tuition/time/format), the facts most reliably published for EMBA programs; (d) a target like "EMBA" with no institution name | Code; PR #92 log | **Mitigated** (a, b, c, d); needs a real call to confirm |
| 3 | High | `fifwmScore()` turned null / "" / false into 0 (§8.4) | Scoring input | `Number(null) === 0` gave a missing FIFWM factor a weak score | Unit test | **Fixed** |
| 4 | High | "현재 직무와 생활 기반는" (§7.6) | Dynamic Korean sentence assembly | Fixed particles after customer labels in V3 engine and V2 analysis | Unit + browser | **Fixed** |
| 5 | Medium | Single Changing card in a 3-column print grid; large blank space (§7.5) | Print CSS | `.v2-changing-analysis` and `.v2-reasoning` always used `repeat(3, …)` in print | CSS + unit | **Fixed** (native PDF not yet checked) |
| 6 | Medium | Two-digit index wrapping (§7.5) | CSS flex shrink | Index spans in flex headings could shrink beside long Korean titles | CSS | **Fixed** (native PDF not yet checked) |
| 7 | Low | Korean pause condition read "…강함을 약화시키는" | V3 copy | A band label was used as an object noun | Code | **Fixed** (mirrors the English sentence) |

## Changes

- `AmcInteractiveV2.tsx`: new `processing` phase. "Analyze with public evidence" → processing screen → results open only on `live`. On failure the customer must choose: search again / edit target / view structural draft. `dashboard_generated` is recorded only when results actually open, with the real evidence status. There are no new event types and no DB change.
- `V2Processing.tsx` (new): shows the real request (target, geography, scope) and real elapsed time. There is no progress bar. Failure is classified as no_evidence / sources / timeout / service / response. It never shows provider text.
- `externalIntelligenceV2Service.ts`: degree-specific search guidance and a static `publicEvidenceDimensionScope` for education dimensions. The request fields, the defaults, source checks and fail-closed behavior are unchanged.
- `koreanParticle.ts` (new): `withKoreanParticle()` handles Hangul, digits, acronyms and Latin words. When the ending is unknown it uses the neutral form (은(는)). It is applied in `amcProductApplicationV3.ts` and `amcV2Analysis.ts`.
- `amcProductApplicationV3.ts`: `fifwmScore()` accepts only the numbers 0/1/2 or the strings "0"/"1"/"2". Weights, boundaries and guardrails are unchanged.
- Print CSS: `data-count` on Changing and reasoning sets 1 / 2 / 3 columns. Index numbers use `nowrap`.
- Degree target placeholder: "기관명과 과정명".
- Degree default public scope adds the existing `opportunityCost` area (owner decision 2026-10-14). No new area, question or score.

Preserved: FIFWM choices and score tables, posture support formula and 8/1 boundaries, guardrails, Safety Margin bands, the 7 simulator variables, the five-field public request contract, source probe strictness, privacy projection, research consent default false.

## Follow-up change: one card per (page, dimension) — owner decision 2026-10-14

- Server `inspectV2AgentResponse` and client `acceptV2Evidence` now dedupe on (source URL, dimension) instead of URL alone. A repeat of the same page **and** dimension is still excluded, and the existing `limitedEvidence` rule (drop provider summaries) still applies to it.
- Provider instruction: at most one block per (URL, dimension). Each block holds only that page's claims for that dimension, with no repeated claims and no self-corroboration.
- Dashboard and report label later cards from the same page "근거 N과 같은 출처 / same source as evidence N". The summary states the distinct source count, e.g. "공개 근거 2건(출처 1곳)".
- Source probe strictness is unchanged; each URL is still probed once.

## Step 1–2 results (2026-10-14, after one-card-per-(page, dimension))

Real calls on the Preview (`82d532b`), owner-approved 2 extra calls (6 total):

| Call | Target / geography | HTTP | Reason | Cards | Distinct sources | Coverage | Provider synthesis |
|---|---|---|---|---|---|---|---|
| after2-A | 서울대학교 경영전문대학원 EMBA / 서울 | 200 | live | 4 (outcomes, employment, funding, cost) | 1 | complete | kept (2 opportunity, 2 friction) |
| after2-B | 주말 EMBA 과정 / 서울 | 200 | live | 4 | 1 | complete | kept; states one program does not represent the market |

That is 1 card → 4. Tuition, schedule and employer-support conditions are now present. All cards cite one page, so the UI labels later cards as the same source and the summary shows "출처 1곳".

Additional fixes:
- The provider observation log now carries `requestShape`: case and area keys, whether the default areas were used, target and geography lengths. It holds no customer text. It goes only to the server log; there is no DB change.
- Role Upgrade / Downgrade role-scope play no longer uses exit wording ("퇴사 결정"). Corporate Stay vs Exit keeps it.

9-case walk-through (local prod build, structural-draft path, no provider, ops calls stubbed):
- All 9 cases in KO, plus degree, role and family in EN, reach the dashboard and an 8-section report with no `undefined` / `NaN` / `[object`, no detected particle errors, 0 evidence calls and no horizontal overflow.
- Changing card counts per case: 1–3, all rendered with the count-aware grid.

## Launch re-check and research UI (2026-10-14)

Quick audit (local prod build, KO degree and EN industry with the original assessment answered):

| Area | Result |
|---|---|
| External evidence | Preview: 4 cards per degree call after the (page, dimension) rule, synthesis kept; the original `no_evidence` was not reproduced in 6 calls |
| Framework | Industry + known target: all 5 FIFWM factors scored from original choices; coverage note "6 of 8 confirmed, 5 assessment items"; every analysis-sequence section renders. **Gap:** there is no explicit "Sustainability" heading |
| Analysis frame | Decision Map, Safety Margin, Changing (1–3), switches, next experiment present in all 9 cases (walk-through above) |
| EN/KO toggle | No untranslated system text in either direction. Only the customer's own free text stays in the language it was typed in (by design) |
| Line spacing | Screen body text 1.45–2.0. Only 6 simulator labels at 1.35 (11px labels). Every print rule is within 1.4–1.9 |

UI changes (no analysis or scoring changes):
- Fonts: Noto Sans KR and Noto Serif KR are now loaded. Before, Korean used whatever fallback font each customer's system had.
- Research masthead ("allofmycareer | Career Decision Research"), a serif headline with word-level Korean line breaks (fixes "결/정" mid-word wrap), an intake method block (Structure First, five lenses, verifiable public evidence, written answers not stored) and a non-advice footer.
- Waiting screen: a 4-step status where only real states change. Input check is done, search is running or failed, the rest stay waiting until results open. No percentages. Beside it is the Structure First philosophy, a rotating introduction to the five structural lenses (labelled as an introduction, not progress) and the sections the analysis will contain.
- The evidence-coverage note uses light text on the dark dashboard hero for contrast.

## Ops DB round trip and case-adapted assessment (2026-10-14)

- **Preview has no ops DB** (`backend_unavailable`), so Preview tests never write customer data.
- **Production DB round trip (owner-approved, 1 test journey):** on `app.allofmycareer.com`, structural-draft path, research consent off, no provider call. All 5 events were acknowledged `stored: true` on one record:
  - preview_started
  - full_intake_started
  - full_intake_completed
  - dashboard_generated
  - detailed_report_opened

  **Test record ID: `AMC-20261013-24CA46AE`; exclude it from statistics.** The record was not read back through admin, which needs owner login.
- Case-adapted structure assessment for Entrepreneurship, Degree, Overseas, Burnout and Family is implemented. General Career Reconfiguration uses the original Q18–22 when the target is known. The source label is `case-adapted`. Posture formula and boundaries are unchanged. The before/after table is in `docs/v2_case_fifwm_question_design.md`: no posture changed in 54 computed rows, because support moves by at most ±1.

## Owner test round 2 (2026-10-14) — inference, bilingual evidence, fan-out

Owner feedback after testing: the HK residency decision was typed as stay-or-exit; the customer was asked for the search target; KO cards showed Traditional Chinese; there was too little external evidence; the dashboard and report were sparse; differentiators were not visible.

Changes:
- **Decision type** is inferred from all three setup sentences. The setup screen shows the cue words, the detected place and plain-language alternatives. The search target and geography are prefilled from option B, and the customer edits them if needed.
- **Bilingual evidence**: one search returns `en` and `ko` wording, so the toggle switches wording without a new search. Cards not written in the requested language are excluded (`language_mismatch`). Original titles are listed under "Source references" in report section 9.
- **More evidence**:
  - research brief per decision type: procedures, requirements, timelines, market, pay, costs
  - scope definitions for every area
  - up to 6 cards; overseas defaults add compensation
  - V2 preset `medium` (`PERPLEXITY_V2_AGENT_PRESET` overrides)
  - **parallel topic searches** (≤3; overseas visa/residency alone)
  - 429 retry with Retry-After/backoff
  - searches stop at 95s keeping finished topics; source checks on their own 12s budget
  - function maxDuration 120s
- **Insight board**:
  - dashboard: Missing point / Safety Margin / Changing / Decision-switch tiles, a 7-axis structure radar (unknown dashed), a five-factor pentagon when assessed, and interactive market-vs-you rows
  - report: tiles on page 1; profile and expanded comparison on page 3
- **JEV advisory** beside the simulator: off unless `AMC_JEV_V2_ENABLED=true`; reference only.
- Site root `/` redirects to V2.

Real calls on the Preview (owner-approved), in order:

| Call | Setting | Result |
|---|---|---|
| HK | fast, single search | 2 cards (hiring, pay), bilingual OK, no Chinese, **no visa** |
| HK | medium, single search | result not captured (tool limit) |
| HK | medium, single search | timeout 50s |
| HK | medium, 120s | timeout 110s |
| Startup | medium, 120s | 4 cards, 103s |
| Degree | fan-out | **6 cards, 59s** (tuition 2,200만 원/term, employer 50% support, schedule, no published outcomes) |
| Startup | fan-out | 3 cards, 69s; one topic hit 429 |
| HK | fan-out | 429 on all topics → added retry |
| HK, full UI | fan-out + retry | reached source checks at ~105s, then the overall timeout discarded everything → split deadlines |
| HK, full UI | final | **live**: processing → dashboard; 2 cards (hiring, pay), no Chinese, 1 evidence request. **The visa and living-cost topics did not finish within 95s.** |

Open risk: **visa/residency evidence for HK is still not delivered.** That topic's medium search is slower than the budget. Options are a `low` preset for that topic only, or an asynchronous "evidence still arriving" mode. Either needs more real calls.

## Owner test round 3 (2026-10-14)

Changes:
- Two-field setup: current role/work and career considered. The decision sentence is derived; A/B wording is gone.
- "AMC" is renamed to "allofmycareer" in customer copy.
- Maps compare against a transition baseline derived from the posture formula (support 8–10), with a strengths / gaps / unconfirmed summary.
- Evidence rows show a labelled automatic first-pass comparison.
- Each card carries one preparation step (`action`). Briefs ask for amounts, named skills and where to prepare them, and living and dependants' costs. Citation markers are stripped.
- New framework action plan (Missing point, Safety Margin with cost figures, Changing, Switching, skills, checklist) on the dashboard and in report section 9.
- Long evidence text is collapsed in the reasoning cards.

Real checks on the Preview (2 analyses, owner-approved), full customer UI:

| Case | Result |
|---|---|
| UK PhD in philosophy | type and place (영국) inferred correctly; **all topic searches exceeded 95s → failure screen** |
| HK relocation | live. Hiring and pay cards with HK$ median wages (all employees HK$21,200; managers/professionals HK$32,700) shown under Safety Margin; checklist built from card actions; automatic comparison labels; no Chinese, no citation markers. **Visa and living-cost topics exceeded 95s.** |

Finding: with medium depth and the richer per-card content, most topics take more than 95s. The function-wide deadline (one serverless call for all topics) is now the binding limit.

## Progressive per-topic evidence (2026-10-14, owner: "allow more time, gather as much as possible")

- The browser sends one request per topic, so each topic has its own serverless budget (maxDuration 300s, search 240s, browser 270s). Topics are merged with the same shared rules (`shared/v2EvidenceMerge.ts`) as they arrive.
- Results open after the first usable topic. A banner lists topics still collecting, and arriving cards are added to the dashboard and report without a new search. The waiting screen shows each topic's real state.
- Up to 10 merged cards (each search still ≤ 6). Any card stating an amount (HK$, £, $, 원 …) is listed under Safety Margin.

Real checks on the Preview (2 analyses, owner-approved), full customer UI:

| Case | Result |
|---|---|
| UK PhD in philosophy | **6 cards**: Oxford DPhil career cases (no published employment rate), career support, faculty scholarships, UKRI studentships, doctoral loan up to £31,122 for courses from Aug 2026, loan eligibility. Checklist of 6 concrete steps. No Chinese, no citation markers. |
| HK relocation | **Visa evidence now delivered**: GEP needs a qualifying offer (about 4 weeks' processing), dependants (spouse/partner, unmarried children under 18), fees HK$600 application / HK$600 or HK$1,300 issue, permanent residence after 7 continuous years with a declaration; vacancies −8.4% YoY; HK$32,700 median for managers/professionals. The checklist covers documents, dependants' proof and per-person fee budgeting. The living-cost topic was cut by the old 6-card cap; the cap is now 10 for merged topics. |

## Production deployment (2026-10-14)

- Merged #93 and #94 into `experiment/allofmycareer-v2-rebuild`, then #92 into `main` (971e1f6). Production branch is `main` and the domain auto-assigns.
- `app.allofmycareer.com` serves the new build (new bundle, fonts; the API answers).
- Production check: QA journey "[QA TEST] 한국 대기업 마케팅 팀장 → 싱가포르 이직".
  - Typed as 해외 이동 / 싱가포르.
  - 3 topics, 10 cards (6 visa incl. the S$5,600 minimum salary, hiring, pay, region).
  - Brief consistent with the map; report 9 sections, 10 references; no Chinese or citation markers.
  - Ops events all `stored: true`. **Test record `AMC-20261014-3E9E5E56`; exclude it from statistics.**
- **JEV:** the call reached `/api/amc/jev-scenario` but returned `unavailable`. The cause was not logged; the next release logs a stage label and allows 20s instead of 3s (a46d012).
- Rollback: Vercel Instant Rollback to the d6a86fc production deployment.

## Verification performed

| Check | Result |
|---|---|
| `tsc --noEmit` | pass |
| `vite build` + server bundle | pass |
| web vitest (incl. bundle privacy after build) | 439 / 439 (baseline 394 + 1 build-dependent; 44 new) |
| root Node tests | 78 / 78 |
| Python unittest | 56 / 56 |
| Browser, local prod build, no provider key, KO degree case | processing shown while request in flight; dashboard not rendered; failure → 3 explicit choices; draft labelled; 1 evidence call across dashboard, report, EN↔KO |
| Browser, mocked `live` response (fetch-level, synthetic) | processing → dashboard opens automatically; 1 call |
| 390px dashboard | no horizontal overflow |

## Real provider calls (owner-approved budget: 4; used: 4)

Endpoint: production `app.allofmycareer.com` (recorded SHA `d6a86fc`; alias SHA not re-verified, no Vercel CLI auth).
De-identified degree requests, KO, default scope. Only the five public fields were sent.

| Call | Target / geography | HTTP | Reason / diagnostic | Cards | Notes |
|---|---|---|---|---|---|
| before-A | 서울대학교 경영전문대학원 EMBA / 서울 | 200 | live / duplicate_citation | 2 (partial) | outcomes (graduate counts) + program format/eligibility; no funding card |
| before-B | 주말 EMBA 과정 / 서울 | 200 | live / duplicate_citation | 2 (partial) | SNU + Yonsei program pages |

Findings:
- The 2026-10-13 `no_evidence` failure **did not reproduce** with these inputs. Its cause still depends on the original case's exact target, geography and chosen areas, or on provider variance. Root cause stays unconfirmed. Recording the categorical request shape (case, area keys, target length, whether a geography was given) next to `no_evidence` would make the next occurrence diagnosable without storing the text.
- Both calls hit `duplicate_citation`: the provider cited one page twice. By existing design (`limitedEvidence`), the extra card is dropped **and** all provider signals and the implication are replaced with a fixed scope note. So the customer receives facts but no synthesis. That design is a deliberate safety choice; changing it is a product decision.

After-calls on the Preview (`claude/v2-launch-hardening`, owner signed in to Vercel in the app browser; ops tracking calls were stubbed in-page so no test rows were written):

| Call | Target / geography | Path | HTTP | Reason / diagnostic | Cards | Notes |
|---|---|---|---|---|---|---|
| after-A | 서울대학교 경영전문대학원 EMBA / 서울 | direct API | 200 | live / duplicate_citation | 1 (partial) | program structure + "graduate outcome data not shown on this page"; 12.3s |
| after-B | 주말 EMBA 과정 / 서울 | full customer UI | 200 | live / duplicate_citation | 1 (partial) | processing screen shown, results opened only after `live`; scope showed 4 areas incl. cost |

- The changed service runs on Vercel serverless (no ESM/runtime failure).
- The new guidance shows up as intended: the card states that outcome data is not published instead of returning nothing.
- **duplicate_citation now dominates:** in 4 of 4 calls the provider cited one institution page for several areas, and the existing rule keeps only one card per URL. Requesting 4 areas made this worse (2 → 1 card), not better. This is the main remaining evidence-quality limiter and needs an owner decision: keep one card per URL, or allow one bounded card per (URL, area) while still excluding cross-source synthesis.
- UI on Preview: 1 evidence call across dashboard → report → EN↔KO; report 9 sections with sources; no horizontal overflow at 390px and 430px.

## Not verified (must not be reported as done)

- Root cause #2 remains a hypothesis; neither production nor the Preview reproduced `no_evidence` with de-identified inputs.
- Native browser Save as PDF: file name, cancel/title restore, physical pages and clipping.
- Real DB round trip of operations events (no `DATABASE_URL` locally).
- EN degree case and the source-probe exclusion path in a browser.
- Case-by-case framework coverage table for the 9 case types (§10 step 3) — next step.

## Rollback

Recorded production stays on `d6a86fc`. This branch is not deployed. To revert, discard the branch, or revert its commits on the experiment branch if it is merged later.
