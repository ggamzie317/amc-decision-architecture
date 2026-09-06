# Task 024 — AMC V3 Minimal Posture Safety Guardrail & Brand Alignment

## Startup preflight

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/024-minimal-posture-safety-guardrail.md
```

## Objective

Add one narrow Safety Margin guardrail to AMC V3 posture derivation and align the reconfigure label without changing the existing structural scoring model.

## Context

A structurally strong transition case can still carry execution exposure that is too constrained for the transition posture. AMC must preserve the opportunity evidence while expressing a bounded validation posture when the current Safety Margin and recovery/downside structure require it.

## Scope

- Preserve the existing posture support formula, weights, and thresholds.
- After candidate posture derivation, change only a transition candidate to validate when Safety Margin is weak and either reversibility is weak or structural risk is high.
- Keep reconfigure, validate, normal transition, and unknown-signal behavior otherwise unchanged.
- Use the effective posture consistently in the posture copy, Why, Decision Switches, experiment, Dashboard, and Report.
- Rename the reconfigure customer label in English and Korean and remove employer-stay implications from its sentence.
- Add deterministic regression coverage for trigger combinations, non-triggers, thresholds, localization, renderer consistency, and existing contracts.

## Non-goals

- No FIFWM, Safety Margin formula, scoring weight, or threshold changes.
- No keyword parsing or AI calls.
- No new API, database, persistence, UI panel, score, or methodology system.
- No changes to Changing discovery.
- No Production deployment, merge, historical rewrite, or tester contact.

## Files likely involved

- `manus-ui/client/src/data/amcProductApplicationV3.ts`
- `manus-ui/tests/product-application-v3.test.ts`

## Implementation requirements

- Code change, limited to the posture engine and its regression tests.
- Preserve AMC's non-prescriptive language and current customer-facing terminology.
- Keep the candidate calculation inspectable so threshold and guardrail behavior can be tested directly.
- The guardrail must never force reconfigure and weak Safety Margin alone must not activate it.

## Verification commands

```bash
pnpm --dir manus-ui test:product-application-v3
pnpm --dir manus-ui test:customer-language-firewall
pnpm --dir manus-ui test:founder-ops-lifecycle
pnpm --dir manus-ui check
pnpm --dir manus-ui build
git diff --check
```

## Review checklist

- Candidate thresholds remain transition at 8 or above and reconfigure at 1 or below.
- Guardrail is exactly weak Safety Margin plus weak reversibility or high structural risk on a transition candidate.
- Effective posture is used by both customer renderers and downstream switches/experiment.
- Opportunity evidence remains visible in guarded output.
- English and Korean labels and sentences remain descriptive rather than directive.
- No out-of-scope architecture, persistence, UX, or deployment change.
- Verification commands were run and reported.
