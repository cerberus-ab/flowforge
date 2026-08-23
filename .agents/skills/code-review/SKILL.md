---
name: code-review
description: Review FlowForge branch changes against master/main, architecture rules, code-style rules, changelog rules, backlog rules, CHANGELOG.md, and BACKLOG.md.
---

# Code Review

Use this skill when reviewing branch changes.

## Required context

- `.agents/rules/architecture.md`
- `.agents/rules/code-style.md`
- `.agents/rules/changelog.md`
- `.agents/rules/backlog.md`
- `CHANGELOG.md`
- `BACKLOG.md`

## Workflow

1. Compare the branch with `master`; use `main` only if `master` is absent.
2. Inspect `git status --short` and the diff from the merge base.
3. Review architecture and code style using the required context.
4. For `packages/page-trail`, check that behavior changes are well covered by tests.
5. For `apps/extension`, check lightweight implementation, component state ownership, async handling, a11y truthfulness, page isolation, and selector safety.
6. Verify behavior or user-visible changes are reflected in `CHANGELOG.md` according to `.agents/rules/changelog.md`.
7. Verify completed work is reflected in `BACKLOG.md` according to `.agents/rules/backlog.md`: if a backlog item was implemented, it should be removed from the backlog.
8. Report findings by severity with file, problem, impact, and suggested fix.
