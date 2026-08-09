---
name: update-docs
description: Update project documentation based strictly on the current codebase and existing docs.
---

# Update Docs

Use this skill when updating project documentation.

## Required context

- `.agents/rules/documentation.md`
- `.agents/rules/architecture.md`

## Workflow

1. Review the documentation targets.
2. Inspect the relevant code before changing docs.
3. Identify stale, duplicated, or unsupported claims.
4. Update docs according to the documentation rules.
5. Run relevant formatting or validation checks if available.
