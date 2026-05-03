# Task 018 — Payment handoff premium copy hardening

Goal: Make the current staged payment and success flow feel intentional, premium, and launch-ready rather than temporary or unfinished.

Context: Task 015 audit identified customer-facing flow framing as a launch blocker. The current staged payment handoff is acceptable for a soft launch, but page copy must make the experience feel controlled, private, and premium.

Scope: Customer-facing payment and post-payment copy only.

Review and update only if needed:
- manus-ui/client/src/pages/PaymentHandoff.tsx
- manus-ui/client/src/pages/PaymentSuccess.tsx
- docs/amc_landing_page_handoff.md
- docs/amc_landing_page_copy_compact.md
- docs/amc_landing_page_draft.md

Required behavior:
- Make PaymentHandoff copy feel like a deliberate private case handoff, not an incomplete checkout workaround.
- Make PaymentSuccess copy clearly explain what happens next after submission/payment.
- Keep tone premium, calm, concise, and non-SaaS.
- Avoid apologetic language, beta-sounding language, or internal operational wording.
- Do not overpromise instant fully automated delivery.
- Preserve operator-led soft launch reality.
- Do not touch report generation logic, payment logic, email logic, payloads, templates, Manus scripts, or output files.

Acceptance checks:
- rg -n "temporary|beta|manual|staged|handoff|checkout|payment|success|next" manus-ui/client/src/pages/PaymentHandoff.tsx manus-ui/client/src/pages/PaymentSuccess.tsx docs/amc_landing_page_handoff.md docs/amc_landing_page_copy_compact.md docs/amc_landing_page_draft.md || true
- git diff --check

Manual read check: A first-time customer should not feel the payment/success flow is unfinished. The flow should feel like a controlled private report handoff.
