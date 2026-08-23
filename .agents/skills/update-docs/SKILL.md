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

1. Identify the requested documentation scope and target files.
2. Read the documentation and architecture rules.
3. Inspect the relevant existing docs to understand current terminology and structure.
4. Inspect the relevant code before changing any factual claims.
5. Identify stale, duplicated, inconsistent, or unsupported documentation.
6. Update only claims supported by the codebase and existing documentation.
7. Keep document roles, target structures, links, and commands aligned with the documentation rules.
8. Run relevant formatting or validation checks if available.
9. Report changed files, validation results, and any omitted claims that lacked source support.
