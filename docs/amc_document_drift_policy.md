# AMC Document Drift Policy

## Purpose
Prevent drift between report architecture, render contract, placeholder inventory, metadata inventory, and sample outputs.

## Source of truth
The following must stay aligned:
- report section architecture
- render contract
- DOCX placeholder inventory
- native metadata inventory
- sample payloads / sample outputs
- tier behavior documentation
- single-case vs comparative-case rendering rules

## Update triggers
Update documentation when any of the following changes:
- section names
- section order or hierarchy
- placeholder keys are added, removed, or renamed
- metadata keys are added, removed, or renamed
- render contract fields change
- tier inclusion or exclusion rules change
- comparative vs single-case rendering rules change
- visible wording rules materially change
- output naming conventions change

## Required sync checks before merge
Before merge, confirm:
- render contract matches current generator behavior
- placeholder inventory matches current template state
- metadata inventory matches actual produced fields
- sample payloads reflect the current contract
- tier documentation matches actual output behavior
- comparative and single-case rules remain explicitly documented

## PR rule
If a PR touches any trigger above, it must include one of the following:
- a documentation update in the same PR, or
- an explicit note stating why no documentation update was required

## Review preference
Prefer small documentation updates in the same PR that changes architecture or output behavior.
Do not defer doc-sync work to a later PR unless there is a clear reason.

## Related Docs
- `docs/amc_render_contract.md`
- `docs/amc_native_metadata_inventory.md`
- `docs/amc_golden_fixture_runbook.md`
- `docs/amc_golden_review_rubric.md`
- `docs/amc_render_ci_troubleshooting.md`
