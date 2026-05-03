# AMC Soft Launch QA Gate (Task 019)

## Executive summary

AMC can move toward limited first-customer launch only if the full operator-led flow passes an end-to-end QA gate across customer journey, report quality, Manus rendering discipline, and delivery operations. This gate is practical by design: if any blocker-level check fails, launch is held.

## Soft launch readiness verdict

Current verdict: **CONDITIONAL GO (pending full gate execution)**.

- Product-side launch blockers identified in Task 015 have targeted fixes.
- Final decision must be based on this checklist run, not on prior intent.

## Launch blockers remaining

Treat these as launch blockers if observed during gate execution:

- Any false-success or broken-state behavior in Home -> Intake -> FormatHandoff -> PaymentHandoff -> PaymentSuccess.
- Any mismatch between selected tier and visible tier messaging.
- Any recommendation/coaching language drift in customer-facing flow or report.
- Any single/comparative mode rendering mismatch.
- Any report delivery failure on receipt/send path within operator SLA.
- Any Manus output that changes AMC logic, section semantics, or required terminology.

## Required QA checklist

- [ ] `manus-ui` build passes and server starts cleanly.
- [ ] English-first customer flow is consistent and clean.
- [ ] Essential vs Executive boundary is explicit at selection, handoff, and post-submit states.
- [ ] Payment/handoff states read as deliberate private case processing (not temporary workaround).
- [ ] One single-case report path passes generation and delivery.
- [ ] One comparative-case report path passes generation and delivery.
- [ ] PDF delivery path is verified with expected attachment behavior.
- [ ] Receipt email and report-delivery email paths both succeed.
- [ ] Manus handoff package runbook is executable by operator with no ambiguity.
- [ ] Final Manus output passes terminology, section-mode, and tone checks.

## Single-case report QA

Pass criteria:

- [ ] Single-case output primarily emphasizes `External Snapshot`.
- [ ] `External Comparative Snapshot` is not treated as co-primary.
- [ ] Visible terms use `Structural Reading`, `Decision Conditions`, `Commitment Condition`.
- [ ] No recommendation framing (`you should`, best-choice, Go / No-Go, Decision Verdict).
- [ ] Overall tone is premium, calm, restrained, consulting-like.

## Comparative report QA

Pass criteria:

- [ ] Comparative output primarily emphasizes `External Comparative Snapshot`.
- [ ] Comparative section is table-first.
- [ ] Reading/implication lines remain compact and secondary to table.
- [ ] Option A/B comparative clarity is preserved.
- [ ] No section competition between single and comparative external blocks.

## Manus rendering QA

Pass criteria:

- [ ] Handoff package includes hardened JSON + review TXT + fixed prompt (+ screenshots only when needed).
- [ ] JSON remains source of truth; TXT is review aid.
- [ ] Manus does not invent sections, scores, or recommendation language.
- [ ] Manus does not alter AMC logic or interpretation boundaries.
- [ ] Visual output remains premium and non-dashboard-like.

## Email delivery QA

Pass criteria:

- [ ] Receipt endpoint sends immediate receipt email on successful submission.
- [ ] Ops-protected report delivery endpoint works with valid `x-amc-ops-secret`.
- [ ] Missing/invalid ops secret fails closed as expected.
- [ ] Report email is delivered with expected attachment behavior (PDF delivery path).
- [ ] Operator cadence can meet the within-3-hours delivery promise.

## Payment / handoff QA

Pass criteria:

- [ ] PaymentHandoff copy reads as private case handoff and controlled processing.
- [ ] PaymentSuccess clearly states what happens next and delivery timing.
- [ ] Direct-entry/refresh fallback states are clean and non-broken.
- [ ] No apologetic, internal, or “unfinished product” phrasing is visible.

## Essential vs Executive QA

Pass criteria:

- [ ] Essential is clearly understood as report-only structured decision brief delivery.
- [ ] Executive is clearly understood as report + bounded 7-day report-linked interpretation window.
- [ ] Executive is explicitly not open-ended coaching, therapy, or generic career advice.
- [ ] Tier boundary language is consistent across landing, format, handoff, and success surfaces.

## Internal terminology and tone QA

Pass criteria:

- [ ] No internal labels leak to customer-facing surfaces.
- [ ] Banned visible terms do not appear (`Decision Verdict`, `Decision Gate`, Go / No-Go, strong recommendation framing).
- [ ] Language avoids AI-smell and generic motivational/coaching phrasing.
- [ ] Tone remains concise, premium, and structural.

## Operator run sequence

1. Verify environment and soft-launch ops prerequisites (`AMC_EMAIL_FROM`, `AMC_OPS_SECRET`, sendmail path).
2. Run customer journey QA from Home through PaymentSuccess including direct-entry/refresh checks.
3. Execute one single-case submission and confirm receipt email.
4. Trigger single-case report delivery and verify report email delivery.
5. Execute one comparative-case submission and confirm receipt email.
6. Trigger comparative-case report delivery and verify report email delivery.
7. Run Manus handoff package once (single or comparative) and validate render output with fixed workflow checklist.
8. Review terminology, tone, and tier-boundary consistency across customer touchpoints.
9. Record pass/fail with blockers and final launch decision.

## Go / hold criteria for limited soft launch

Go:

- All required QA checklist items pass.
- No blocker-level issue remains.
- Operator cadence for delivery SLA is active and demonstrated.
- Single + comparative representative cases are both delivery-ready.

Hold:

- Any blocker-level issue remains in flow integrity, report quality, Manus governance, or delivery operations.
- Any terminology/tone breach risks customer trust.
- Any unresolved mismatch between customer-facing promise and operator reality.

## Recommended next 3 tasks

1. `Task 020`: Soft-launch dry-run evidence pack (one single + one comparative full trace with screenshots, status, and delivery timestamps).
2. `Task 021`: Customer-facing wording consistency sweep for Home/Intake/Format/Handoff/Success against this QA gate language.
3. `Task 022`: Operator incident-response micro-runbook for report delivery failures (receipt ok, report send failed, retry/escalation path).
