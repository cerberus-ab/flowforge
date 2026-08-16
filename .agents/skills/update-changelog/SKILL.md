---
name: update-changelog
description: Update FlowForge CHANGELOG.md from changes since the latest release tag using changelog rules.
---

# Update Changelog

Use this skill when updating `CHANGELOG.md` from changes since the latest release tag.

## Required context

- `.agents/rules/changelog.md`
- `CHANGELOG.md`

## Workflow

1. Find the latest release tag using version tags such as `vX.Y.Z`; do not use `master` or `main` as the comparison baseline.
2. Inspect `git status --short` and the diff from the latest release tag.
3. Read `.agents/rules/changelog.md` and follow it strictly.
4. Inspect existing `CHANGELOG.md` format and target section.
5. Add only notable changes present in the branch diff.
6. Do not add low-level implementation noise, duplicate existing entries, or invent versions/dates.
7. If the target release section is unclear, ask before editing.
8. Report the section changed and a short summary of entries added or omitted.
