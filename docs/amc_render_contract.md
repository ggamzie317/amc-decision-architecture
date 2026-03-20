# AMC Render Contract and Quality Governance

## Purpose
The AMC render pipeline exists to produce stable DOCX outputs from AMC intake data using:
- deterministic section builders,
- a nested render context,
- `docxtpl` rendering with strict undeclared-variable checks,
- golden fixture regression coverage.

This document defines what is considered stable contract behavior and how changes are governed.

## Contract Baseline
Option B migration baseline commit: `1af07b1`.

Unless explicitly approved as a contract update, changes should preserve compatibility with the behavior established at this baseline.

## Locale Resolution Rule
Render locale precedence is stable and must remain:
1. CLI/options override (`--lang` / `locale`)
2. `intake.lang`
3. default locale (`en`)

This locale layer currently applies to render-owned fixed strings only, not dynamic Step 4 prose or DOCX heading localization.

## Render-Owned Boundary (Current)
- `exploration_plan.experiment_1/2/3.timeline` remains render-owned.
- Upstream native metadata currently covers:
  - `decision_conditions.nativeMetadata.explorationDesignHints`
  - `decision_conditions.nativeMetadata.reassessmentTriggerType`
- Timeline ownership is intentionally not upstream-native yet; moving timelines upstream would be a deliberate future contract decision.

## Stable Render Contract (Section-Level)
The production template expects a stable nested context with these top-level namespaces:
- `meta`
- `mode`
- `case`
- `executive_summary`
- `external_snapshot`
- `comparative_snapshot`
- `matrix`
- `diagnosis`
- `exploration_plan`
- `execution_map`
- `assumptions_watchlist`
- `commitment`

Section-level stability requirement:
- Existing template-referenced keys under these namespaces must remain available.
- Key renames/removals are contract-breaking unless template + tests + fixtures are updated in the same change.

## What `--strict-undeclared` Guarantees
`--strict-undeclared` enforces:
- template variables unresolved by context are treated as errors,
- render fails instead of silently producing partial output.

It is a structural contract gate, not a semantic quality gate.

## What Golden Fixtures Guarantee
Golden fixtures provide representative baseline coverage for:
- single-path cases,
- comparative cases,
- sparse/fallback-heavy edge cases.

Golden run outputs (`output/golden/`) provide:
- deterministic render artifacts per fixture,
- `review_summary.json` / `review_summary.md` for quick regression scanning.

## What CI Artifacts Are For
CI uploads two artifact groups:
1. strict single/comparative render outputs
2. golden fixture outputs (`output/golden/`)

Artifacts are for:
- regression inspection,
- semantic drift review,
- auditability of output changes in PRs.

## Auto-Gated vs Human-Reviewed
Auto-gated:
- strict single render succeeds
- strict comparative render succeeds
- strict undeclared-variable checks pass
- golden fixture script completes

Human-reviewed:
- tone restraint (non-coaching, analytical voice)
- semantic plausibility across sections
- fallback appropriateness
- comparative asymmetry reasonableness

## Contract-Breaking Change Definition
Any of the following is contract-breaking:
- removing/renaming template-referenced nested keys without coordinated template migration
- changing renderer behavior so strict undeclared checks no longer enforce missing-variable failures
- changing paths/entrypoints so canonical render commands no longer reproduce outputs
- altering comparative visibility behavior in single/comparative modes without explicit governance update
- editing the production template without passing `--strict-undeclared` renders for both `examples/amc_sample_single.json` and `examples/amc_sample_comparative.json`

## Safe Data-Layer Refinement Definition
Typically safe (with validation):
- improving upstream signal quality while preserving output keys
- replacing fallback/inferred values with more native upstream signals
- tightening mapping logic without changing template contract
- adjusting rubric/runbook guidance

## Change Classification
### Safe
- mapping quality improvements that preserve existing render keys and strict behavior
- additive metadata not consumed by template

### Review-Required
- changes that alter rendered prose shape materially
- changes that affect fallback frequency/visibility
- changes that alter comparative status asymmetry behavior

### Contract-Breaking
- key/path contract changes
- strict gate weakening
- template-variable contract drift

## Future Change Checklist
Before merging render-related changes:
1. Run strict single render.
2. Run strict comparative render.
3. Run golden fixture render script.
4. Review `output/golden/review_summary.json` and `review_summary.md` for fallback/native-dimension shifts.
5. Decide if human DOCX review is required (tone/semantic plausibility/comparative visibility).
6. Confirm whether change is safe, review-required, or contract-breaking.

## Canonical Commands
Strict single:
```bash
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --strict-undeclared
```

Strict comparative:
```bash
pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts --comparative --strict-undeclared
```

Golden fixture run:
```bash
bash scripts/render_golden_fixtures.sh
```
