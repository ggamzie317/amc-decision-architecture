# AMC -> Manus Render Mapping v1

## Scope
- Source: live AMC payload shape currently generated in repo (`amc_docx_payload` JSON).
- Target: `schemas/amc_manus_render.schema.json`.
- Mode coverage: single + comparative.

## Source Payload Confirmed
Observed live top-level payload blocks:
- `meta`, `mode`, `case`, `executive_summary`, `external_snapshot`, `comparative_snapshot`, `matrix`, `diagnosis`, `career_value_structure`, `career_mobility_structure`, `strategic_temperament`, `exploration_plan`, `execution_map`, `assumptions_watchlist`, `commitment`.

## Mapping Table (v1)
| Manus target field | AMC source field(s) | Transform | Mapping type | Notes |
|---|---|---|---|---|
| `contract_version` | none in payload | constant `amc_manus_render_v1` | derived | Contract-layer constant. |
| `report_metadata.report_id` | none in payload | use submission id / case id from orchestration context | derived | Not present in payload body. |
| `report_metadata.case_mode` | `mode` | map `single -> single`, `comparative -> comparative` | direct | Direct enum map. |
| `report_metadata.language` | none in payload | use handoff language from submission context | derived | Not emitted in current payload. |
| `report_metadata.generated_at` | `meta.generated_at` | pass-through | direct | Direct field. |
| `report_metadata.template_baseline` | none in payload | constant from runtime template path | derived | Use freeze baseline path. |
| `governance.*` | none in payload | constants (`true`) | derived | Contract governance layer, renderer-owned. |
| `labels.executive_layer` | `case.verdict_label` or constant | prefer constant `Structural Reading` | derived | `case.verdict_label` differs by mode in current payload. |
| `labels.measurement_layer` | none in payload | constant `Measurement Layer` | derived | Renderer label. |
| `labels.interpretation_layer` | none in payload | constant `Interpretation Layer` | derived | Renderer label. |
| `labels.comparative_snapshot_label` | none in payload | constant `External Comparative Snapshot` | derived | Renderer label. |
| `layout_rules.first_page.mode` | none in payload | constant `conclusion_first` | derived | Contract rule. |
| `layout_rules.first_page.support_text_quiet` | none in payload | constant `true` | derived | Contract rule. |
| `layout_rules.comparative.mode` | none in payload | constant `table_first` | derived | Contract rule. |
| `layout_rules.comparative.legend_secondary` | none in payload | constant `true` | derived | Contract rule. |
| `layout_rules.comparative.reading_lines_compact` | none in payload | constant `true` | derived | Contract rule. |
| `layout_rules.layer_separation.*` | none in payload | constants (`true`) | derived | Contract rule. |
| `layout_rules.section_order` | not explicit in payload | fixed v1 order list by mode | derived | Must be enforced in mapper/renderer, not read from payload. |
| `sections[]` | multiple object blocks | construct section array from fixed section ID order | needs normalization | Current AMC payload is object-based, not section-array-based. |
| `sections[].id` | source block identity | map by fixed dictionary | needs normalization | Example: `executive_summary -> executive_structural_reading`. |
| `sections[].heading` | none canonical per block | section-title constants | derived | Renderer title layer. |
| `sections[].intent_line` | none canonical per block | concise per-section constants | derived | Not present in live payload. |
| `sections[].conclusion_line` | section-specific sentences | pick primary conclusion sentence per section | needs normalization | Selection rules needed (below). |
| `sections[].support_line` | section-specific sentences | pick support sentence per section | needs normalization | Selection rules needed (below). |
| `sections[].basis_line` | `executive_summary.assessment_basis_line` + section condition/read lines | prefer section basis if available, else executive basis | needs normalization | Basis language not consistently explicit by section. |
| `sections[].scored_layer.visible` | section type + data presence | boolean by section mapping rule | derived | Some sections are non-scored in v1. |
| `sections[].scored_layer.items[].name` | `matrix.*` keys | key-to-label map | needs normalization | e.g., `market_outlook -> Market Outlook`. |
| `sections[].scored_layer.items[].score` | `matrix.*.score` | normalize 0..2 to 0..100 (`round(score/2*100)`) | needs normalization | Required to satisfy Manus score range. |
| `sections[].scored_layer.items[].band` | `matrix.*.visual` | visual-to-band map | needs normalization | See normalization map below. |
| `sections[].non_scored_layer.visible` | section type + data presence | boolean by section mapping rule | derived | Usually true for interpretive sections. |
| `sections[].non_scored_layer.items[]` | diagnosis/value/mobility/temperament/commitment lines | collect ordered interpretive lines | direct/normalization | Direct fields, but ordering normalization needed. |
| `sections[].comparative_table` | `comparative_snapshot.option_a/option_b`, `case.option_*_label`, `comparative_snapshot.legend` | construct 3-column table | needs normalization | Required only for `external_comparative_snapshot` in comparative mode. |
| `forbidden_transformations[]` | none in payload | constant list from contract | derived | Governance layer. |
| `qa_hints.*` | none in payload | constant booleans (`true`) | derived | QA layer. |

## Section-Level Mapping Rules

### 1) `executive_structural_reading`
- Conclusion: `executive_summary.verdict_line`.
- Support: `executive_summary.structural_risk_line` (fallback `executive_summary.personal_exposure_line`).
- Basis: `executive_summary.assessment_basis_line`.
- Scored layer: selected `matrix` items as measurement summary.

### 2) `external_comparative_snapshot` (comparative mode only)
- Conclusion: `comparative_snapshot.reading`.
- Support: `comparative_snapshot.implication`.
- Basis: `comparative_snapshot.legend` or executive basis fallback.
- Comparative table:
  - Columns: `Dimension`, `case.option_a_label`, `case.option_b_label`.
  - Rows from status pairs:
    - Market: `comparative_snapshot.option_a.market_status` vs `option_b.market_status`
    - Competition: `...competition_status`
    - Economic: `...economic_status`
    - Transition friction: `...transition_status`
  - Legend: `comparative_snapshot.legend`.

### 3) `structural_risk_diagnosis`
- Conclusion: `diagnosis.fifwm_risk.read` or consolidated `diagnosis.*.risk` priority line.
- Support: `diagnosis.fifwm_risk.risk`.
- Basis: `diagnosis.fifwm_risk.condition`.
- Scored layer: matrix subset (`fifwm_risk`, `upside_downside`, `company_stability`).

### 4) `career_value_structure`
- Conclusion: `career_value_structure.tension_line`.
- Support: `career_value_structure.alignment_line`.
- Basis: `career_value_structure.primary_value_line`.
- Non-scored items: include `secondary_value_line`, comparative reading where applicable.

### 5) `career_mobility_structure`
- Conclusion: `career_mobility_structure.mobility_line`.
- Support: `career_mobility_structure.burden_line`.
- Basis: `career_mobility_structure.timing_line`.
- Non-scored items: include `portability_line`, comparative reading where applicable.

### 6) `strategic_temperament`
- Conclusion: `strategic_temperament.posture_line`.
- Support: `strategic_temperament.discipline_line`.
- Basis: `strategic_temperament.evidence_line`.
- Non-scored items: include `pace_line`, comparative reading where applicable.

### 7) `decision_conditions`
- Conclusion: `commitment.commitment_condition`.
- Support: `commitment.readiness_condition`.
- Basis: `commitment.validation_condition`.
- Non-scored items: include `support_condition`, `reassessment_trigger`.

## Score Band Normalization (Required)
Live AMC visuals are symbol-based and must normalize to Manus bands:
- `▼ Constrained` -> `low`
- `● Elevated` -> `low`
- `◆ Mixed` -> `guarded`
- `◐ Moderate` -> `guarded`
- `▲ Supportive` -> `stable`
- `○ Contained` -> `stable`
- `strong` currently has no direct symbol in observed payload; optional threshold rule can map high normalized numeric scores (for example >= 85) to `strong` if needed.

Numeric normalization:
- Source `matrix.*.score` currently observed in `0..2`.
- Manus contract requires `0..100`.
- Proposed v1 normalization: `normalized_score = round((source_score / 2) * 100)`.

## Section Order Lock Alignment
Target lock (v1):
- Single: `executive_structural_reading -> structural_risk_diagnosis -> career_value_structure -> career_mobility_structure -> strategic_temperament -> decision_conditions`
- Comparative: `executive_structural_reading -> external_comparative_snapshot -> structural_risk_diagnosis -> career_value_structure -> career_mobility_structure -> strategic_temperament -> decision_conditions`

Current AMC payload does not emit a `sections[]` array; order must be imposed by mapping logic.

## Mapping Feasibility Summary
- Directly mappable now: most analytical content blocks and sentence lines.
- Requires derivation/constants: governance, labels, layout rules, qa hints, section titles/intent lines.
- Requires normalization: section array construction, score scale and band mapping, comparative table shaping.

## Remaining Blockers (for strict automated mapping)
1. `report_metadata.report_id` not present in current payload body.
2. `report_metadata.language` not present in current payload body.
3. `report_metadata.template_baseline` not present in current payload body.
4. `sections[].intent_line` has no live source field (must be renderer constants).
5. `sections[].comparative_table.rows[].option_a/option_b` narrative-level cells are not present; current payload provides status symbols only.

These are integration-layer blockers, not AMC logic blockers.
