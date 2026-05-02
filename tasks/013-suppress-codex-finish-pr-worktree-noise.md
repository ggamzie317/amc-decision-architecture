# Task 013 — Suppress known worktree conflict noise in codex_finish_pr.sh

Goal: Improve scripts/codex_finish_pr.sh so the known local worktree conflict message does not appear as a scary failed line after a successful PR merge.

Context: PR #16 improved the explanation, but this line still appears before the friendly note:
failed to run git: fatal: main is already used by worktree

Scope: Modify only scripts/codex_finish_pr.sh.

Required behavior:
- Keep real gh pr merge failures visible.
- If the PR merge succeeds, do not show the known main-worktree conflict as a scary failure.
- Print a calm success message that the PR was merged on GitHub.
- Tell the operator to update the primary main worktree with git pull origin main.
- Do not redesign the whole workflow.

Acceptance checks:
- bash -n scripts/codex_finish_pr.sh
- git diff --check
