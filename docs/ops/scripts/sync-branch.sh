#!/usr/bin/env bash
set -euo pipefail

# Usage: ops/scripts/sync-branch.sh <branch> [remote]
# Example: ops/scripts/sync-branch.sh Lesson-8
# Example: ops/scripts/sync-branch.sh Lesson-8 upstream

BRANCH="${1:-}"
REMOTE="${2:-origin}"

if [[ -z "${BRANCH}" ]]; then
  echo "Usage: $0 <branch> [remote]"; exit 1
fi

# Ensure we are inside a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repo."; exit 1; }

# Ensure clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree not clean. Commit/stash changes first."; exit 1;
fi

# Fetch the branch from remote
echo "Fetching ${REMOTE}/${BRANCH}…"
git fetch "${REMOTE}" "${BRANCH}"

# Verify remote branch exists
if ! git show-ref --verify --quiet "refs/remotes/${REMOTE}/${BRANCH}"; then
  echo "Remote branch ${REMOTE}/${BRANCH} not found."; exit 1
fi

# Create/replace local branch to track the remote and mirror it exactly
echo "Creating/switching local ${BRANCH} to mirror ${REMOTE}/${BRANCH}…"
git switch -C "${BRANCH}" --track "${REMOTE}/${BRANCH}"

# Force local to match remote (mirror)
git reset --hard "${REMOTE}/${BRANCH}"

echo "✅ Synced and switched to ${BRANCH} (tracking ${REMOTE}/${BRANCH})."
git status -sb
