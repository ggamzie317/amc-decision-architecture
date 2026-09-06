# Task 025 — Complete Current-Web Structural Signal Runtime

## Objective

Connect every defensible structured signal already available in the 29-question public intake to AMC V3 while leaving unsupported signals explicitly unknown.

## Context

The public runtime currently uses live external evidence and Q19–Q21 Safety Margin structure, but several posture inputs remain unavailable. The runtime should use explicit user-selected evidence without inferring structure from prose or inventing FIFWM scores.

## Scope

- Audit FIFWM generation from Python scoring through report payload and submission wiring.
- Audit current sources for all Product Application structural signals.
- Preserve external evidence and Q19–Q21 Safety Margin wiring.
- Reuse valid structured sources where they exist; otherwise add at most one compact selector inside an existing Internal Readiness, Support System, or Timing and Constraints question card.
- Keep missing-point impact unavailable unless a deterministic current-case evidence source already exists.
- Assemble current-case structural signals through one small pure helper with accurate provenance.
- Persist any added structured selections separately from free-text answers using the existing JSONB-compatible submission shape.
- Add deterministic runtime, localization, persistence, privacy, and Task 024 regression coverage.

## Non-goals

- No new question IDs or more than 29 intake questions.
- No prose keyword, sentiment, regex, word-count, LLM, or external API scoring.
- No fabricated or default FIFWM factor scores.
- No posture weights, thresholds, Safety Margin formula, Task 024 guardrail, Changing, external evidence contract, database schema, or API redesign.
- No Production data access, submission creation, merge, deployment, dependency, authentication, payment, or advertising work.

## Files likely involved

- `manus-ui/client/src/pages/AmcWebMvp.tsx`
- `manus-ui/client/src/data/amcProductApplicationV3.ts`
- `manus-ui/client/src/data/intakeQuestionnaire.ts`
- `manus-ui/client/src/data/amcFounderOpsDerived.ts`
- `manus-ui/server/amcSubmissionBridge.ts`
- `manus-ui/tests/product-application-v3.test.ts`
- targeted Task 025 tests if useful

## Implementation requirements

- Keep the patch small and inspectable.
- Structured selectors must default to unknown and use `current-user-structured` only when the user makes an explicit selection.
- Free-text answers remain unchanged and must never preselect a band.
- Preserve the existing Dashboard and Detailed Report renderers and customer-language firewall.
- Use existing JSON payloads when persistence is needed; do not add a migration unless the audit proves it unavoidable.

## Runtime audit decision

| Signal | Baseline source | Valid connection | Evidence required | Task action |
|---|---|---|---|---|
| FIFWM Formal | Unavailable in public web | No | Canonical current-case factor output | Keep unavailable |
| FIFWM Informal | Unavailable in public web | No | Canonical current-case factor output | Keep unavailable |
| FIFWM Framework | Unavailable in public web | No | Canonical current-case factor output | Keep unavailable |
| FIFWM Workflow | Unavailable in public web | No | Canonical current-case factor output | Keep unavailable |
| FIFWM Market / Policy | Unavailable in public web | No | Canonical current-case factor output | Keep unavailable |
| External validation | Live external snapshot | Yes | Genuinely live snapshot direction and confidence | Preserve and centralize |
| Internal readiness | Unavailable | Yes, by explicit selection | User assessment inside Q17 | Add selector |
| Safety Margin | Q19–Q21 structured values | Yes | At least two known dimensions | Preserve derivation |
| Reversibility | Q20 structured value | Yes | User selection | Preserve |
| Option B support | Unavailable | Yes, by explicit selection | User assessment inside Q23 | Add selector |
| Structural risk | Q21 structured value | Yes | User selection | Preserve |
| Constraint load | Unavailable | Yes, by explicit selection | User assessment inside Q25 | Add selector |
| Missing-point impact | Case-type prose only | No | Inspectable current-case impact classification | Keep unavailable |

`src/scoring/fifwm.py` only clamps and formats supplied factor values. The report builder resolves F_* scores from a separate legacy structured intake through Q18–Q22 score fields. Those question meanings and that pipeline are not the current public 29-question flow, so reuse would be a false mapping.

## Verification commands

```bash
pnpm --dir manus-ui test:product-application-v3
pnpm --dir manus-ui test:customer-language-firewall
pnpm --dir manus-ui test:founder-ops-lifecycle
pnpm --dir manus-ui test:public-bundle-privacy
pnpm --dir manus-ui check
pnpm --dir manus-ui build
python3 -m unittest discover -s tests -v
git diff --check
```

## Review checklist

- The intake remains exactly 29 questions with IDs 1–29.
- Every connected band has explicit evidence and accurate provenance.
- Unsupported signals and FIFWM remain unavailable.
- Same structured selections produce the same posture independent of prose and language.
- Task 024 support thresholds and guardrail remain unchanged.
- Changing remains 0–3 and evidence-triggered.
- New selector data is separated from raw answers and persists without schema changes.
- No Production interaction, merge, or deployment occurred.

## Implementation and verification record

- Added explicit structured selections inside Q17, Q23, and Q25; retained the existing Q19–Q21 selections and every free-text field.
- Centralized live external evidence, user selections, Safety Margin derivation, and unavailable fallbacks in `amcCurrentCaseStructuralSignals.ts`.
- Kept all five FIFWM factors and Missing Point impact unavailable because the current public flow has no defensible canonical mapping for them.
- Persisted the resulting bands and provenance in the existing `structuralOutputJson.postureBasis`, separately from `answersJson`, with no schema migration.
- Confirmed the 8/1 posture thresholds, Task 024 guardrail, Safety Margin formula, Changing derivation, and shared Dashboard/Report product object remain unchanged.
- Passed the Task 025 runtime tests (7), Product Application V3 tests (22), customer-language firewall tests (3), Founder Ops lifecycle tests (8), public-bundle privacy tests (2), TypeScript check, production build, and `git diff --check`.
- Python discovery ran 56 tests: 54 passed and two untouched legacy localization assertions failed because they expect English external-snapshot titles while the fixture currently returns Korean titles (`test_external_snapshot_title_academic`, `test_external_snapshot_title_industry`).
