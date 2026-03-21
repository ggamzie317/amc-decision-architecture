# AMC Launch Readiness Checklist (Minimal)

Use this checklist to confirm launch status before first customer delivery.

## Ready Now
- [ ] Render/CI stability: see `docs/amc_render_stabilization_note.md`.
- [ ] Local smoke verification: run `bash scripts/run_amc_render_smoke.sh`.
- [ ] Operator run sequence is defined: see `docs/amc_operator_run_sequence.md`.
- [ ] Delivery readiness checklist is available: see `docs/amc_delivery_readiness_checklist.md`.
- [ ] Handoff packaging template is available: see `docs/amc_operator_handoff_template.md`.

## Still Required Before First Live Delivery
- [ ] Execute one real-case dry run using `docs/amc_dry_run_checklist.md`.
- [ ] Confirm final report passes delivery readiness review for that case.
- [ ] Prepare and verify one operator handoff package for that case.
- [ ] Record final go/no-go decision and any caveats for first customer delivery.
