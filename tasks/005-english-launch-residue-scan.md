# Task

## Startup preflight

Run this before doing implementation work:

```bash
git remote -v
git branch --show-current
git status -sb
ls tasks
sed -n '1,220p' tasks/005-english-launch-residue-scan.md
```

If the expected task file is missing, stop. Do not proceed by guessing. Report that the checkout may be stale and request the task contents or an updated checkout.

## Objective

Add a lightweight English-first launch residue scan so AMC can quickly identify visible Korean, Chinese, or legacy multilingual UI/report copy before soft launch.

## Context

AMC is currently prioritizing an English-first launch baseline. Earlier cleanup removed user-facing language toggles and multilingual copy from the web flow, but small residue can still remain in UI, docs, templates, emails, fixtures, or report-facing strings.

This task should add a small repeatable scan command. It should report likely residue only; it should not automatically rewrite product copy.

## Scope

Add a small scanner or script that searches likely user-facing project areas for:

- Korean Hangul characters
- Chinese Han characters
- obvious legacy language-toggle terms such as `ko`, `zh`, `LanguageToggle`, `selected language`, `report language`

Recommended approach:

- Add a simple script under `scripts/`.
- Add a README or docs note only if needed.
- Keep output readable and grep-like.
- Exclude heavy/generated output directories where practical.

Suggested script name:

- `scripts/check_english_launch_residue.sh`

Suggested behavior:

- Search likely source/docs/prompt/template areas.
- Print matching file paths and lines.
- Exit `0` for now, because this is a review aid, not a hard CI gate.

## Non-goals

- Do not rewrite UI copy in this task.
- Do not delete files.
- Do not change report logic.
- Do not change scoring logic.
- Do not change frontend behavior.
- Do not change email delivery.
- Do not change AMC section names.
- Do not make this a CI-blocking check yet.

## Files likely involved

- `scripts/check_english_launch_residue.sh`
- optionally `README.md` or `docs/README.md` if a short usage link is useful

## Implementation requirements

- Keep the script portable for macOS shell usage.
- Use simple shell commands such as `grep`, `find`, or `rg` if available.
- Avoid scanning `.git`, `node_modules`, build artifacts, and large generated output folders.
- The script must be safe to run repeatedly.
- The script should print a short header explaining that matches are review candidates.
- The script should not fail the run only because matches are found.

Example command users should be able to run:

```bash
bash scripts/check_english_launch_residue.sh
```

## Verification commands

```bash
git diff --check
bash scripts/check_english_launch_residue.sh
```

## Review checklist

- The script is small and easy to understand.
- It helps find English-first launch residue without changing product behavior.
- It avoids heavy/generated folders.
- It does not fail just because matches exist.
- No AMC product, report, UI behavior, scoring, or delivery logic is changed.
- Verification commands are reported.
