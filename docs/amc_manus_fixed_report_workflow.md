# AMC Manus Fixed Report Workflow

## Purpose

This runbook fixes the current production path for premium AMC reports:

- AMC owns structure, logic, interpretation rules, terminology, and review.
- Manus is the fixed premium renderer for presentation quality.
- Codex hardens workflow and integration operations around that path.

Manus is fixed for now because premium report quality is customer-sensitive and must stay stable.

The DOCX template runner remains a baseline/fallback path for deterministic report generation. It is not the final premium customer-facing design target. Final premium report delivery should be rendered through Manus under the structure, terminology, and visual lock in this workflow.

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
- PDF-ready executive consulting report presentation.

### Manus must not do

- Change AMC logic, scores, or interpretation intent.
- Introduce recommendation language.
- Rename frozen visible sections or internal/external meaning.
- Convert the report into a startup SaaS dashboard style.
- Convert the report into a dashboard-like scorecard, colorful SaaS UI, coaching workbook, motivational poster, or gamified score experience.
- Invent sections, labels, scores, visual score systems, or decision framings.

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

- Use simple executive consulting report style.
- Keep the visual direction clean, McKinsey-simple, restrained, premium, and non-decorative.
- Use strong typography hierarchy, generous whitespace, and a conclusion-first first page.
- Make the report PDF-ready: clear page hierarchy, readable tables, disciplined spacing, and no screen-only UI affordances.
- Keep comparative pages table-first, followed by concise reading and implication lines.
- Avoid bright color-heavy UI signals, colorful SaaS styling, dashboard-like scorecard feel, workbook layouts, motivational poster styling, heavy icons, gamification, or score-as-game cues.

## Manus Handoff Inputs

Use this package for each render cycle:

- hardened AMC JSON package
- human-readable review TXT
- fixed Manus prompt
- optional current report screenshots when visual refinement is needed

## Pre-Delivery Review Checklist

- Visual tone is premium, calm, restrained, non-decorative, and simple executive consulting report style.
- Final output is PDF-ready with strong typography hierarchy, generous whitespace, readable tables, and a conclusion-first first page.
- No dashboard-like scorecard feel, colorful SaaS UI style, coaching workbook style, motivational poster style, heavy icons, or gamified score visuals are present.
- Section fidelity is intact: no invented sections, omitted required sections, renamed frozen sections, invented labels, or changed section order.
- Single vs comparative mode is rendered correctly.
- Single-case output emphasizes `External Snapshot`.
- Comparative output emphasizes `External Comparative Snapshot`.
- Comparative sections remain table-first, followed by short reading and implication lines.
- Terminology discipline is intact: required AMC terms remain visible where expected.
- No internal-only terminology, internal acronyms, payload keys, or implementation terms are visible.
- No raw score machinery, score formulas, or invented scores are visible.
- No recommendation language is present.
- No `Decision Verdict`, `Decision Gate`, Go / No-Go, or Go-No-Go framing is present.
- AMC structure and interpretation ownership remain intact: AMC does not decide, AMC does not recommend, AMC structures the decision, and Manus renders only.
- Final output is suitable for customer delivery.

## Operating Rule

Default path is Manus premium rendering. Codex should not treat redesigning a full Manus-quality renderer inside Codex as the default production workflow.
