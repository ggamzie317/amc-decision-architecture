#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ROOT="/Users/kwonkibum/amc-codex-work"

usage() {
  echo "Usage:"
  echo "  bash scripts/codex_start_task.sh tasks/005-example-task.md"
  echo "  bash scripts/codex_start_task.sh 005-example-task"
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

INPUT_TASK="$1"
CURRENT_ROOT="$(pwd)"

if [[ "$CURRENT_ROOT" != "$EXPECTED_ROOT" ]]; then
  echo "Warning: expected to run from $EXPECTED_ROOT"
  echo "Current directory: $CURRENT_ROOT"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Worktree is dirty. Stop and review/commit/stash changes before starting a new task branch."
  git status -sb
  exit 1
fi

echo "Fetching origin..."
git fetch origin

TASK_FILE="$INPUT_TASK"
if [[ "$TASK_FILE" != tasks/* ]]; then
  TASK_FILE="tasks/${TASK_FILE}"
fi
if [[ "$TASK_FILE" != *.md ]]; then
  TASK_FILE="${TASK_FILE}.md"
fi

TASK_BASENAME="$(basename "$TASK_FILE" .md)"
BRANCH_NAME="codex/${TASK_BASENAME}"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "Branch already exists locally: $BRANCH_NAME"
  echo "Switching to existing branch (no overwrite)."
  git switch "$BRANCH_NAME"
else
  echo "Creating branch from origin/main: $BRANCH_NAME"
  git switch -c "$BRANCH_NAME" origin/main
fi

if [[ ! -f "$TASK_FILE" ]]; then
  echo "Task file not found after switching branches: $TASK_FILE"
  echo "The checkout may be stale or the task is not present on origin/main."
  echo "Request the task contents or update the checkout."
  exit 1
fi

echo
echo "Task file: $TASK_FILE"
echo "Branch: $(git branch --show-current)"
git status -sb

cat <<EOF

Copy-ready Codex app prompt:

Please work on \`$TASK_FILE\`.

Before making changes, run the startup preflight:

* \`git remote -v\`
* \`git branch --show-current\`
* \`git status -sb\`
* \`ls tasks\`
* \`sed -n '1,220p' $TASK_FILE\`

Then implement only the changes described in that task file.

After changes:

* Run all verification commands listed in the task file.
* If PR creation works, create a PR.
* If PR creation does not work, return:
  * complete unified diff patch
  * current branch
  * commit hash (if available)
  * verification commands run
  * verification results
EOF
