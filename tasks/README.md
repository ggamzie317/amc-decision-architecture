# AMC Codex Task Lane

This folder holds task-sized specifications for Codex work on AMC.

The goal is to make AMC development easier to operate without losing the existing AMC philosophy, brand tone, report structure, and delivery discipline.

## Roles

- Product owner: sets direction, reviews important outputs, and gives final approval.
- ChatGPT: writes task specs, protects AMC structure and terminology, reviews Codex output, and prepares next steps.
- Codex: implements small, well-scoped changes in code, docs, tests, scripts, or UI according to the task spec.

## Simple Flow

1. Product owner defines the next direction.
2. ChatGPT writes or updates a task spec in this folder or in a GitHub issue.
3. Codex implements the task in a branch or pull request.
4. ChatGPT reviews the diff against AMC guardrails.
5. Product owner approves, redirects, or asks for the next task.

## Task Naming

Use short, numbered task names when useful:

```text
001-establish-codex-task-lane.md
002-clean-launch-copy.md
003-tighten-report-delivery-smoke-test.md
```

Task names should describe the work clearly without requiring developer context.

## Task Size

A good Codex task should be large enough to be useful, but small enough to review safely.

Prefer:

- one docs improvement
- one UI copy cleanup
- one test addition
- one report-rendering refinement
- one automation script improvement

Avoid:

- broad rewrites
- hidden architecture changes
- simultaneous report, UI, backend, and delivery edits
- changes that reinterpret AMC strategy or customer-facing philosophy

## AMC Guardrails

Unless a task explicitly says otherwise, preserve the current AMC direction:

- AMC does not recommend.
- AMC does not decide for the client.
- AMC structures the decision.
- Keep language premium, restrained, structural, and non-coaching.
- Do not expose internal labels such as Decision Verdict or Decision Gate.
- Do not rename existing report sections casually.
- Do not change scoring, report logic, frontend UI, or email delivery unless the task scope explicitly includes it.

## Reusable Template

Start from:

- `tasks/TEMPLATE.md`

