# Task 017 — Essential vs Executive offer clarity

Goal: Make the Essential vs Executive offer difference immediately clear to first customers.

Context: Task 015 audit identified weak offer decision clarity as a launch blocker. Current customer-facing copy explains Essential as report only and Executive as report + 1-Day Report Q&A, but the value difference is still too thin at decision time.

Scope: Customer-facing offer copy only.

Review and update only if needed:
- docs/amc_delivery_modes.md
- docs/amc_landing_page_copy_compact.md
- docs/amc_landing_page_draft.md
- docs/amc_landing_page_handoff.md
- manus-ui/client/src/pages/FormatHandoff.tsx
- manus-ui/client/src/pages/PaymentHandoff.tsx
- manus-ui/client/src/pages/PaymentSuccess.tsx

Required behavior:
- Clarify Essential as the report-only option for customers who want a structured decision brief.
- Clarify Executive as the report plus 1-Day Report Q&A after delivery.
- Explain that Executive is not open-ended coaching, therapy, or general career advice.
- Avoid recommendation language such as best choice, you should, go/no-go, or decision verdict.
- Keep tone premium, calm, concise, and non-SaaS.
- Do not touch report generation logic, payloads, templates, Manus scripts, or output files.

Acceptance checks:
- rg -n "Essential|Executive|1-Day|Q&A|coaching|report only|report-only" docs/amc_delivery_modes.md docs/amc_landing_page_copy_compact.md docs/amc_landing_page_draft.md docs/amc_landing_page_handoff.md manus-ui/client/src/pages || true
- git diff --check

Manual read check: A first-time customer should understand the value boundary between Essential and Executive without needing internal AMC context.
