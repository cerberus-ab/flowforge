# Changelog

All notable changes to the project will be documented in this file.

## [Unreleased]

### Added

- Added the `suggest_actions` tool to suggest top available actions on the page.
- Added extension test coverage with unit tests, e2e tests, sandbox pages, and CI jobs.
- Added pre-commit hook, next-feature SKILL.

## [0.2.0] - 2026-08-23

### Added

- PageTrail `container` elements and `structure` tree for representing page context and layout.
- Detailed `context.path` data for content and interactive elements, including container relevance and breadcrumb context.
- Dev mode for Page Inspector with enriched PageTrail records and metadata diagnostics.
- Tooltips across popup and Inspector controls, replacing native `title` hints.

### Changed

- Reworked PageTrail scoring and semantic formatting around meaning, context relevance, and target importance.
- Updated backend tools to use detailed PageTrail `context.path` when describing matched elements and content.
- Expanded PageTrail metadata timings with per-stage collection durations.
- Improved Markdown output for the Inspector semantic view.
- Limited extracted label and text values to keep PageTrail records concise.

## [0.1.5] - 2026-08-16

### Added

- Page Inspector for viewing PageTrail `basics`, `content`, `interactive` elements, `metadata`, and semantic Markdown output.
- PageTrail snapshot `metadata` with collection counts, limits, timestamps, and duration.
- CI workflow for linting, type checks, builds, and PageTrail unit tests.
- Project context for agents, including shared rules, skills, and navigation guidance.
- Added initial `settings` and `openPageInspector` support for embed delivery via Runtime API.

### Changed

- Renamed PageModel to PageTrail across the project.
- Improved PageTrail data collection performance and semantic formatting.

## [0.1.4] - 2026-05-03

### Added

- Early build for embed integration, used for Demo.
- Landing and live Demo at [useflowforge.app](https://useflowforge.app/).
- Added a sandbox for extension testing.

### Changed

- Improved semantics and A11y for extension components.
- Moved PageModel to a separated package; supported more ARIA roles.

## [0.1.3] - 2026-04-20

### Added

- Dark theme for the extension.
- Token usage display in results.
- Use `Bbox` for importance scoring on extraction.
- Use `inViewport` and `aboveTheFold` for semantic formatting.

### Changed

- Improved `getPageSummary` tool with element importance scoring.
- Improved semantic formatting for indexable documents.
- Refactored UI components and design tokens.
- Refactored and documented DOM-to-RAG pipeline.

## [0.1.2] - 2026-04-12

### Added

- Initial FlowForge MVP release.
