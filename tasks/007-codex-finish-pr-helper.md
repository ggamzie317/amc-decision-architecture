# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/007-codex-finish-pr-helper.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Add a small local helper script that standardizes the PR merge/finish step for AMC Codex tasks and explains the expected worktree warning after merge.

## Context

The Codex task workflow now starts more easily with `scripts/codex_start_task.sh`, but finishing a PR still requires repeated manual commands and produces a confusing but harmless message:

```text
failed to run git: fatal: 'main' is already used by worktree at '/Users/kwonkibum/amc-decision-architecture'
```

This happens because `main` is already checked out in the main/legacy worktree. GitHub merge succeeds, but local cleanup may fail. The helper should make this finish step clearer.

## Scope

Add a small shell helper script.

Recommended file:

- `scripts/codex_finish_pr.sh`

The script should accept one argument:

```bash
bash scripts/codex_finish_pr.sh 10
```

Suggested behavior:

1. Confirm `gh` is available.
2. Confirm a PR number was provided.
3. Run a concise PR info check if practical.
4. Run:

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
```

5. Print a clear note that if GitHub reports the PR was squashed and merged, the merge succeeded even if local cleanup prints the known `main is already used by worktree` warning.
6. Fetch origin after merge.
7. Print current branch/status.
8. Print the next-start command pattern:

```bash
bash scripts/codex_start_task.sh tasks/<next-task>.md
```

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not automatically create the next task.
- Do not force checkout `main` inside `/Users/kwonkibum/amc-codex-work`.
- Do not hide merge failures.

## Files likely involved

- `scripts/codex_finish_pr.sh`
- optionally `docs/amc_codex_local_worktree_runbook.md` if a short usage line is useful

## Implementation requirements

- Keep the script simple and readable.
- Prefer portable Bash for macOS.
- Do not checkout `main` in the Codex worktree.
- Make the known worktree warning understandable.
- If `gh pr merge` fails before reporting a successful merge, return non-zero.
- If merge succeeds but local cleanup warning appears, explain that the PR may still be merged and suggest confirming with `gh pr view <PR_NUMBER> --json state,mergedAt`.
- Keep output calm and operational.

Example target UX:

```bash
cd /Users/kwonkibum/amc-codex-work
bash scripts/codex_finish_pr.sh 10
```

## Verification commands

```bash
git diff --check
bash scripts/codex_finish_pr.sh || true
```

## Review checklist

- The helper reduces repeated PR merge/finish confusion.
- It does not checkout `main` inside the Codex worktree.
- It clearly explains the known worktree cleanup warning.
- It does not alter AMC product, report, UI, scoring, or delivery logic.
- Verification commands are reported.
