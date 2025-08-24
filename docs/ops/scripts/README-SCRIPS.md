# Git Branch Management Scripts

This repo provides helper scripts to simplify working with Git branches.  
They automate common workflows so you can keep local and remote branches in sync, push changes safely, or finish and merge feature branches cleanly.

---

## Scripts

### 1. `ops/scripts/push-branch.sh`

Use when you want your **local branch to become the source of truth**.  
This is a **local-wins** strategy: your local commits are pushed up to the remote.

**What it does:**
- Verifies you are in a Git repo.  
- Switches to the target branch.  
- Stages all local changes.  
- Commits them (defaults to a date-based commit message if none is provided).  
  - Format: `YYYY-MM-DD-vectorius-commit`  
  - Example: `2025-08-22-vectorius-commit`  
- Pushes the local branch to the remote so both are identical.  
- Leaves the branch alive for continued work.  

**Usage:**
```bash 

# Push branch "Lesson-8" with default date-based commit message
ops/scripts/push-branch.sh Lesson-8

# Push branch "Lesson-8" with a custom commit message
ops/scripts/push-branch.sh Lesson-8 "Added new roster + AI mock"

# Push branch "Lesson-8" to a different remote
ops/scripts/push-branch.sh Lesson-8 "" upstream

```

### 2. `ops/scripts/finish-branch.sh`

Use when you are **done with a feature branch** and want to merge it into `main`.  
This is a **complete lifecycle strategy**: commit → push → merge → cleanup.

**What it does:**
- Verifies you are in a Git repo.  
- Switches to the feature branch.  
- Stages and commits changes (defaults to a date-based commit message if none is provided).  
  - Format: `YYYY-MM-DD-vectorius-commit`  
- Pushes the feature branch to the remote.  
- Switches to `main` (or `master` if overridden).  
- Updates local `main` from the remote.  
- Merges the feature branch into `main` using `--no-ff`.  
- Pushes updated `main` to the remote.  
- Deletes the feature branch both locally and remotely.  

**Usage:**
```bash
# Finish branch "lesson-9" with default date-based commit message
ops/scripts/finish-branch.sh lesson-9

# Finish branch "lesson-9" with a custom message
ops/scripts/finish-branch.sh lesson-9 "Added roster selector + AI mock"

# Finish branch "lesson-9" using a different remote
ops/scripts/finish-branch.sh lesson-9 "" upstream
```

### 3. `ops/scripts/create-mirror-branch.sh`

Use when you want to **create a local branch from a remote branch, mirror it exactly, and switch to it**.  
This is useful for starting work on an existing feature branch that only exists remotely.

**What it does:**
- Verifies you are in a Git repo.  
- Fetches the branch from the remote.  
- Verifies that the remote branch exists.  
- Creates a local branch with the same name, tracking the remote.  
- Hard-resets the local branch so it exactly mirrors the remote.  
- Switches you to that branch.  

**Usage:**
```bash
# Create and mirror branch "Lesson-9" from origin
ops/scripts/create-mirror-branch.sh Lesson-9

# Create and mirror branch "Lesson-9" from another remote
ops/scripts/create-mirror-branch.sh Lesson-9 upstream
```

MAIN_BRANCH=master ops/scripts/finish-branch.sh lesson-