# Changelog Rules

Use these rules when creating, updating, or reviewing `CHANGELOG.md`.

## Goal

Keep `CHANGELOG.md` as a concise record of notable project changes.

## Source of truth

Use the current repository diff and existing `CHANGELOG.md` format as the source
of truth. Do not add entries for work that is not present in the codebase.

## Format

- Keep the top-level title as `# Changelog`.
- Keep the introductory sentence below the title.
- Put unreleased branch changes under `## [Unreleased]`.
- Group released changes by version using `## [x.y.z] - YYYY-MM-DD`.
- Keep `## [Unreleased]` above released versions; keep released versions in reverse chronological order.
- Group entries under `### Added`, `### Changed`, `### Fixed`, `### Removed`, or another Keep a Changelog-style category only when it is needed.
- Write entries as Markdown bullet points.
- Keep each entry short, user-visible, and specific.
- Use links only when they add useful context, such as a public demo URL.

## Rules

- Record notable user-visible, behavior, documentation, packaging, or architecture changes.
- Do not include low-level implementation noise unless it changes behavior, public contracts, or project usage.
- Do not duplicate the backlog, commit history, or pull request description.
- Do not invent release dates or versions. If `## [Unreleased]` is absent, create it above the latest released version and add branch changes there.
- Preserve existing wording and categories unless the current change requires a precise update.
