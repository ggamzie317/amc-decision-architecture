# AMC Manus Fixed Report Workflow

## Purpose

This runbook fixes the current production path for premium AMC reports:

- AMC owns structure, logic, interpretation rules, terminology, and review.
- Manus is the fixed premium renderer for presentation quality.
- Codex hardens workflow and integration operations around that path.

Manus is fixed for now because premium report quality is customer-sensitive and must stay stable.

## Ownership Model

### AMC and Codex own

- Deterministic report structure and framework-led interpretation.
- Scoring and section logic.
- Approved visible terminology and section naming rules.
- Handoff payload packaging and validation checks.
- Prompt packaging, scripts, QA helpers, and review gates.

### Manus can do

- Premium visual rendering and layout polish.
- High-quality typographic and spacing execution.
- Visual hierarchy improvements that keep AMC structure unchanged.

### Manus must not do

- Change AMC logic, scores, or interpretation intent.
- Introduce recommendation language.
- Rename frozen visible sections or internal/external meaning.
- Convert the report into a startup SaaS dashboard style.

## Required AMC Interpretation Rules

- AMC does not decide for the client.
- AMC does not recommend.
- AMC structures the decision.
- Use `Structural Reading`, not `Decision Verdict`.
- Use `Decision Conditions` and `Commitment Condition`, not `Decision Gate` or Go / No-Go language.

## Single vs Comparative External Sections

- Single-case reports should primarily show `External Snapshot`.
- Comparative reports should primarily show `External Comparative Snapshot`.
- Do not make both external sections visually compete in the same report.
- Comparative sections should be table-first, followed by short reading and implication lines.

## Visible Terminology Controls

### Required visible terms

- `Structural Reading`
- `Decision Conditions`
- `Commitment Condition`
- `External Snapshot` (single-case primary)
- `External Comparative Snapshot` (comparative-case primary)

### Banned or risky visible terms

- `Decision Verdict`
- `Decision Gate`
- Go / No-Go wording
- recommendation framing such as `strong recommendation`
- coaching-style directive language that implies AMC chooses for the client

## Visual Style Constraints

- Premium, calm, restrained, consulting-like tone.
- Avoid bright color-heavy UI signals.
- Avoid gamification or score-as-game cues.
- Avoid startup SaaS dashboard styling patterns.
- Keep clear section hierarchy and readable table structure.

## Manus Handoff Inputs

Use this package for each render cycle:

- hardened AMC JSON package
- human-readable review TXT
- fixed Manus prompt
- optional current report screenshots when visual refinement is needed

## Pre-Delivery Review Checklist

- No internal-only terminology is visible.
- No recommendation language is present.
- Single vs comparative mode is rendered correctly.
- Comparative sections remain table-first.
- External section emphasis follows mode-specific rules.
- Visual tone is premium, calm, restrained, and consulting-like.
- AMC structure and interpretation ownership remain intact.
- Final output is suitable for customer delivery.

## Operating Rule

Default path is Manus premium rendering. Codex should not treat redesigning a full Manus-quality renderer inside Codex as the default production workflow.
