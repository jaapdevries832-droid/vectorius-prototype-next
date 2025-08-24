#!/usr/bin/env bash
set -euo pipefail

# Usage: ops/scripts/finish-branch.sh <branch> [commit_message] [remote]
# Example: ops/scripts/finish-branch.sh feature-branch
# Example: ops/scripts/finish-branch.sh feature-branch "custom commit message" origin

BRANCH="${1:-}"
DATE=$(date +%F)   # YYYY-MM-DD
COMMIT_MSG="${2:-${DATE}-vectorius-commit}"
REMOTE="${3:-origin}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"  # override via env if you use 'master'

if [[ -z "${BRANCH}" ]]; then
  echo "Usage: $0 <branch> [commit_message] [remote]"; exit 1
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repo."; exit 1; }

# Switch to feature branch
git switch "${BRANCH}"

# Stage & commit (no-op commit is fine)
git add -A
if git diff --cached --quiet; then
  echo "No staged changes; proceeding without new commit."
else
  git commit -m "${COMMIT_MSG}"
fi

# Push branch
git push -u "${REMOTE}" "${BRANCH}"

# Update local main and merge
git switch "${MAIN_BRANCH}"
git fetch "${REMOTE}" "${MAIN_BRANCH}"
git pull --ff-only "${REMOTE}" "${MAIN_BRANCH}"

# Merge feature branch into main (no-ff for preserved history)
git merge --no-ff "${BRANCH}" -m "Merge ${BRANCH} into ${MAIN_BRANCH}"

# Push updated main
git push "${REMOTE}" "${MAIN_BRANCH}"

# Delete branch locally and remotely
git branch -d "${BRANCH}" || true
git push "${REMOTE}" --delete "${BRANCH}" || true

echo "✅ ${BRANCH} merged into ${MAIN_BRANCH} and deleted locally/remotely."
git status -sb
