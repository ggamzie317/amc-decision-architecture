# Task

## Objective

Describe the concrete outcome Codex should produce.

## Context

Explain the existing AMC structure, document, module, or workflow this task touches.

Include links to relevant docs or issues when available.

## Scope

List the work that is allowed in this task.

## Non-goals

List what Codex must not change.

Use this section to prevent architecture drift, report-logic drift, and customer-facing terminology drift.

## Files likely involved

List expected files or folders.

This is guidance, not permission to modify unrelated areas.

## Implementation requirements

Give concrete implementation rules.

Examples:

- Keep the patch documentation-only.
- Preserve current AMC terminology.
- Do not change scoring logic.
- Do not change email delivery.
- Keep wording understandable for a non-developer product owner.

## Verification commands

List commands Codex should run before reporting completion.

Examples:

```bash
git diff --check
rg "Decision Verdict|Decision Gate|Go / No-Go|strong recommendation" docs tasks || true
```

## Review checklist

Before the work is accepted, check:

- The change preserves AMC terminology.
- The change avoids recommendation/coaching language.
- The change preserves report-led positioning.
- The change avoids unnecessary architecture drift.
- Required verification commands were run.
- The result is understandable to the product owner.

