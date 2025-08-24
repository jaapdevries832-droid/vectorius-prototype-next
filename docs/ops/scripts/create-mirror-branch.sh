#!/usr/bin/env bash
set -euo pipefail

# Usage: ops/scripts/create-mirror-branch.sh <branch> [remote]
# Example: ops/scripts/create-mirror-branch.sh Lesson-9
# Example: ops/scripts/create-mirror-branch.sh Lesson-9 upstream

BRANCH="${1:-}"
REMOTE="${2:-origin}"

if [[ -z "${BRANCH}" ]]; then
  echo "Usage: $0 <branch> [remote]"; exit 1
fi

# Ensure we are inside a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repo."; exit 1; }

# Fetch the remote branch
echo "Fetching ${REMOTE}/${BRANCH}…"
git fetch "${REMOTE}" "${BRANCH}"

# Verify remote branch exists
if ! git show-ref --verify --quiet "refs/remotes/${REMOTE}/${BRANCH}"; then
  echo "Remote branch ${REMOTE}/${BRANCH} not found."; exit 1
fi

# Create local branch tracking the remote and mirror it
echo "Creating local branch '${BRANCH}' to track ${REMOTE}/${BRANCH}…"
git switch -C "${BRANCH}" --track "${REMOTE}/${BRANCH}"

# Hard reset to ensure it mirrors remote exactly
git reset --hard "${REMOTE}/${BRANCH}"

echo "✅ Local branch '${BRANCH}' created and mirrored from ${REMOTE}/${BRANCH}."
git status -sb
