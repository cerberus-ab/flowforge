---
name: next-feature
description: Recommend the next FlowForge features or critical technical work from documentation, CHANGELOG.md, and BACKLOG.md.
---

# Next Feature

Use this skill when selecting the next FlowForge work item to implement.

## Required context

- `.agents/rules/documentation.md`
- `.agents/rules/backlog.md`
- `CHANGELOG.md`
- `BACKLOG.md`

## Workflow

1. Read the required context and inspect any directly relevant docs needed to understand current project status.
2. Identify candidate features, including explicit backlog items and inferred opportunities supported by the current documentation.
3. Include serious technical problems as candidates when they materially block product progress or reliability.
4. Prioritize candidates together by criticality and implementation size; prefer work that is both important and small.
5. Do not edit files or implement anything.
6. Return the top 3 candidates only.

## Output

For each candidate, include:

- Name
- Why now
- Complexity: low, medium, or high
- Criticality: low, medium, or high
- Risks
- Very short implementation plan
