# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/011-fix-manus-runbook-local-links.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Fix local absolute documentation links in the Manus handoff runbook so the docs remain portable inside the repository.

## Context

`docs/amc_manus_handoff_package_runbook.md` currently includes links that point to the local Codex worktree path, such as:

```text
/Users/kwonkibum/amc-codex-work/docs/amc_manus_fixed_report_workflow.md
```

Those links are useful locally but should not be committed as repository documentation. The repo docs should use relative links or plain repo-relative paths.

## Scope

Documentation-only cleanup.

Update links in:

- `docs/amc_manus_handoff_package_runbook.md`

Use relative Markdown links where appropriate, for example:

```md
[docs/amc_manus_fixed_report_workflow.md](amc_manus_fixed_report_workflow.md)
```

or use plain repo-relative text where that reads better:

```text
docs/amc_manus_fixed_report_workflow.md
```

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not rewrite the Manus workflow.
- Do not change handoff rules or terminology policy.
- Do not touch unrelated documentation.

## Files likely involved

- `docs/amc_manus_handoff_package_runbook.md`

## Implementation requirements

- Replace local absolute paths with repository-portable links or paths.
- Keep wording and meaning unchanged except for link/path cleanup.
- Keep the patch minimal.
- Do not remove references to `docs/amc_manus_fixed_report_workflow.md`; only make them portable.

## Verification commands

```bash
git diff --check
rg "/Users/kwonkibum|amc-codex-work" docs/amc_manus_handoff_package_runbook.md || true
```

## Review checklist

- No local absolute paths remain in the runbook.
- Links remain readable in GitHub.
- Manus handoff rules remain unchanged.
- No AMC product, report logic, UI behavior, scoring, or delivery code is touched.
- Verification commands are reported.
