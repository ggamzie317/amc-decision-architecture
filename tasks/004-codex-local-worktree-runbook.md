# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/004-codex-local-worktree-runbook.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Add a short local Codex worktree runbook so future AMC Codex app work starts from the correct clean worktree instead of the older working repository.

## Context

During Task 003, the Codex app initially kept looking at the older `~/amc-decision-architecture` checkout, which had many local modifications and did not show the new `tasks/` lane.

A clean worktree was created at:

```text
/Users/kwonkibum/amc-codex-work
```

That worktree allowed the Codex app workflow to succeed:

```text
Task file -> Codex app local execution -> branch push -> GitHub PR -> review -> terminal merge
```

This small runbook should make that workflow repeatable.

## Scope

Documentation-only change.

Add a concise runbook document under `docs/` explaining:

- Use `/Users/kwonkibum/amc-codex-work` as the Codex app working folder.
- Keep `/Users/kwonkibum/amc-decision-architecture` as the main/legacy working repository.
- Start each Codex task from a fresh branch based on `origin/main`.
- Run startup preflight before changes.
- Push the branch and open/merge PR through the verified flow.
- If Codex cannot push or create PR, use the patch handoff fallback.

Recommended file:

- `docs/amc_codex_local_worktree_runbook.md`

Also add the new runbook to the docs index:

- `docs/README.md`

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not reorganize existing docs.
- Do not add complex Git workflows.

## Files likely involved

- `docs/amc_codex_local_worktree_runbook.md`
- `docs/README.md`

## Implementation requirements

- Keep the runbook short and practical.
- Write for a non-developer product owner.
- Include the exact command to start a new Codex task branch:

```bash
cd /Users/kwonkibum/amc-codex-work
git fetch origin
git switch -c codex/<task-name> origin/main
```

- Include the exact command pattern to push:

```bash
git push -u origin codex/<task-name>
```

- Mention that worktree `main` checkout may fail because `main` is already used by `/Users/kwonkibum/amc-decision-architecture`.
- Keep wording calm and operational.

## Verification commands

```bash
git diff --check
rg "Decision Verdict|Decision Gate|Go / No-Go|strong recommendation" docs tasks || true
```

## Review checklist

- The runbook makes the local worktree workflow easy to repeat.
- It avoids telling the user to checkout `main` inside `amc-codex-work`.
- It clearly separates main repository vs Codex worktree.
- No AMC product, report, UI, scoring, or delivery logic is touched.
- Verification commands are reported.
