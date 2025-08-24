# Vectorius Git Workflow Scripts

Small, battle-tested helpers to keep your **feature branches** in sync with GitHub and finish them cleanly into `main`.

> Folder: `ops/scripts/`  
> Primary audience: you (local dev in VS Code) + anyone helping on PRs (including ChatGPT)  
> Safe defaults: conservative, fail early on dirty trees, no mysterious merges

---

## Prerequisites

- Git installed and configured (`git --version`)
- You’re inside this repo (`git rev-parse --is-inside-work-tree`)
- Remote named `origin` points to GitHub (`git remote -v`)
- **Clean working tree** before syncing/finishing (commit or stash first)

---

## Quick Start

```bash
# from repo root
chmod +x ops/scripts/*.sh

# 1) Mirror a remote branch locally and switch to it
./ops/scripts/sync-branch.sh Lesson-9

# 2) Do your work in VS Code, commit as you go, then finish the branch
./ops/scripts/finish-branch.sh Lesson-9 "parent page parity + AI mock"
# commit message is optional; defaults to "data-vectorius-commit"