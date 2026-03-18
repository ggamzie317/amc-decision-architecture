# AMC Golden Fixture Runbook

## Purpose
Provide a stable representative set of AMC cases to evaluate semantic regressions without changing render architecture.

## Run

```bash
./scripts/render_golden_fixtures.sh
```

## Review Inputs
- `output/golden/review_summary.json`
- `output/golden/review_summary.md`
- `docs/amc_golden_review_rubric.md`

## Review Gate
1. `leftover_placeholders == 0` for all fixtures.
2. Comparative visibility matches case type.
3. Fallback visibility is acceptable for sparse fixtures.
4. Tone remains restrained and structurally analytical.
5. Comparative statuses and implications remain semantically plausible.

## CI Behavior
- Structural render checks are auto-gated in CI (strict single/comparative render + strict golden render script).
- `output/golden/review_summary.json` and `output/golden/review_summary.md` are uploaded as CI artifacts for semantic review.
- Semantic plausibility is still a human review gate, not a hard automated fail condition.

## Current Fixture Set
- `single_internal_continuity`
- `single_external_transition_high_exposure`
- `single_supported_growth`
- `comparative_continuity_vs_transition`
- `comparative_degree_gate`
- `comparative_relocation_friction`
- `edge_sparse_single`
- `edge_sparse_comparative`

## Known Gaps
- Tone/semantic plausibility still requires human review.
- Comparative per-option statuses are signal-driven but may fallback to bucket-level inference when option text is weak.
