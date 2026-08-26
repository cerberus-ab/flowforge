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
- `docs/ARCHITECTURE.md`
- `docs/DOM-TO-RAG-PIPELINE.md`
- `packages/page-trail/README.md`
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
- If content exceeds scope, trim it instead of expanding other docs.

## Document roles

- `README.md` — entry point: what it is and how to run it.
- `docs/ARCHITECTURE.md` — high-level system overview.
- `docs/DOM-TO-RAG-PIPELINE.md` — DOM-to-RAG pipeline description.
- `packages/page-trail/README.md` — canonical DOM representation (`PageTrail`).
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

### `docs/ARCHITECTURE.md`

Target length: 80–100 lines.

- Overview
- Components
- Interaction flow
- Pipeline (high-level)
- Key decisions
- Contracts
- Constraints

### `docs/DOM-TO-RAG-PIPELINE.md`

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
- Scoring (`meaningScore`, `relevanceScore`, `contextScore`, `importanceScore`)
- Format
- Usage

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
