---
name: update-deps
description: Update npm dependencies across FlowForge workspaces, resolve compatibility issues, and verify tests and builds.
---

# Update Dependencies

Use this skill when updating dependencies in the FlowForge npm workspace.

## Required context

- `.agents/rules/agents.md`
- `.agents/rules/code-style.md`
- `.agents/rules/changelog.md`
- `.agents/rules/tests.md`
- `.github/workflows/ci.yml`
- `CHANGELOG.md`
- Root and workspace `package.json` files

## Workflow

1. Inspect `git status --short`, the root lockfile, workspace manifests, and CI checks. Preserve unrelated user changes and establish whether the existing branch already has failing checks.
2. Use `npm-check-updates` with its workspace option to update every workspace and the root manifest. Its default target includes major releases; retain that behavior unless the user sets a narrower range. Run `npm install` once to update `package-lock.json`.
3. Review manifest and lockfile changes for removed, renamed, duplicated, or incompatible packages. Keep internal `@flowforge/*` workspace dependencies aligned with the local packages.
4. Run the relevant CI checks from `.github/workflows/ci.yml`, including formatting, lint, type checks, tests, builds, and extension e2e tests when the browser setup is available.
5. If a check fails, identify whether the failure is caused by an update or was already present. Fix compatibility issues in the affected code and rerun the failed checks plus any related checks.
6. If a required migration cannot be completed safely or needs a product decision, leave the failure intact and report the package, failing check, cause, and a concrete recommended fix. Do not hide failures by weakening tests or suppressing errors.
7. After applying package updates, add one concise `Changed` entry under `## [Unreleased]` in `CHANGELOG.md` describing the dependency updates. Do not claim unresolved upgrades are complete or invent package changes; if nothing was updated, add no entry.
8. Report notable major upgrades, files changed, checks passed or blocked, and any remaining migration work.
