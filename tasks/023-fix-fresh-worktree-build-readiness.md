# Task 023 — Fix fresh-worktree build readiness

Goal: Make manus-ui build/server readiness reproducible from a clean worktree instead of relying on local untracked files or locally installed packages.

Context: During soft-launch dry-run, main build passed locally, but the Codex worktree failed because required runtime/build assets were not reproducible from git/package metadata.

Observed issues:
- manus-ui/client/src/lib/utils.ts exists in the primary worktree but is ignored by .gitignore via the generic lib/ rule, so it is not tracked and is missing in codex-work/fresh worktrees.
- nodemailer exists in the primary local node_modules but is not declared in manus-ui/package.json or pnpm-lock.yaml, so server startup can fail in fresh installs.

Scope:
- Fix repo reproducibility for the missing utils file and nodemailer dependency.

Allowed changes:
- .gitignore, only if needed to allow tracking manus-ui/client/src/lib/utils.ts while preserving sensible ignore rules.
- manus-ui/client/src/lib/utils.ts, if needed to add the tracked utility file.
- manus-ui/package.json and manus-ui/pnpm-lock.yaml, if needed to declare nodemailer.

Required behavior:
- Ensure manus-ui/client/src/lib/utils.ts is tracked by git and available in fresh worktrees.
- Ensure nodemailer is declared as a manus-ui dependency and lockfile is updated.
- Do not change report logic, mapping logic, validation logic, payment logic, email logic, UI copy, payloads, templates, Manus scripts, or output files.

Acceptance checks:
- git ls-files manus-ui/client/src/lib/utils.ts
- grep -n "nodemailer" manus-ui/package.json manus-ui/pnpm-lock.yaml
- pnpm --dir manus-ui build
- pnpm --dir manus-ui exec tsx server/index.ts should not fail immediately due to missing nodemailer or missing utils file
- git diff --check

Manual read check: A clean/fresh worktree should have the same required utils file and nodemailer dependency needed for build/server startup.
