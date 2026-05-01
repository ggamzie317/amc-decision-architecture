# AMC Codex Operating Loop

This document defines the operating model for using ChatGPT and Codex together on the AMC project.

## Roles

- User: product owner, final approver, business/brand decision maker.
- ChatGPT: AI project lead, architecture steward, task writer, reviewer, and consistency guard.
- Codex: implementation agent for code, refactors, tests, scripts, documentation patches, and PR-level changes.

## Working Principle

AMC development should move in small, meaningful batches rather than line-by-line microsteps.

Each batch should have:

1. A clear objective.
2. A limited file scope.
3. Explicit non-goals.
4. Required verification commands.
5. A short review checklist.

## Default Loop

```text
Product owner defines direction
-> ChatGPT writes or updates a Codex task
-> Codex implements in a branch or PR
-> ChatGPT reviews diff, tests, terminology, and AMC philosophy fit
-> Product owner approves or redirects
-> Next task begins
```

## AMC Guardrails

Codex must preserve these AMC rules unless a task explicitly says otherwise:

- AMC does not recommend.
- AMC does not decide for the client.
- AMC structures the decision.
- Customer-facing language must remain premium, restrained, structural, and non-coaching.
- Do not expose internal labels such as Decision Verdict, Decision Gate, or unexplained internal acronyms.
- Single-case reports should primarily use External Snapshot.
- Comparative reports should primarily use External Comparative Snapshot.
- Do not make both external sections visually compete as primary sections.
- Comparative tables should remain table-first, with short reading and implication lines.
- Essential is report only.
- Executive is report plus bounded 7-day report-linked chatbot access.

## Preferred Task Size

Good Codex task size:

- one module or small feature area
- one docs cluster
- one report rendering improvement
- one UI copy cleanup
- one validation/test addition

Avoid:

- broad rewrites
- open-ended redesigns
- hidden logic changes
- simultaneous UI/backend/report copy changes unless necessary

## Required Task Template

Every Codex task should include:

```md
# Task

## Objective

## Context

## Scope

## Non-goals

## Files likely involved

## Implementation requirements

## Verification commands

## Review checklist
```

## Review Checklist

Before merging any Codex output, check:

- Does the change preserve AMC terminology?
- Does it avoid recommendation/coaching language?
- Does it preserve report-led positioning?
- Does it avoid unnecessary architecture drift?
- Do tests or smoke commands pass?
- Are customer-facing labels clean and English-first for launch baseline?

