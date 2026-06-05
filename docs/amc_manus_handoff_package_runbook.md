# AMC Manus Handoff Package Runbook

## Purpose

This runbook standardizes the AMC-to-Manus handoff package for premium report rendering so every cycle uses the same inputs, boundaries, and review gates.

The DOCX template runner is a baseline/fallback production path for deterministic report generation. It is not the final premium customer-facing design target. The intended premium customer-facing report is produced through Manus using the locked AMC structure and terminology rules below.

## Quickstart (One Screen)

If you only need the fast operator path, do this:

1. Run one command to copy the Manus prompt to your clipboard.
2. Open Manus and paste the copied prompt.
3. Paste JSON + review TXT below the prompt in the same message.
4. Do not attach files.

Single-case prompt command:

```bash
cat <<'EOF' | pbcopy
You are rendering an AMC premium single-case report.

Rules:
- AMC does not decide for the client.
- AMC does not recommend.
- AMC structures the decision.
- Manus is renderer-only. Do not change AMC logic, interpretation, section order, or scoring.
- The DOCX template output is baseline/fallback only, not the final premium visual design target.
- Use "Structural Reading", not "Decision Verdict".
- Use "Decision Conditions" and "Commitment Condition", not "Decision Gate" or Go / No-Go wording.
- In single-case mode, External Snapshot is the primary external section.
- Render as a simple executive consulting report: clean McKinsey-simple visual direction, strong typography hierarchy, generous whitespace, conclusion-first first page, and PDF-ready report layout.
- Keep the design restrained, premium, non-decorative, and report-like.
- Do not create a dashboard-like scorecard feel, colorful SaaS UI style, coaching workbook style, motivational poster style, heavy icon system, or gamified score visuals.
- Do not invent sections, scores, labels, recommendation language, Decision Verdict / Decision Gate / Go-No-Go framing, or internal terminology.

Now render using the JSON as source of truth. Treat review TXT as review aid only.
EOF
```

Comparative-case prompt command:

```bash
cat <<'EOF' | pbcopy
You are rendering an AMC premium comparative report.

Rules:
- AMC does not decide for the client.
- AMC does not recommend.
- AMC structures the decision.
- Manus is renderer-only. Do not change AMC logic, interpretation, section order, or scoring.
- The DOCX template output is baseline/fallback only, not the final premium visual design target.
- Use "Structural Reading", not "Decision Verdict".
- Use "Decision Conditions" and "Commitment Condition", not "Decision Gate" or Go / No-Go wording.
- In comparative mode, External Comparative Snapshot is the primary external section.
- Comparative sections must be table-first, with tables carrying the comparison before short reading and implication lines.
- Render as a simple executive consulting report: clean McKinsey-simple visual direction, strong typography hierarchy, generous whitespace, conclusion-first first page, and PDF-ready report layout.
- Keep the design restrained, premium, non-decorative, and report-like.
- Do not create a dashboard-like scorecard feel, colorful SaaS UI style, coaching workbook style, motivational poster style, heavy icon system, or gamified score visuals.
- Do not invent sections, scores, labels, recommendation language, Decision Verdict / Decision Gate / Go-No-Go framing, or internal terminology.

Now render using the JSON as source of truth. Treat review TXT as review aid only.
EOF
```

## Required Handoff Inputs

- hardened AMC JSON package
- human-readable review TXT
- fixed Manus prompt
- optional screenshots of current report or comparative table

## Source-of-Truth Order

1. Hardened AMC JSON package (content source of truth).
2. Fixed Manus prompt (rendering and boundary instructions).
3. Human-readable review TXT (review aid only).
4. Optional screenshots (visual reference only when needed).

Rule: review TXT is not an independent source of truth and must not override JSON structure or values.

## JSON and Review TXT Usage

- Use hardened JSON to drive section content, sequencing, and interpretation fidelity.
- Use review TXT to speed human checks and highlight likely focal points.
- If JSON and TXT differ, treat JSON as authoritative and fix the TXT or regenerate it.

## Fixed Manus Prompt Requirements

The fixed prompt must remind Manus that:

- AMC does not decide for the client.
- AMC does not recommend.
- AMC structures the decision.
- Manus is renderer-only and must not change AMC logic, interpretation, scoring, section order, or governance.
- The DOCX template runner is baseline/fallback output and not the final premium visual design target.
- Use `Structural Reading`, not `Decision Verdict`.
- Use `Decision Conditions` and `Commitment Condition`, not `Decision Gate` or Go / No-Go language.
- Single-case reports should primarily show `External Snapshot`.
- Comparative reports should primarily show `External Comparative Snapshot`.
- Comparative report sections should be table-first.
- Visual tone should be premium, calm, restrained, and consulting-like.
- Visual direction should be simple executive consulting report style, clean McKinsey-simple, strongly hierarchical, generously spaced, conclusion-first on page one, PDF-ready, restrained, premium, and non-decorative.

The fixed prompt must also instruct Manus to:

- not redesign AMC logic
- not invent sections or scores
- not introduce recommendation language
- preserve single vs comparative external section rules
- avoid dashboard-like scorecard feel, colorful SaaS UI style, coaching workbook style, motivational poster style, heavy icons, and gamified score visuals
- avoid `Decision Verdict`, `Decision Gate`, Go / No-Go or Go-No-Go framing, internal acronyms, and raw score machinery

## When Screenshots Are Useful

Include screenshots only when visual refinement is needed, such as:

- typography and spacing tuning
- comparative table readability tuning
- visual hierarchy alignment to premium delivery tone

Do not use screenshots as content authority over JSON.

## What Manus Should Return

Manus should return a premium rendered report that:

- preserves AMC structure and terminology constraints
- respects single vs comparative rendering mode
- keeps comparative sections table-first
- avoids recommendation or decision-for-client language
- reads as a PDF-ready executive consulting report, not a dashboard, workbook, SaaS screen, or promotional poster

## Review Ownership (ChatGPT and Codex)

- ChatGPT and Codex review Manus output against AMC workflow and terminology rules.
- Use [docs/amc_manus_fixed_report_workflow.md](amc_manus_fixed_report_workflow.md) as the governing checklist.
- Confirm output is suitable for customer delivery before final packaging.

## Failure and Rework Triggers

Request rework if any of the following appear:

- internal-only or banned visible terms
- raw score machinery or unexplained internal acronyms
- recommendation framing or Go / No-Go phrasing
- single/comparative external section mode mismatch
- comparative section not table-first
- obvious drift from premium, calm, restrained visual tone
- dashboard-like scorecard feel, colorful SaaS UI styling, coaching workbook feel, motivational poster feel, heavy icons, or gamified score visuals
- section invention, score invention, or logic drift

## Manus Output QA Checklist

Use this checklist before customer delivery:

- Visual tone: premium, calm, restrained, non-decorative, and simple executive consulting report style.
- PDF-readiness: conclusion-first first page, strong typography hierarchy, generous whitespace, readable tables, and no screen-only dashboard affordances.
- Section fidelity: no invented sections, omitted required sections, renamed frozen sections, invented labels, or changed section order.
- Rendering mode: single-case output emphasizes `External Snapshot`; comparative output emphasizes `External Comparative Snapshot`.
- Comparative layout: comparative pages are table-first, with concise reading and implication text after the table.
- Terminology discipline: required AMC terms remain intact, including `Structural Reading`, `Decision Conditions`, and `Commitment Condition`.
- Internal terms: no internal acronyms, internal framework labels, raw payload keys, or unexplained implementation terms are visible.
- Score discipline: no raw score machinery, score formulas, gamified score visuals, or invented scores are visible.
- Recommendation discipline: no recommendation language, no `Decision Verdict`, no `Decision Gate`, no Go / No-Go or Go-No-Go framing, and no language implying AMC decides for the client.

## Minimal Operator Sequence

1. Generate or select the hardened AMC JSON package.
2. Generate or select the human-readable review TXT.
3. Use the fixed Manus prompt.
4. Paste prompt + JSON + TXT into Manus without asking Manus to alter logic.
5. Add screenshots only when visual refinement is needed.
6. Review Manus output against [docs/amc_manus_fixed_report_workflow.md](amc_manus_fixed_report_workflow.md).
7. Approve, request rework, or package for delivery.
