---
name: prepare-release
description: Prepare FlowForge for a major, minor, or patch release by aligning workspace versions, release notes, and the project README.
---

# Prepare Release

Use this skill when preparing a FlowForge release. It prepares repository files; it does not publish a release.

## Required context

- `.agents/rules/changelog.md`
- `.agents/rules/documentation.md`
- `.agents/skills/update-changelog/SKILL.md`
- `CHANGELOG.md`, `README.md`, workspace manifests, and `package-lock.json`
- Release and pull request workflows; latest `vX.Y.Z` tag

## Workflow

1. Ask whether this is a **major**, **minor**, or **patch** release before editing. Inspect the latest release tag, changes since it, and worktree; exclude unrelated changes.
2. Bump `apps/backend` and `apps/extension` to the selected SemVer version: major resets minor and patch; minor resets patch; patch increments patch. Sync `package-lock.json`. If current versions differ, ask which is the baseline.
3. Review `packages/page-trail` changes. If public API, data shape, or behavior changed substantially, recommend a version bump and ask before applying it.
4. Prepare a dated release section in `CHANGELOG.md` from notable changes since the tag; leave a fresh `Unreleased` section. Update `README.md` only where release changes make it inaccurate or incomplete. Follow the referenced rules and changelog skill.
5. Run formatting, lint, CI checks, and release builds. Verify package and lockfile versions. Report versions, documentation changes, and check results. Do not tag, commit, or publish unless asked.
