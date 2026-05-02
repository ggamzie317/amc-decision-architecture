# AMC Launch Quality Audit (Task 015)

## Executive summary

AMC is close to soft-launch readiness on workflow stability, but customer-facing quality is not yet consistently launch-grade across positioning, offer clarity, and language discipline. The highest-risk issues are messaging contradictions (English-only vs multilingual), weak Essential vs Executive differentiation at decision time, and tone drift between premium positioning and internal/technical wording. These are fixable without changing report logic or product architecture.

## Launch blockers

1. English-first launch messaging is inconsistent.
   - `docs/amc_web_launch_qa_checklist.md` defines English-only launch.
   - `docs/amc_soft_launch_ops_runbook.md` also states English-only client flow.
   - `docs/amc_landing_page_copy_compact.md` still says AMC is available for Korean/English/Chinese.
   - Launch risk: trust and expectation mismatch for first customers.
2. Offer decision clarity is too thin at customer decision points.
   - `docs/amc_delivery_modes.md` defines Essential/Executive internally, but customer-facing copy in `docs/amc_landing_page_copy_compact.md` is minimal (`report only` vs `report + 7-day chatbot`).
   - Launch risk: avoidable drop-off or wrong-tier selection due to unclear value delta.
3. Customer-facing flow framing can still feel staged/internal.
   - `docs/amc_web_launch_qa_checklist.md` correctly references staged payment handoff, but this is operationally fragile if page copy is not explicit and premium.
   - Launch risk: “this is unfinished” perception during payment handoff/success steps.

## Important quality issues

1. Positioning language remains partly generic.
   - Terms like “private service,” “structured read,” and “high-stakes decisions” are directionally right but repeated in similar phrasing.
   - Risk: sounds like polished consulting copy, not a distinct product category.
2. Internal artifact language is still too visible in operating docs near launch surfaces.
   - Many docs use engineering terms (`handoff`, `staged`, endpoint/state framing) that can bleed into UI copy unless tightly controlled.
   - Risk: premium tone dilution and perceived internalness.
3. Manus operator quickstart improved, but still assumes terminal comfort.
   - `docs/amc_manus_handoff_package_runbook.md` quickstart is clear, but `pbcopy` command usage may still intimidate non-technical operators.
   - Risk: manual execution errors during urgent delivery windows.

## Nice-to-have improvements

1. Unify CTA language into one primary conversion phrase family across Home -> Intake -> Format -> PaymentSuccess.
2. Add one customer-facing “what happens after submission” timeline sentence in launch copy to reduce anxiety.
3. Add a compact “Executive is bounded interpretation, not coaching” microcopy block where tier is selected.

## Business model clarity notes

1. Current model is structurally sound:
   - Essential = report-only.
   - Executive = same report + bounded 7-day report-linked chatbot.
2. Clarity gap:
   - The “why pay more for Executive” narrative is under-specified in customer-facing copy.
3. Required refinement:
   - Explain Executive value in operational terms (decision clarification window, scope boundaries, and expected usage) without recommendation framing.

## Report quality notes

1. Doctrine quality is strong and launch-appropriate:
   - `docs/amc_report_doctrine.md` and Manus workflow docs consistently enforce structure-first, no recommendation behavior.
2. Tone risk:
   - Need tighter guard against generic motivational/coaching language in any customer-facing summary or helper surfaces.
3. Terminology control:
   - Governance correctly bans `Decision Verdict`, `Decision Gate`, and Go / No-Go phrasing; continue strict checks before delivery.

## Website / flow notes

1. Flow architecture appears launch-feasible:
   - Home -> Intake -> FormatHandoff -> PaymentHandoff -> PaymentSuccess.
2. Immediate quality focus:
   - Ensure staged checkout language feels intentional and premium, not temporary or apologetic.
3. English-first cleanup:
   - Remove multilingual availability claims from customer-facing launch copy until multilingual launch is actually active.

## Manus workflow notes

1. Fixed renderer model is correct for launch quality.
   - Manus remains the premium rendering layer.
   - AMC/Codex remains the structure/logic/validation layer.
2. Handoff package governance is strong.
   - JSON source-of-truth and review-TXT secondary role are clearly defined.
3. Remaining operational risk:
   - Non-developer usability of quickstart could still be improved with an even simpler copy/paste-only variant (no shell dependency).

## Recommended next 3 Codex tasks

1. English-first customer copy alignment pass (launch blocker fix).
   - Scope: customer-facing docs/copy artifacts only.
   - Goal: remove multilingual launch claims and align all launch copy to English-first reality.
2. Essential vs Executive conversion clarity task (launch blocker fix).
   - Scope: customer-facing tier selection copy and concise FAQ/update.
   - Goal: make the value boundary and expected outcome of each tier immediately understandable.
3. Staged payment handoff premium-copy hardening task (important quality fix).
   - Scope: payment-handoff and success-step customer microcopy guidance/checklist.
   - Goal: eliminate “incomplete flow” perception while preserving current staged operations.
