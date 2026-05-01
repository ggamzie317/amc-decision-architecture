# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/009-manus-fixed-report-workflow.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Document the fixed Manus report production workflow for AMC so premium report rendering is treated as a stable external rendering step rather than a moving design experiment inside Codex.

## Context

AMC report quality is customer-critical. Prior attempts to reproduce Manus-grade visual quality directly through Codex/HTML/DOCX were possible in parts, but not reliable enough as the primary production path.

The current operating decision is:

```text
AMC owns structure, logic, payload, terminology, and review.
Manus owns premium report rendering and presentation polish.
Codex owns workflow hardening, prompt packaging, validation helpers, and integration scaffolding.
```

This task should preserve that decision so future work does not drift back into trying to rebuild the full Manus-quality renderer inside Codex.

## Scope

Create a concise workflow document under `docs/`.

Recommended file:

- `docs/amc_manus_fixed_report_workflow.md`

Also add the document to:

- `docs/README.md`

The document should cover:

1. Why Manus is the fixed premium report renderer for now.
2. What AMC/Codex still owns.
3. What Manus is allowed to do.
4. What Manus must not change.
5. Single-case vs comparative-case external section rules.
6. Required visible terminology.
7. Banned or risky visible terminology.
8. Visual style constraints.
9. Manus handoff inputs.
10. Review checklist before customer delivery.

## Non-goals

- Do not change AMC report logic.
- Do not change scoring logic.
- Do not change frontend UI.
- Do not change email delivery.
- Do not change report section names.
- Do not build a new renderer.
- Do not generate a new report design in this task.
- Do not modify Manus payload code in this task.

## Files likely involved

- `docs/amc_manus_fixed_report_workflow.md`
- `docs/README.md`

## Implementation requirements

The document should be practical and operator-facing.

It must state clearly:

- Manus is used because premium report quality is customer-sensitive.
- Codex should not try to out-design Manus as the default path.
- Codex can still create validators, prompt builders, handoff files, scripts, and QA checks.
- AMC should keep structure and interpretation deterministic and framework-led.

Required AMC rules to include:

- AMC does not decide for the client.
- AMC does not recommend.
- AMC structures the decision.
- Use `Structural Reading`, not `Decision Verdict`.
- Use `Decision Conditions` and `Commitment Condition`, not `Decision Gate` or Go/No-Go language.
- Single-case reports should primarily show `External Snapshot`.
- Comparative reports should primarily show `External Comparative Snapshot`.
- Do not make both external sections visually compete in the same report.
- Comparative sections should be table-first, with short reading/implication lines.
- Avoid startup SaaS dashboard style, bright colors, gamification, and coaching language.

Suggested Manus handoff inputs:

- hardened AMC JSON package
- human-readable review TXT
- fixed Manus prompt
- optional current report screenshots when visual refinement is needed

Suggested review checklist:

- No internal terminology visible.
- No recommendation language.
- Single/comparative mode rendered correctly.
- Comparative table remains table-first.
- Visual tone is premium, calm, restrained, and consulting-like.
- Report structure remains AMC-owned.
- Final output is suitable for customer delivery.

## Verification commands

```bash
git diff --check
rg "Decision Verdict|Decision Gate|Go / No-Go|strong recommendation" docs/amc_manus_fixed_report_workflow.md docs/README.md || true
```

## Review checklist

- The document clearly fixes Manus as the premium rendering path.
- It does not weaken AMC ownership of structure, logic, terminology, or review.
- It prevents future drift back into Codex-only design experiments.
- It captures single/comparative report rules.
- It captures terminology and visual quality rules.
- It does not alter AMC product, report logic, UI behavior, scoring, or delivery code.
- Verification commands are reported.
