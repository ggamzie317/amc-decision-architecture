# AMC x Manus Render Contract v1

## Status
- Frozen v1 contract artifact set.
- Canonical schema: `schemas/amc_manus_render.schema.json`.
- Canonical fixtures:
  - `examples/amc_manus_render_single_v1.json`
  - `examples/amc_manus_render_comparative_v1.json`

## Contract Boundaries
- AMC owns analysis logic, scoring logic, and philosophy.
- Manus is renderer-only for this package.
- Section order is locked by `layout_rules.section_order`.
- Recommendation language is forbidden by governance and forbidden-transformation rules.
- First page must render conclusion-first.
- Comparative mode must render table-first.
- Scored and non-scored layers must remain visibly separated.

## Governance Freeze Rule
- Future changes to this contract require an explicit versioned change request (for example, `v2`) or a blocker-level exception.
- Non-versioned structural drift in keys, section order, or governance fields is out of contract.

## Alignment Note
- This schema is frozen as the AMC x Manus handoff contract shape.
- Field naming may still require one pass of manual alignment with the current AMC payload export naming in integration wiring.
