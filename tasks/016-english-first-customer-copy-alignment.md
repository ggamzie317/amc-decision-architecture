# Task 016 — English-first customer copy alignment

Goal: Align customer-facing AMC launch copy to the current English-first soft launch reality.

Context: Task 015 audit identified inconsistent English-first launch messaging as the first launch blocker. Some launch docs state English-only, while customer-facing copy still mentions Korean/English/Chinese availability.

Scope: Customer-facing copy/docs only.

Review and update only if needed:
- docs/amc_landing_page_copy_compact.md
- docs/amc_landing_page_draft.md
- docs/amc_landing_page_handoff.md
- docs/amc_landing_sample_section_draft.md
- docs/amc_pilot_sample_pack.md
- docs/amc_pilot_sample_pack_copy.md
- manus-ui/client/src/pages/Home.tsx
- manus-ui/client/src/pages/Intake.tsx
- manus-ui/client/src/pages/FormatHandoff.tsx
- manus-ui/client/src/pages/PaymentHandoff.tsx
- manus-ui/client/src/pages/PaymentSuccess.tsx

Required behavior:
- Remove or soften any customer-facing claim that AMC is currently available in Korean/English/Chinese.
- Align launch copy to English-first soft launch.
- Do not remove future multilingual readiness from internal docs unless it is customer-facing launch copy.
- Keep tone premium, calm, and non-SaaS.
- Do not touch report generation logic, payloads, templates, Manus scripts, or output files.

Acceptance checks:
- rg -n "Korean|Chinese|multilingual|language|언어|한국어|중국어" docs manus-ui/client/src/pages || true
- git diff --check

Manual read check: Customer-facing launch copy should no longer create a mismatch between English-first launch reality and multilingual future readiness.
