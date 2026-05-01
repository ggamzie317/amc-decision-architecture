# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/006-codex-start-task-helper.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Add a small local helper script that reduces the repeated manual steps needed to start each Codex app task from the clean AMC worktree.

## Context

The current Codex workflow works, but it still requires too many repeated manual steps:

```text
cd /Users/kwonkibum/amc-codex-work
git fetch origin
git switch -c codex/<task-name> origin/main
copy a long Codex prompt
run preflight manually
```

This task should make the workflow feel more automated by creating one helper command that prepares the branch and prints a copy-ready Codex prompt for the requested task file.

## Scope

Add a small shell helper script.

Recommended file:

- `scripts/codex_start_task.sh`

The script should accept one argument:

```bash
bash scripts/codex_start_task.sh tasks/005-english-launch-residue-scan.md
```

or:

```bash
bash scripts/codex_start_task.sh 005-english-launch-residue-scan
```

Suggested behavior:

1. Confirm it is being run from `/Users/kwonkibum/amc-codex-work` or print a clear warning.
2. Fetch `origin`.
3. Confirm the requested task file exists under `tasks/`.
4. Derive a branch name like `codex/005-english-launch-residue-scan`.
5. Create/switch to that branch from `origin/main`.
6. Print current branch/status.
7. Print a copy-ready Codex app prompt that tells Codex to:
   - run startup preflight
   - read the task file
   - implement only the task scope
   - run verification commands
   - create PR or return unified diff fallback

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not add complex Git automation.
- Do not automatically merge PRs in this task.
- Do not rewrite existing task files.

## Files likely involved

- `scripts/codex_start_task.sh`
- optionally `docs/amc_codex_local_worktree_runbook.md` if a short usage line is helpful

## Implementation requirements

- Keep the script simple and readable.
- Prefer portable Bash for macOS.
- Use safe shell settings where appropriate.
- Print clear next-step instructions.
- Do not destroy local changes.
- If the worktree is dirty, stop and ask the user to review/commit/stash before creating a new branch.
- If the branch already exists, explain what happened instead of overwriting it.
- The script should be safe to run repeatedly.

Example target UX:

```bash
cd /Users/kwonkibum/amc-codex-work
bash scripts/codex_start_task.sh tasks/006-codex-start-task-helper.md
```

Expected output should include:

- task file path
- branch name
- git status
- copy-ready Codex prompt

## Verification commands

```bash
git diff --check
bash scripts/codex_start_task.sh tasks/006-codex-start-task-helper.md || true
```

## Review checklist

- The helper reduces repeated manual branch/prompt setup work.
- It does not hide important state from the user.
- It stops safely on dirty worktrees.
- It prints a usable Codex prompt.
- It does not alter AMC product, report, UI, scoring, or delivery logic.
- Verification commands are reported.
