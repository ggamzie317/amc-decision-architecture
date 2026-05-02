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
    PR_STATE="$(gh pr view "$PR_NUMBER" --json state --jq '.state' 2>/dev/null || true)"
    if [[ "$PR_STATE" == "MERGED" ]]; then
      echo
      echo "Note: PR #$PR_NUMBER is merged on GitHub."
      echo "Local cleanup reported that 'main' is already used by another worktree."
      echo "Do not checkout main in /Users/kwonkibum/amc-codex-work."
      echo "Update main in the primary worktree instead:"
      echo "  cd /Users/kwonkibum/amc-decision-architecture"
      echo "  git pull origin main"
    else
      echo
      echo "Error: merge command returned a worktree warning, but PR state is not MERGED."
      echo "Check with: gh pr view $PR_NUMBER --json state,mergedAt,url"
      exit "$MERGE_EXIT"
    fi
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
