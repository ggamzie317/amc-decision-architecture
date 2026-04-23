# AMC -> Manus Orchestration and Enrichment Rules v1

## Purpose
Define how non-direct fields in the frozen AMC->Manus render contract are populated without changing AMC analysis logic.

## Scope
This document resolves the blocker fields identified in `docs/amc_to_manus_mapping_v1.md` for:
- `report_metadata.report_id`
- `report_metadata.language`
- `report_metadata.template_baseline`
- `sections[].intent_line`
- `sections[].comparative_table.rows[].option_a` / `option_b` narrative cells

## Rule Set

### 1) `report_metadata.report_id`
- Source of truth: orchestration context.
- Source type: orchestration context.
- Population rule:
  1. Use submission-level case identifier from orchestration (`submissionId` / case id used for output folder).
  2. If comparative, append mode marker only if orchestration requires uniqueness across mode variants.
- Fallback rule:
  - If no orchestration case id exists, use deterministic fallback:
    - `amc-{case_mode}-{meta.generated_at}` with non-alphanumeric chars replaced by `_`.

### 2) `report_metadata.language`
- Source of truth: orchestration handoff language used to generate the report.
- Source type: orchestration context.
- Population rule:
  1. Read language from the same handoff/input context that drove AMC render (`handoff.language` / equivalent runtime locale input).
  2. For current v1 schema, normalize to `en`.
- Fallback rule:
  - If orchestration language is missing, set `en`.

### 3) `report_metadata.template_baseline`
- Source of truth: frozen template baseline path.
- Source type: fixed constant.
- Population rule:
  - Always set:
    - `templates/AMC_Strategic_Career_Decision_Template_v3_4_working.docx`
- Fallback rule:
  - No dynamic fallback. If runtime template differs, mapping step should fail contract check and require explicit post-freeze change request.

### 4) `sections[].intent_line`
- Source of truth: fixed section-intent dictionary owned by orchestration mapper.
- Source type: fixed constant.
- Population rule:
  - Populate by `sections[].id` using this dictionary:
    - `executive_structural_reading`: `Frame the case in one defensible structural view.`
    - `external_comparative_snapshot`: `Surface path-level asymmetry with table-first readability.`
    - `structural_risk_diagnosis`: `Identify where fragility is concentrated.`
    - `career_value_structure`: `Clarify what is protected versus surrendered.`
    - `career_mobility_structure`: `Read transferability, conversion burden, and timing exposure.`
    - `strategic_temperament`: `Assess governance posture under structural pressure.`
    - `decision_conditions`: `Define commitment defensibility thresholds.`
- Fallback rule:
  - If section id is unknown, use:
    - `Structural interpretation for this section.`
  - Also flag mapping warning for unknown section id.

### 5) `sections[].comparative_table.rows[].option_a` / `option_b` narrative cells
- Source of truth: comparative status fields plus deterministic narrative-enrichment map.
- Source type: normalization/enrichment rule.
- Population rule:
  1. Build rows from comparative dimensions:
     - market, competition, economic, transition
  2. For each path cell, convert status symbol to short narrative phrase using dimension-aware mapping.
  3. Compose each cell as:
     - `{status_phrase}; {implication_phrase}`

#### 5.1 Status normalization
- `▲ Supportive` -> `supportive conditions`
- `◆ Mixed` -> `mixed conditions`
- `▼ Constrained` -> `constrained conditions`
- `○ Contained` -> `contained burden`
- `◐ Moderate` -> `moderate burden`
- `● Elevated` -> `elevated burden`

#### 5.2 Dimension-aware implication phrases
- `market`
  - supportive/mixed/constrained -> `demand visibility context`
- `competition`
  - supportive/mixed/constrained or burden status -> `portability pressure context`
- `economic`
  - supportive/mixed/constrained or burden status -> `cost and timing pressure context`
- `transition`
  - contained/moderate/elevated -> `conversion friction context`

#### 5.3 Cell construction examples
- Market + `◆ Mixed` -> `mixed conditions; demand visibility remains uneven.`
- Transition + `● Elevated` -> `elevated burden; conversion friction is high under current assumptions.`

- Fallback rule:
  - If a status token is missing or unknown, use:
    - `conditions unclear; requires direct evidence before commitment.`
  - If a comparative dimension is missing, omit that row and emit mapping warning.

## Determinism Requirements
- Orchestration/enrichment must be deterministic for identical source payload + context.
- No recommendation language may be introduced in enrichment output.
- Enrichment text must remain compact and table-supportive (no paragraph expansion).

## Validation Gate (Pre-Wiring)
For each mapped output package:
1. `report_metadata` fields are present and non-empty.
2. Every section has `intent_line` populated.
3. Comparative mode includes narrative cells for both options in each emitted row.
4. Contract schema validation passes against `schemas/amc_manus_render.schema.json`.

## Versioning Rule
- These rules are frozen as v1 with the current contract.
- Any change to constants, enrichment phrases, or fallback behavior requires explicit v2 or post-freeze change approval.
