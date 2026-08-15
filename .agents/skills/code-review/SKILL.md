---
name: code-review
description: Review FlowForge branch changes against master/main, architecture rules, code-style rules, and CHANGELOG.md.
---

# Code Review

Use this skill when reviewing branch changes.

## Required context

- `.agents/rules/architecture.md`
- `.agents/rules/code-style.md`
- `CHANGELOG.md`

## Workflow

1. Compare the branch with `master`; use `main` only if `master` is absent.
2. Inspect `git status --short` and the diff from the merge base.
3. Review architecture and code style using the required context.
4. For `packages/page-trail`, check that behavior changes are well covered by tests.
5. For `apps/extension`, check lightweight implementation, component state ownership, async handling, a11y truthfulness, page isolation, and selector safety.
6. Verify behavior or user-visible changes are reflected in `CHANGELOG.md`.
7. Report findings by severity with file, problem, impact, and suggested fix.
