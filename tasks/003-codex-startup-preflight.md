# Task

## Objective

Add a lightweight startup preflight step so Codex confirms it is working from the expected repository, branch, and task file before making changes.

## Context

During the Codex task-lane setup, one Codex checkout did not have the latest `tasks/002-codex-patch-handoff-protocol.md` file even though the file existed on GitHub main.

This created confusion because Codex could not find the task file and could not safely proceed.

This task makes the start-of-task check explicit so Codex reports stale or incomplete checkouts before implementation begins.

## Scope

Update task-lane documentation only.

Recommended updates:

- Add a short `Startup preflight` section to `tasks/README.md`.
- Update `tasks/TEMPLATE.md` so every task can include a startup preflight command block.
- Keep the guidance lightweight and practical.
- State that Codex should not guess if the task file is missing.
- State that Codex should ask for the task contents or report that the checkout is stale.

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not add complex Git workflows.
- Do not require PR automation to work.

## Files likely involved

- `tasks/README.md`
- `tasks/TEMPLATE.md`

## Implementation requirements

- Documentation-only change.
- Preserve the existing Product owner / ChatGPT / Codex role structure.
- Keep the preflight short enough for non-developers to understand.
- Include exact commands Codex can run at the start of a task.
- Make it clear that missing task files should stop implementation.

Suggested startup commands to include or adapt:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/<task-file>.md
```

Suggested rule:

```text
If the expected task file is missing, do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.
```

## Verification commands

```bash
git diff --check
rg "Decision Verdict|Decision Gate|Go / No-Go|strong recommendation" docs tasks || true
```

## Review checklist

- Startup preflight is easy to understand.
- The task lane remains lightweight.
- Missing task file behavior is explicit.
- No AMC product, report, UI, scoring, or delivery logic is touched.
- Verification commands are reported.
