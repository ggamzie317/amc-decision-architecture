# AMC Golden Fixture Review Rubric

Use this rubric for semantic regression review after rendering the golden fixture set.

## 1) Structural Clarity
- Executive summary lines are coherent and non-contradictory.
- Diagnosis reads as structural interpretation, not generic filler.
- Commitment section states conditions clearly and concretely.

## 2) Comparative Visibility Behavior
- `single`/`single_path` cases do not prominently render comparative blocks.
- `comparative` cases render External Comparative Snapshot table-first.
- Option A/B labels appear correctly in comparative cases.

## 3) Fallback Visibility
- Sparse cases show explicit fallback text where needed (e.g., `[Not applicable]`).
- Fallback usage is visible but not excessive in fully populated cases.

## 4) Tone Restraint
- Language remains analytical and restrained.
- No recommendation/coaching language (e.g., "you should", "best choice").

## 5) Semantic Plausibility
- Comparative statuses align with option text intent.
- Diagnosis and commitment implications are plausible given inputs.
- No obvious contradictions across sections.

## Quick Gate
- Placeholder leakage = 0 for all fixtures.
- Strict render succeeds for all fixtures.
- Comparative visibility behavior matches case type.

## Related Docs
- `docs/amc_golden_fixture_runbook.md`
- `docs/amc_render_contract.md`
- `docs/amc_document_drift_policy.md`
- `docs/amc_native_metadata_inventory.md`
- `docs/amc_render_ci_troubleshooting.md`
