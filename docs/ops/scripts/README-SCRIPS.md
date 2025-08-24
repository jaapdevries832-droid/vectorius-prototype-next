# Git workflow automation scripts

This folder contains Bash scripts designed to standardize and simplify your day‑to‑day Git operations.  They were written to avoid repetitive, error‑prone commands and to keep your local and remote branches in sync.  All scripts assume that:

* You have `git` installed and available in your `PATH`.
* You run the scripts from the root of the repository.
* Your remote is named `origin` and you have permission to push to it.

> **Tip:** don’t forget to make the scripts executable.  If you cloned the repo on a new machine run `chmod +x ops/scripts/*.sh`.

## `sync‑branch.sh`

Creates a local branch that mirrors an existing remote branch.  Use this at the beginning of each feature to ensure you start from a clean, exact copy of the remote branch.

### What it does

1. Fetches the named branch from the remote repository (`git fetch origin <branch>`).
2. Checks out the branch locally, creating it if necessary (`git switch -C <branch>`).
3. Hard resets the local branch to match the remote (`git reset --hard origin/<branch>`), discarding any uncommitted changes.

### Usage

```bash
./ops/scripts/sync-branch.sh <branch-name>
```

For example, to start working on `Lesson-9`:

```bash
./ops/scripts/sync-branch.sh Lesson-9
```

### Troubleshooting

* **“fatal: couldn’t find remote ref”** – the branch name is wrong or hasn’t been pushed yet.  Push it first or choose an existing branch.
* **Uncommitted changes are lost** – the script performs a hard reset.  Make sure you have no local changes in the branch before running it.
* **Different remote name** – if your remote isn’t called `origin`, edit the script or set `REMOTE_NAME` at the top to your remote’s name.

## `finish‑branch.sh`

Finalizes your work and merges your feature branch back into `main`.  It stages everything, commits with a default or custom message, pushes your branch, merges it with a non‑fast‑forward merge and removes the branch locally and remotely.

### What it does

1. Checks out your feature branch (`git switch <branch>`).
2. Adds all changes (`git add -A`).
3. Commits with a provided message or falls back to `data-vectorius-commit` if none is supplied (`git commit -m "$message"`).
4. Pushes the branch to the remote (`git push -u origin <branch>`).
5. Switches to `main` and pulls the latest (`git switch main && git pull`).
6. Merges the feature branch into `main` with a no fast forward merge (`git merge --no-ff <branch>`).
7. Pushes the updated `main` (`git push`).
8. Deletes the feature branch locally (`git branch -d <branch>`) and remotely (`git push origin --delete <branch>`).

### Usage

```bash
./ops/scripts/finish-branch.sh <branch-name> "<commit message>"
```

* The `commit message` is optional.  If omitted the default `data-vectorius-commit` is used.
* Always wrap your commit message in quotes if it contains spaces.

Example:

```bash
./ops/scripts/finish-branch.sh Lesson-9 "feat: add dashboards and cleanup"
```

### Troubleshooting

* **Branch does not exist** – make sure you have a local branch checked out and that you spelled it correctly.
* **Merge conflicts** – resolve any conflicts manually, run the script again from the “stage & commit” step, or complete the merge yourself if necessary.
* **Remote deletion fails** – ensure you have permission to delete branches on the remote.  You can manually delete the branch in your Git hosting UI as a fallback.

## Additional notes

* The scripts assume a simple Git model with a single long‑lived `main` branch and short‑lived feature branches.  Adjust the scripts if your workflow differs.
* Always pull the latest `main` and run your test suite before finishing a branch to avoid breaking the build.
* If you modify these scripts, update this README to reflect the new behaviour so that future contributors know what to expect.
