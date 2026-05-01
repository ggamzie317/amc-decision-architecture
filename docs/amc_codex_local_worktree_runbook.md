# AMC Codex Local Worktree Runbook

Use this runbook when executing AMC tasks in the Codex app.

## Working folders

- Codex app worktree: `/Users/kwonkibum/amc-codex-work`
- Main/legacy repository: `/Users/kwonkibum/amc-decision-architecture`

Keep these roles separate so Codex work starts from a clean checkout.

## Start a new Codex task branch

Run exactly:

```bash
cd /Users/kwonkibum/amc-codex-work
git fetch origin
git switch -c codex/<task-name> origin/main
```

This creates a fresh task branch from `origin/main` inside the Codex worktree.

Note: checking out `main` inside `/Users/kwonkibum/amc-codex-work` may fail because `main` is already checked out in `/Users/kwonkibum/amc-decision-architecture`.

## Run startup preflight before changes

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/<task-file>.md
```

If the expected task file is missing, stop. Report that the checkout may be stale and request the task contents or an updated checkout.

## Push and open PR

After implementing the task and running verification commands:

```bash
git push -u origin codex/<task-name>
```

Then open a GitHub PR, review, and merge through the existing verified flow.

## If push or PR creation fails

Use the patch handoff fallback from `tasks/README.md` so the task can still be applied and reviewed.
