# Task

## Objective

Add a lightweight patch handoff protocol so Codex work can continue even when the Codex runtime cannot push branches or create GitHub pull requests.

## Context

During the first Codex task-lane test, Codex successfully created a local commit but could not push to GitHub because the runtime hit a network/proxy restriction:

```text
CONNECT tunnel failed, response 403
```

The implementation work itself was usable, but the handoff required Codex to provide a patch that could be reviewed and applied outside the Codex runtime.

This task makes that fallback flow explicit so future AMC work is not blocked by the same push limitation.

## Scope

Update the task-lane documentation only.

Recommended updates:

- Add a short `Patch handoff fallback` section to `tasks/README.md`.
- Explain when to use it: when Codex completes a task but cannot push/create PR.
- Add the exact prompt pattern the product owner can give Codex to request a full unified diff.
- State that Codex should include changed file paths, full patch, verification results, and commit hash if available.
- Keep the language simple for a non-developer product owner.

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not redesign the Codex task lane.
- Do not add heavy process or complex branching rules.

## Files likely involved

- `tasks/README.md`

## Implementation requirements

- Documentation-only change.
- Preserve the existing Product owner / ChatGPT / Codex role structure.
- Keep the fallback flow short and practical.
- Include a copy-ready prompt block for requesting a patch from Codex.
- Use `unified diff` language explicitly.

Suggested copy-ready prompt to include or adapt:

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

## Verification commands

```bash
git diff --check
rg "Decision Verdict|Decision Gate|Go / No-Go|strong recommendation" docs tasks || true
```

## Review checklist

- The fallback flow is understandable for a non-developer product owner.
- The task lane remains lightweight.
- The change helps future Codex work continue despite push restrictions.
- No AMC product, report, UI, scoring, or delivery logic is touched.
- Verification commands are reported.
