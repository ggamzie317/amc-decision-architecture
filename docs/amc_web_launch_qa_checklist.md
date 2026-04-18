# AMC Web Launch QA Checklist (English-Only)

Use this checklist for final launch verification of the current AMC English-only client flow.

## A) Build / Environment
- [ ] `pnpm build` passes in `manus-ui`.
- [ ] No blocking runtime env/config issues are present for launch.
- [ ] Analytics is disabled by default (unless intentionally re-enabled).
- [ ] If analytics is re-enabled, required env vars are set and validated.

## B) Core User Journey
- [ ] **Home:** primary CTA goes to `/intake`; secondary CTA behavior is correct.
- [ ] **Intake:** questions render and progress controls work end-to-end.
- [ ] **FormatHandoff:** format cards render and continue buttons route correctly.
- [ ] **PaymentHandoff:** selected format is shown and forward/back actions work.
- [ ] **PaymentSuccess:** confirmation content and recovery/start-over actions work.
- [ ] CTA wording is consistent across the full flow (no abrupt phrasing changes).

## C) Direct Entry / Refresh Resilience
- [ ] Direct entry to `/format-handoff` without intake state shows clean recovery path.
- [ ] Direct entry to `/payment-handoff?format=essential` without valid handoff shows clean recovery path.
- [ ] Direct entry to `/payment-success` without valid prior state shows clean fallback (not false success).
- [ ] Refresh on each step keeps users in a valid, non-broken state.

## D) Customer-Facing Copy
- [ ] No internal/dev/debug wording is visible.
- [ ] No placeholder wording is visible.
- [ ] No visible language-selection UI remains.
- [ ] Tone is concise, calm, premium, and customer-facing.

## E) Data / Handoff Sanity
- [ ] Intake completion marker is written when intake finishes.
- [ ] Submission handoff is created and persisted after format selection.
- [ ] Selected format in handoff matches selected format in route/state.
- [ ] Guarded states require recipient email presence where expected.
- [ ] Missing/invalid handoff data does not produce broken or empty screens.

## F) Launch Sign-Off
- [ ] Build is green.
- [ ] Core journey passes manually from Home -> Intake -> Format -> Payment -> Success.
- [ ] Direct-entry/refresh fallback behavior is verified.
- [ ] Customer-facing copy is clean and launch-safe.
- [ ] No blocker remains in sections A-E.

**Launch decision:**
- [ ] **LAUNCH READY**
- [ ] **NOT READY** (list blockers)

### Known Non-Blockers (Optional)
- 
