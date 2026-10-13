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

## Not verified (must not be reported as done)

- Real Perplexity call for the degree case (cost; needs approval and a key). Root cause #2 remains a hypothesis.
- Native browser Save as PDF: file name, cancel/title restore, physical pages and clipping.
- Real DB round trip of operations events (no `DATABASE_URL` locally).
- Vercel serverless runtime of the changed service module (ESM; see PR #79). Preview deploy needed.
- 430px, EN degree case, partial-evidence (source-probe exclusion) path in a browser.
- Case-by-case framework coverage table for the 9 case types (§10 step 3) — next step.

## Rollback

Recorded production stays on `d6a86fc`. This branch is not deployed. To revert, discard the branch, or revert its commits on the experiment branch if it is merged later.
