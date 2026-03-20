# AMC Native Metadata Inventory

Engineering inventory of current native metadata fields and cue consumers.
Scope is descriptive only (no contract changes).

## 1) `inputs.nativeMetadata` (owner: `src/amc/nativeMetadata.ts`)

| Field | Owner / Source Logic | Downstream Consumer | Fallback Behavior | Warning Behavior | Locale Relevance | Status |
|---|---|---|---|---|---|---|
| `inputCompletenessScore` | `computeInputCompletenessMetadata()` from normalized intake field presence ratio | `buildNestedTemplateContextFromDocxPayload()` -> `executive_summary.assessment_basis_line` bucket text | If absent, recomputed by `computeIntakeCompletenessScore(normalized)` in renderer layer | None | Yes (assessment-basis text is locale-owned) | stable |
| `inputCompletenessBand` | Same as above (`high/medium/low`) | Currently none (carried in payload only) | N/A (not consumed) | None | No (not rendered directly) | deferred |
| `evidenceProfile` | Same as above (`sufficient/moderate/limited`) | Currently none (carried in payload only) | N/A (not consumed) | None | No (not rendered directly) | deferred |
| `matrixBands.marketOutlook` | Derived from structural flags (`growingMarketOutlook` vs `decliningMarketOutlook`) | Matrix visual + `matrix.reading_cue` generation | Missing/empty -> derived-band fallback from structural flags | Unsupported enum value -> `meta.native_mapping_warnings` | Yes (visual labels and cue text localized) | stable |
| `matrixBands.companyStability` | Derived from structural flags (`highCompanyStability` vs `lowCompanyStability`) | Same as above | Same as above | Same as above | Yes | stable |
| `matrixBands.fifwmRisk` | Derived from structural flags (`strongSafetyNet` vs `weakSafetyNet`) | Same as above | Same as above | Same as above | Yes | stable |
| `matrixBands.personalFit` | Derived from structural flags (`highDecisionClarity && highRiskComfort` vs low variants) | Same as above | Same as above | Same as above | Yes | stable |
| `matrixBands.upsideDownside` | Derived from structural flags (`structurallySupportedMove` vs `structurallyFragileMove`) | Same as above | Same as above | Same as above | Yes | stable |
| `optionLabels.optionA` | Parsed from `normalized.optionsUnderConsideration` (`Option A:` pattern) | Comparative label population in render context | Fallback parse from raw intake; if still missing use locale default (`Option A`) | Warnings only when native shape is invalid/partial object | Yes (fallback labels localized) | stable |
| `optionLabels.optionB` | Parsed from `normalized.optionsUnderConsideration` (`Option B:` pattern) | Same as above | Same as above (`Option B`) | Same as above | Yes | stable |
| `optionLabels.source` | `parsed` or `missing` in input metadata builder | Observability/test assertions only | N/A | None by itself | No | stable |

Notes:
- Invalid `matrixBands` **shape** is currently tolerated by falling back through per-dimension defaults; no dedicated shape warning is emitted.
- `meta.native_mapping_warnings` is non-blocking observability and does not fail rendering.

## 2) `decision_conditions.nativeMetadata` (owner: `src/buildDecisionConditions.ts`)

| Field | Owner / Source Logic | Downstream Consumer | Fallback Behavior | Warning Behavior | Locale Relevance | Status |
|---|---|---|---|---|---|---|
| `weakEvidence` | Branch output from `isWeakEvidence()` | Currently none in render mapping | N/A | None | No | deferred |
| `validationBucket` | `inferValidationBucket()` | Currently none in render mapping | N/A | None | No | deferred |
| `readinessBucket` | `inferReadinessBucket()` | Currently none in render mapping | N/A | None | No | deferred |
| `supportBucket` | `inferSupportBucket()` | Currently none in render mapping | N/A | None | No | deferred |
| `commitmentBucket` | `inferCommitmentBucket()` | Currently none in render mapping | N/A | None | No | deferred |
| `explorationDesignHints.experiment1` | Built from validation bucket + case mode | `exploration_plan.experiment_1.design` | Missing/invalid/duplicate hints -> deterministic defaults + de-duplication | Invalid shape, missing fields, duplicate resolution -> warning entries in `meta.native_mapping_warnings` | Yes (defaults localized) | stable |
| `explorationDesignHints.experiment2` | Built from readiness bucket + case mode | `exploration_plan.experiment_2.design` | Same | Same | Yes | stable |
| `explorationDesignHints.experiment3` | Built from support bucket + case mode | `exploration_plan.experiment_3.design` | Same | Same | Yes | stable |
| `reassessmentTriggerType` | `inferReassessmentTriggerType()` enum | `commitment.reassessment_trigger` text mapping | Missing/unsupported -> locale default reassessment trigger sentence | Missing or unsupported enum -> warning entry | Yes (mapped sentence localized) | stable |

## 3) `external_snapshot.nativeMetadata` (owner: `src/buildExternalSnapshot.ts`)

| Field | Owner / Source Logic | Downstream Consumer | Fallback Behavior | Warning Behavior | Locale Relevance | Status |
|---|---|---|---|---|---|---|
| `weakEvidence` | Branch output from `isWeakEvidence()` | `external_snapshot.reading_cue` weak-evidence hedge branch | If metadata missing entirely -> generic fallback cue | None by itself | Yes | pilot |
| `demandBucket` | `inferDemandBucket()` (`clear/mixed/weak`) | `external_snapshot.reading_cue` | Missing -> `mixed` fallback bucket | Unsupported enum -> warning | Yes | pilot |
| `portabilityBucket` | `inferPortabilityBucket()` (`strong/partial/constrained`) | `external_snapshot.reading_cue` | Missing -> `partial` fallback bucket | Unsupported enum -> warning | Yes | pilot |
| `frictionBucket` | `inferFrictionBucket()` (`low/moderate/high`) | `external_snapshot.reading_cue` | Missing -> `moderate` fallback bucket | Unsupported enum -> warning | Yes | pilot |
| `signalBucket` | `inferSignalBucket()` (`visible/partial/fragmented`) | `external_snapshot.reading_cue` | Missing -> `partial` fallback bucket | Unsupported enum -> warning | Yes | pilot |

## 4) Cue-Related Derived Consumers (render-owned consumption layer)

| Consumer Field | Upstream Inputs Used | Consumer Owner | Fallback Model | Warning Behavior | Locale Relevance | Status |
|---|---|---|---|---|---|---|
| `external_snapshot.reading_cue` | `external_snapshot.nativeMetadata.{weakEvidence,demandBucket,portabilityBucket,frictionBucket,signalBucket}` | `buildNestedTemplateContextFromDocxPayload()` (`buildExternalReadingCue`) | Quality-sensitive model: weak-evidence hedge + per-bucket fallback | Unsupported bucket values logged; missing metadata falls back silently to baseline cue | Yes | pilot |
| `matrix.reading_cue` | `inputs.nativeMetadata.matrixBands.*` (+ derived flag fallback per dimension) | `buildNestedTemplateContextFromDocxPayload()` (`buildMatrixReadingCue`) | Absence-only model: derive/fallback bands when native missing | Unsupported enum values logged; missing values are fallback-only | Yes | stable |
| `matrix.*.visual` | Same matrix band sources as above | `buildNestedTemplateContextFromDocxPayload()` | Per-dimension fallback from derived bands; then localized visual token | Unsupported enum values logged via band resolver | Yes | stable |

## 5) Boundary Summary

- Native metadata is additive and non-blocking for rendering.
- `meta.native_mapping_warnings` is the observability surface for unsupported native values.
- Render-owned timeline fields (`exploration_plan.experiment_*.timeline`) remain outside native metadata ownership by contract.
