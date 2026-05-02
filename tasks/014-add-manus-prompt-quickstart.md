# Task 014 — Add one-screen Manus prompt quickstart

Goal: Make the Manus handoff runbook easier for a non-developer operator to use.

Context: The current Manus workflow is powerful, but it can still feel confusing because it mentions terminal commands, prompt files, review text, JSON, and Manus instructions in different places.

Scope: Modify only docs/amc_manus_handoff_package_runbook.md unless another docs file is strictly necessary.

Required behavior:
- Add a short quickstart section near the top.
- Clearly state the one command to run for single-case Manus prompt generation.
- Clearly state the one command to run for comparative-case Manus prompt generation.
- Clearly explain what the operator should paste into Manus.
- Clearly say: Open Manus and paste the copied prompt. Do not attach files.
- Keep the wording calm, simple, and step-by-step.
- Do not change AMC report logic, payloads, scripts, UI, or output files.

Acceptance checks:
- git diff --check
- Manual read: the first screen of the runbook should tell the operator what to do without needing to understand the whole system.
