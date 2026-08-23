# Backlog Rules

Use these rules when creating, updating, or reviewing `BACKLOG.md`.

## Goal

Keep `BACKLOG.md` as a concise, structured list of planned research and
implementation work.

## Source of truth

Use the current codebase, existing documentation, and explicit product decisions
as the source of truth. Do not add work items that are not supported by the
project direction or repository context.

## Format

- Keep the top-level title as `# Backlog`.
- Keep exactly two top-level sections: `## Research` and `## Implementation`.
- Use `## Research` for investigation, evaluation, comparison, and technical discovery.
- Use `## Implementation` for planned product, architecture, tooling, and operational work.
- Under `## Implementation`, keep exactly these third-level sections in this order:
    - `### Page Trail`
    - `### Extension`
    - `### Backend`
    - `### DX`
- Use third-level sections under `## Research` only when they group related research items.
- Write backlog items as Markdown bullet points.
- Keep each item short, actionable, and scoped to one idea.
- Use code formatting for package names, file names, tool names, and API identifiers.

## Rules

- Keep `BACKLOG.md` in the repository root.
- Do not duplicate `CHANGELOG.md`, release notes, commit history, or pull request descriptions.
- Do not record completed work; remove a backlog item when the work is implemented.
- Do not invent features, APIs, or architecture that are not supported by the codebase or explicit project direction.
- Preserve existing items unless they are completed, duplicated, stale, or need to move to the correct section.
- Keep links valid and relative to the repository root.
