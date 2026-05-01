#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/codex_finish_pr.sh <PR_NUMBER>"
}

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed or not in PATH."
  exit 1
fi

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

PR_NUMBER="$1"
if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "Error: PR number must be numeric."
  usage
  exit 1
fi

echo "PR check:"
gh pr view "$PR_NUMBER" --json number,title,state,url --jq '"#\(.number) [\(.state)] \(.title)\n\(.url)"'
echo
echo "Merging PR #$PR_NUMBER with squash and deleting remote branch..."

set +e
MERGE_OUTPUT="$(gh pr merge "$PR_NUMBER" --squash --delete-branch 2>&1)"
MERGE_EXIT=$?
set -e
echo "$MERGE_OUTPUT"

if [[ $MERGE_EXIT -ne 0 ]]; then
  if echo "$MERGE_OUTPUT" | grep -qi "already used by worktree"; then
    echo
    echo "Note: GitHub may have merged the PR even though local branch cleanup warned that 'main' is already used by another worktree."
    echo "This is a known local worktree warning and does not require checking out main in /Users/kwonkibum/amc-codex-work."
    echo "Confirm with: gh pr view $PR_NUMBER --json state,mergedAt"
  else
    echo
    echo "Error: merge command failed before a known post-merge cleanup warning."
    exit "$MERGE_EXIT"
  fi
fi

echo
echo "Fetching origin..."
git fetch origin

echo
echo "Current branch: $(git branch --show-current)"
git status -sb

echo
echo "Next start command pattern:"
echo "bash scripts/codex_start_task.sh tasks/<next-task>.md"
