# Documentation Rules

Use these rules as the documentation source of truth.

## Goal

Keep project documentation accurate, concise, aligned, and limited to the
implemented codebase.

## Sources of truth

1. Codebase
2. Existing documentation

If something is unclear or missing, omit it.

## Documentation set

- `README.md`
- `docs/architecture.md`
- `docs/dom-to-rag-pipeline.md`
- `packages/page-trail/README.md`
- `packages/page-trail/docs/scoring.md`
- `apps/backend/README.md`
- `apps/extension/README.md`

## Rules

- Do not invent features, APIs, workflows, or architecture.
- Keep terminology consistent across all docs.
- Align all documents with each other and the codebase.
- Avoid duplication between files.
- Be concise, clear, and structured.
- Keep links valid.
- Keep commands correct.
- Keep Markdown clean.
- Avoid hardcoding numeric constant values from code. Prefer CAPS-style names
  close to the code symbol, or omit the value when it is not needed.
- Do not edit diagram source or exported diagram assets during documentation
  updates unless explicitly requested. Report diagram inconsistencies instead.
- If content exceeds scope, trim it instead of expanding other docs.

## Document roles

- `README.md` — entry point: what it is and how to run it.
- `docs/architecture.md` — high-level system overview.
- `docs/dom-to-rag-pipeline.md` — DOM-to-RAG pipeline description.
- `packages/page-trail/README.md` — canonical DOM representation (`PageTrail`).
- `packages/page-trail/docs/scoring.md` — PageTrail scoring flow and formulas.
- `apps/backend/README.md` — backend responsibilities and usage.
- `apps/extension/README.md` — extension responsibilities and usage.

## Target structure

### `README.md`

Target length: 100–120 lines.

- "Forging your experience..."
- Demo
- Overview
- Use cases
- Disclaimer
- Quick start
- Usage
- Security
- Roadmap
- Documentation
- License

### `docs/architecture.md`

Target length: 80–100 lines.

- Overview
- Components
- Interaction flow
- Pipeline (high-level)
- Key decisions
- Contracts
- Constraints

### `docs/dom-to-rag-pipeline.md`

Target length: 80–100 lines.

- Link to `packages/page-trail/README.md` for more information about the canonical DOM snapshot format.
- Overview
- Stages:
    - Extraction to structure representation
    - Transforming to semantic representation
    - Indexing / retrieval
    - Reranking
    - Resolution to tool results

### `packages/page-trail/README.md`

Target length: 80–100 lines.

- Overview
- Format (`PageTrail` object shape only)
- Structure elements
- Content elements
- Interactive elements
- Context
- Scoring summary with a link to `docs/scoring.md`
- Format
- Usage

### `packages/page-trail/docs/scoring.md`

Target length: 70–90 lines.

- Overview
- Scoring diagram
- Inputs
- Meaning
- Context
- Importance

### `apps/backend/README.md`

Target length: 50–60 lines.

- Purpose
- Responsibilities
- Run
- Configuration
- API (short)
- Key parts
- Notes

### `apps/extension/README.md`

Target length: 50–60 lines.

- Purpose
- Responsibilities
- Run
- Load in Chrome
- Key parts
- Notes
