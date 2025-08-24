#!/usr/bin/env bash
set -euo pipefail

# Usage: ops/scripts/push-branch.sh <branch> [commit_message] [remote]
# Example: ops/scripts/push-branch.sh Lesson-8
# Example: ops/scripts/push-branch.sh Lesson-8 "Finished Lesson 8 updates"
# Example: ops/scripts/push-branch.sh Lesson-8 "" upstream

BRANCH="${1:-}"
DATE=$(date +%F)
COMMIT_MSG="${2:-${DATE}-vectorius-commit}"
REMOTE="${3:-origin}"

if [[ -z "${BRANCH}" ]]; then
  echo "Usage: $0 <branch> [commit_message] [remote]"; exit 1
fi

# Ensure we are inside a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repo."; exit 1; }

# Switch to branch
git switch "${BRANCH}"

# Stage all changes
git add -A

# Commit (skip if nothing to commit)
if git diff --cached --quiet; then
  echo "No staged changes; proceeding without new commit."
else
  git commit -m "${COMMIT_MSG}"
fi

# Push local branch up to remote (force-safe)
git push -u "${REMOTE}" "${BRANCH}"

echo "✅ Local branch '${BRANCH}' is now synced to ${REMOTE}/${BRANCH}."
git status -sb