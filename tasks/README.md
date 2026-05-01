# AMC Codex Task Lane

This folder is the lightweight execution lane for Codex work.

Use it when you want implementation work to happen in small, reviewable batches without changing AMC direction.

## Who does what

- Product owner: sets priority, approves final result.
- ChatGPT: writes or updates task specs and checks AMC alignment.
- Codex: implements the task and runs verification commands.

## How to run one task

1. Copy `tasks/TEMPLATE.md` into a new file such as `tasks/001-docs-index-link.md`.
2. Fill in objective, scope, non-goals, and verification commands.
3. Ask Codex to execute that task file only.
4. Review against the checklist in the task and in `docs/amc_codex_operating_loop.md`.
5. Approve, request edits, or open the next task.

## Startup preflight

Before implementation, Codex should run a quick preflight to confirm repo, branch, and task file:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/<task-file>.md
```

If the expected task file is missing, do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Naming convention

Use short, sequential file names:

- `001-...md`
- `002-...md`
- `003-...md`

This keeps the lane easy to scan for non-developers.

## Keep tasks small

A good task usually touches one docs cluster or one focused implementation area.
Avoid combining report logic, UI, and delivery changes into one task.

## Patch handoff fallback

Use this only when Codex completes the task but cannot push a branch or create a GitHub PR.

Ask Codex for a `unified diff` patch that you can apply locally.
Codex should include changed file paths, the full patch, verification commands and results, and commit hash if available.

Copy-ready prompt:

```text
Push failed, so please provide the complete patch for the current task.

I need the full unified diff that I can apply locally.

Include all changed files.
Do not summarize. Provide the exact patch only.

Also include:
- current branch name
- commit hash, if available
- verification commands run
- verification results
```
