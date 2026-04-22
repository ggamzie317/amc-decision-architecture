# AMC Report Freeze QA — Batch 8

## Scope
- Template: `templates/AMC_Strategic_Career_Decision_Template_v3_4_working.docx`
- Shapes rendered:
  - single baseline: `examples/amc_sample_single.json`
  - comparative baseline: `examples/amc_sample_comparative.json`
  - comparative stress: `examples/amc_case_jll_comparative.json`

## Render Results
- Single baseline: Pass
  - `nativeMappingWarnings`: 0
  - leftover placeholders: 0
- Comparative baseline: Pass
  - `nativeMappingWarnings`: 0
  - leftover placeholders: 0
- Comparative stress (JLL): Pass
  - `nativeMappingWarnings`: 0
  - leftover placeholders: 0

## Freeze QA Status Matrix

### 1) First-page hierarchy
- Single baseline: Minor fix
- Comparative baseline: Minor fix
- Comparative stress: Minor fix
- Note: conclusion-first content is present, but first-page sequence still shows duplicated executive fragments competing with page title block in reading order.

### 2) Executive conclusion priority
- Single baseline: Pass
- Comparative baseline: Pass
- Comparative stress: Pass
- Note: executive top lines are concise and conclusion-first; support/basis lines remain secondary.

### 3) Comparative table dominance
- Single baseline: Pass (N/A)
- Comparative baseline: Pass
- Comparative stress: Pass
- Note: table remains visually dominant; comparative reading/implication stays compact.

### 4) Scored vs non-scored separation
- Single baseline: Minor fix
- Comparative baseline: Minor fix
- Comparative stress: Minor fix
- Note: separation improved, but scored and interpretive layers could still be distinguished more clearly by template style contrast and spacing rhythm.

### 5) Page-break stability
- Single baseline: Pass
- Comparative baseline: Pass
- Comparative stress: Pass
- Note: no render breakage observed; output page-object count stable across all three renders.

### 6) Overflow / wrapping risk
- Single baseline: Pass
- Comparative baseline: Pass
- Comparative stress: Minor fix
- Note: stress case remains stable, but long comparative narrative blocks can still crowd local areas depending on language length and row wrapping.

### 7) Legend staying secondary
- Single baseline: Pass (N/A)
- Comparative baseline: Pass
- Comparative stress: Pass
- Note: legend is compact and subordinate to table content.

## PDF Readiness
- Local converter available: `soffice`
- Converted PDFs:
  - `manus-ui/output/AMC_Report_batch8_single_baseline.pdf`
  - `manus-ui/output/AMC_Report_batch8_comparative_baseline.pdf`
  - `manus-ui/output/AMC_Report_batch8_comparative_stress_jll.pdf`
- Export status: Pass
- Layout survival assessment: Minor fix
  - Conversion is stable and outputs are complete.
  - Final freeze confidence would still benefit from manual visual review of first-page hierarchy and stress-case density in PDF form.

## Batch 8 Conclusion
- Overall freeze QA status: Minor fix
- Rationale: No render blockers or placeholder leaks; native mapping is clean. Remaining issues are presentation-level polish (first-page hierarchy ordering and tighter scored/non-scored visual separation), not logic or contract issues.

## Batch 9 Freeze Note
- Template baseline locked: `templates/AMC_Strategic_Career_Decision_Template_v3_4_working.docx`
- Validation scope:
  - single baseline: `examples/amc_sample_single.json`
  - comparative baseline: `examples/amc_sample_comparative.json`
  - comparative stress: `examples/amc_case_jll_comparative.json`
- Results:
  - render success: 3/3
  - `nativeMappingWarnings`: 0 (all cases)
  - leftover placeholders: 0 (all cases)
- Batch 9 status: Freeze-ready
- Baseline governance: presentation/template changes after this point require either a clear blocker or an explicit post-freeze change request.
