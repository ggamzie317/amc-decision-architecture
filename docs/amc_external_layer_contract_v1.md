# AMC External Layer Contract v1

Use this doc when integrating external intelligence providers (for example Perplexity Sonar) into AMC without reopening render/template design.

## Purpose
Freeze the pre-automation external-layer input shape and behavior so automation can plug in safely while preserving current AMC output contracts.

## Scope
- Applies to upstream external intelligence inputs that feed AMC `external_snapshot`.
- Does not change template placeholders or section architecture.
- Supports both `single_path` and `comparative` outputs.

## Canonical Payload Shape (Provider Output)
```json
{
  "market_direction": {
    "status": "supportive|mixed|constrained",
    "summary": "...",
    "evidence": ["...", "..."]
  },
  "competition_pressure": {
    "status": "contained|moderate|elevated",
    "summary": "...",
    "evidence": ["...", "..."]
  },
  "economic_pressure": {
    "status": "contained|moderate|elevated",
    "summary": "...",
    "evidence": ["...", "..."]
  },
  "transition_friction": {
    "status": "contained|moderate|elevated",
    "summary": "...",
    "evidence": ["...", "..."]
  },
  "source_notes": ["...", "..."],
  "market_data_date": "YYYY-MM-DD or best available"
}
```

## Internal Override Shape (AMC Adapter Input)
`AmcExternalSnapshotOverride`:
- `source: "perplexity_sonar"`
- `marketDirection`
- `competitionPressure`
- `economicPressure`
- `transitionFriction`
- `sourceNotes`
- `marketDataDate`

## Enum Rules
- `market_direction.status`:
  - `supportive`
  - `mixed`
  - `constrained`
- pressure/friction statuses:
  - `contained`
  - `moderate`
  - `elevated`

Unknown values are invalid and must not be passed through silently.

## Mapping Rules to AMC Sections
- `market_direction.summary` -> external market line
- `competition_pressure.summary` -> external position/competition line
- `economic_pressure.summary` -> external signal/economic line
- `transition_friction.summary` -> external friction line
- `source_notes` + `market_data_date` -> native metadata (traceability only)

Comparative mode:
- Comparative status symbols are derived from these statuses.
- Comparative-specific prose remains AMC-owned unless explicitly updated in contract.

## Fallback and Safety Rules
- External adapter usage must remain optional.
- If external integration is disabled, missing key, or provider call fails:
  - fallback to current internal AMC external snapshot path
  - preserve render success
  - emit non-blocking warning only

## Customer-Facing Behavior Constraints
- Single-case: `External Snapshot` is the primary external block.
- Comparative-case: `External Comparative Snapshot` is primary.
- Single and comparative external blocks must not visually compete as co-primary in one report.

## Versioning
- Contract version: `v1`
- Change type classification:
  - additive field: review-required
  - enum change/removal/rename: contract-breaking
  - mapping target change affecting existing report text: contract-breaking unless coordinated template+contract update
