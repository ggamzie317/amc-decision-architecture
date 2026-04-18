# AMC Web Launch QA Checklist (English-Only)

Use this checklist for final launch verification of the current AMC English-only client flow.

## A) Build / Environment
- [ ] `pnpm build` passes in `manus-ui`.
- [ ] No blocking runtime env/config issues are present for launch.
- [ ] Analytics is disabled by default (unless intentionally re-enabled).
- [ ] If analytics is re-enabled, required env vars are set and validated.
- [ ] Staged checkout behavior is intentional and reflected in customer-facing flow copy.

## B) Core User Journey
- [ ] **Home:** primary CTA goes to `/intake`; secondary CTA behavior is correct.
- [ ] **Intake:** questions render and progress controls work end-to-end.
- [ ] **FormatHandoff:** format cards render and continue buttons route correctly; staged-checkout expectation note is visible and clear.
- [ ] **PaymentHandoff:** page reads as intentional next-step staging (not live checkout), with clean recovery/navigation actions.
- [ ] **PaymentSuccess:** true confirmation appears only with verified success state; otherwise neutral recovery state appears.
- [ ] CTA wording is consistent across the full flow (no abrupt phrasing changes).

## C) Direct Entry / Refresh Resilience
- [ ] Direct entry to `/format-handoff` without intake state shows clean recovery path.
- [ ] Direct entry to `/payment-handoff?format=essential` without valid handoff shows clean recovery path.
- [ ] Direct entry to `/payment-success` without verified success state shows neutral recovery (not false success).
- [ ] Refresh on each step keeps users in a valid, non-broken state.

## D) Customer-Facing Copy
- [ ] No internal/dev/debug wording is visible.
- [ ] No placeholder wording is visible.
- [ ] No false-success wording is visible.
- [ ] No visible language-selection UI remains.
- [ ] Tone is concise, calm, premium, and customer-facing.

## E) Data / Handoff Sanity
- [ ] Intake completion marker is written when intake finishes.
- [ ] Required intake fields are enforced before intake completion (full name, email, main decision, consent).
- [ ] Submission handoff is created and persisted after format selection.
- [ ] Selected format in handoff matches selected format in route/state.
- [ ] Guarded states require recipient email presence where expected.
- [ ] Success state is guarded by true success flag/state.
- [ ] Missing/invalid handoff data does not produce broken or empty screens.

## F) Launch Sign-Off
- [ ] Build is green.
- [ ] Core staged journey passes manually from Home -> Intake -> Format -> PaymentHandoff (staged) -> PaymentSuccess (guarded).
- [ ] Direct-entry/refresh fallback behavior is verified.
- [ ] Customer-facing copy is clean and launch-safe.
- [ ] No blocker remains in sections A-E.

**Launch decision:**
- [ ] **STAGED-CHECKOUT LAUNCH READY**
- [ ] **PAYMENT-LIVE LAUNCH READY** (only if checkout is truly enabled and verified)
- [ ] **NOT READY** (list blockers)

### Known Non-Blockers (Optional)
- Checkout is staged (not fully live) for this launch baseline.
