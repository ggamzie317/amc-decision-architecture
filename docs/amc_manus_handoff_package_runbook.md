# AMC Manus Handoff Package Runbook

## Purpose

This runbook standardizes the AMC-to-Manus handoff package for premium report rendering so every cycle uses the same inputs, boundaries, and review gates.

## Required Handoff Inputs

- hardened AMC JSON package
- human-readable review TXT
- fixed Manus prompt
- optional screenshots of current report/dashboard/comparative table

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
- Use `Structural Reading`, not `Decision Verdict`.
- Use `Decision Conditions` and `Commitment Condition`, not `Decision Gate` or Go / No-Go language.
- Single-case reports should primarily show `External Snapshot`.
- Comparative reports should primarily show `External Comparative Snapshot`.
- Comparative report sections should be table-first.
- Visual tone should be premium, calm, restrained, and consulting-like.

The fixed prompt must also instruct Manus to:

- not redesign AMC logic
- not invent sections or scores
- not introduce recommendation language
- preserve single vs comparative external section rules

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

## Review Ownership (ChatGPT and Codex)

- ChatGPT and Codex review Manus output against AMC workflow and terminology rules.
- Use [docs/amc_manus_fixed_report_workflow.md](/Users/kwonkibum/amc-codex-work/docs/amc_manus_fixed_report_workflow.md) as the governing checklist.
- Confirm output is suitable for customer delivery before final packaging.

## Failure and Rework Triggers

Request rework if any of the following appear:

- internal-only or banned visible terms
- recommendation framing or Go / No-Go phrasing
- single/comparative external section mode mismatch
- comparative section not table-first
- obvious drift from premium, calm, restrained visual tone
- section invention, score invention, or logic drift

## Minimal Operator Sequence

1. Generate or select the hardened AMC JSON package.
2. Generate or select the human-readable review TXT.
3. Use the fixed Manus prompt.
4. Paste prompt + JSON + TXT into Manus without asking Manus to alter logic.
5. Add screenshots only when visual refinement is needed.
6. Review Manus output against [docs/amc_manus_fixed_report_workflow.md](/Users/kwonkibum/amc-codex-work/docs/amc_manus_fixed_report_workflow.md).
7. Approve, request rework, or package for delivery.
