# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/008-improve-codex-start-task-origin-main.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Improve `scripts/codex_start_task.sh` so it can start a newly-created task from `origin/main` even when the current local branch does not yet contain that task file.

## Context

After Task 007 was created on `origin/main`, running:

```bash
bash scripts/codex_start_task.sh tasks/007-codex-finish-pr-helper.md
```

failed because the current local branch did not contain the new task file yet. The script fetched origin, but it checked for the task file before switching to a fresh branch from `origin/main`.

The intended workflow is:

```text
Task file exists on origin/main
-> helper starts a new Codex branch from origin/main
-> helper confirms the task file exists in that new branch
-> helper prints the copy-ready Codex prompt
```

This task removes one more manual branch-creation step from the workflow.

## Scope

Update the start helper only.

Recommended file:

- `scripts/codex_start_task.sh`

Suggested behavior change:

1. Fetch origin first.
2. Normalize the requested task file path/name.
3. Derive branch name from the requested task file name.
4. If the target branch does not exist locally, create/switch to it from `origin/main` before checking task file existence.
5. After switching, check that the task file exists.
6. If the task file is still missing after switching from `origin/main`, stop with a clear stale/missing task message.
7. Keep the dirty-worktree guard safe. It should still prevent starting a new branch when local changes are present.

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not automatically merge PRs.
- Do not rewrite task contents.
- Do not force checkout `main` inside `/Users/kwonkibum/amc-codex-work`.

## Files likely involved

- `scripts/codex_start_task.sh`

## Implementation requirements

- Keep the script simple and readable.
- Preserve the existing copy-ready Codex app prompt output.
- Do not hide branch/status from the user.
- Stop safely on dirty worktrees.
- Make the failure message clear if the task file is missing even after switching from `origin/main`.
- Keep macOS Bash compatibility.

Example target UX:

```bash
cd /Users/kwonkibum/amc-codex-work
bash scripts/codex_start_task.sh tasks/008-improve-codex-start-task-origin-main.md
```

Expected behavior:

- Fetch origin.
- Create/switch to `codex/008-improve-codex-start-task-origin-main` from `origin/main`.
- Confirm the task file exists.
- Print the copy-ready Codex prompt.

## Verification commands

```bash
git diff --check
bash scripts/codex_start_task.sh tasks/008-improve-codex-start-task-origin-main.md || true
```

## Review checklist

- The helper can start tasks that exist on `origin/main` but not on the prior local branch.
- It still stops safely on dirty worktrees.
- It does not checkout `main` inside the Codex worktree.
- It keeps the copy-ready Codex prompt behavior.
- It does not alter AMC product, report, UI, scoring, or delivery logic.
- Verification commands are reported.
