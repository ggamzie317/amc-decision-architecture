# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/010-manus-handoff-package-runbook.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Document the fixed AMC-to-Manus handoff package so each premium report rendering cycle uses the same source inputs, prompt structure, and review expectations.

## Context

`docs/amc_manus_fixed_report_workflow.md` now fixes Manus as the premium report renderer and Codex as the workflow/validation/handoff layer.

The next step is to make the operator handoff repeatable:

```text
hardened AMC JSON package
+ human-readable review TXT
+ fixed Manus prompt
+ optional screenshots
-> Manus premium report render
-> AMC review checklist
```

This task should document the concrete handoff package and how it should be used. It should not build a new renderer or change payload generation code.

## Scope

Create a concise runbook document under `docs/`.

Recommended file:

- `docs/amc_manus_handoff_package_runbook.md`

Also add the document to:

- `docs/README.md`

The document should cover:

1. Required handoff inputs.
2. Source-of-truth order.
3. How to use hardened JSON and review TXT.
4. What the fixed Manus prompt must include.
5. When screenshots are useful.
6. What Manus should return.
7. How ChatGPT/Codex review the output.
8. Failure/rework triggers.
9. Minimal operator sequence.

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not modify existing Manus mapping code.
- Do not build a new prompt generator in this task.
- Do not create or edit report payload examples in this task.

## Files likely involved

- `docs/amc_manus_handoff_package_runbook.md`
- `docs/README.md`

## Implementation requirements

The document should be practical and operator-facing.

It must state clearly:

- Hardened JSON is the source of truth for report content.
- Review TXT is a human review aid, not an independent source of truth.
- The fixed Manus prompt should instruct Manus not to redesign AMC logic.
- Manus should not invent sections, scores, or recommendation language.
- Manus should preserve single vs comparative external section rules.
- Manus output must be reviewed before customer delivery.

Required handoff inputs:

- hardened AMC JSON package
- human-readable review TXT
- fixed Manus prompt
- optional screenshots of current report/dashboard/comparative table

Required fixed Manus prompt reminders:

- AMC does not decide for the client.
- AMC does not recommend.
- AMC structures the decision.
- Use `Structural Reading`, not `Decision Verdict`.
- Use `Decision Conditions` and `Commitment Condition`, not `Decision Gate` or Go / No-Go language.
- Single-case reports should primarily show `External Snapshot`.
- Comparative reports should primarily show `External Comparative Snapshot`.
- Comparative report sections should be table-first.
- Visual tone should be premium, calm, restrained, and consulting-like.

Suggested operator sequence:

1. Generate or select the hardened AMC JSON package.
2. Generate or select the human-readable review TXT.
3. Use the fixed Manus prompt.
4. Paste prompt + JSON + TXT into Manus without asking Manus to alter logic.
5. Add screenshots only when visual refinement is needed.
6. Review Manus output against `docs/amc_manus_fixed_report_workflow.md`.
7. Approve, request rework, or package for delivery.

## Verification commands

```bash
git diff --check
rg "Decision Verdict|Decision Gate|Go / No-Go|strong recommendation" docs/amc_manus_handoff_package_runbook.md docs/README.md || true
```

## Review checklist

- The handoff package is repeatable.
- JSON source-of-truth rule is clear.
- Review TXT role is clear.
- Manus prompt boundaries are clear.
- Single/comparative rules are included.
- Output review/rework triggers are included.
- No AMC product, report logic, UI behavior, scoring, or delivery code is touched.
- Verification commands are reported.
