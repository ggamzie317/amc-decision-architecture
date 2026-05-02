# Task 012 — Improve codex_finish_pr.sh worktree handling

Goal: Improve scripts/codex_finish_pr.sh so a successful GitHub PR merge does not look like a failure when local main is already used by another worktree.

Scope: Modify only scripts/codex_finish_pr.sh.

Required behavior:
- Keep real gh pr merge failures visible.
- After a successful merge, do not treat local main worktree checkout conflict as merge failure.
- If main is already managed by /Users/kwonkibum/amc-decision-architecture, print a clear note telling the operator to run git pull origin main there.

Acceptance checks:
- bash -n scripts/codex_finish_pr.sh
- git diff --check
