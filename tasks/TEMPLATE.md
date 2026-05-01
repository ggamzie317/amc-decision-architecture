# Task

## Objective

One sentence describing the result.

## Context

Why this task matters now, in plain business terms.

## Scope

- Explicitly list what is in-scope.
- Keep the scope narrow and task-sized.

## Non-goals

- Explicitly list what must not change.
- Re-state AMC guardrails if relevant.

## Files likely involved

- path/to/file
- path/to/file

## Implementation requirements

- Documentation-only or code change (state clearly).
- Preserve AMC philosophy and customer-facing terminology.
- Keep the patch easy for a non-developer product owner to review.

## Verification commands

List exact commands Codex must run.

Example:

```bash
git diff --check
```

## Review checklist

- Roles (Product owner / ChatGPT / Codex) are clear.
- AMC terminology remains intact.
- No out-of-scope architecture or UX drift.
- Verification commands were run and reported.
