# AMC Delivery Readiness Checklist (Minimal)

Use this checklist before sending one generated AMC report to a user.

## 1) Expected Files Exist
- Rendered DOCX exists (for example `output/AMC_Report_dry_run.docx` or target delivery file).
- Matching payload JSON exists (for example `output/amc_docx_payload_dry_run.json`).

## 2) Placeholder Leakage Check
- Confirm no visible `{{...}}` placeholders in the rendered DOCX.

## 3) Structure and Visibility Check
- Section ordering appears correct and complete.
- Comparative visibility matches case type:
  - single case: comparative blocks are not prominently shown
  - comparative case: comparative blocks are visible and labeled correctly

## 4) Fallback Check
- Fallback text (for example `[Not applicable]`) appears only where expected and remains acceptable.

## 5) Tone Check
- Language is restrained and analytical.
- No coaching/recommendation phrasing (for example "you should", "best choice").
