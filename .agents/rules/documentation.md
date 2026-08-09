# Documentation Rules

Use these rules when creating or updating project documentation.

## Goal

Update documentation based strictly on the current codebase and existing docs.

Rewrite and align documentation. Do not invent or expand it beyond the
implemented project.

## Sources of truth

1. Codebase
2. Existing documentation

If something is unclear or missing, omit it.

## Files to update

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DOM-TO-RAG-PIPELINE.md`
- `packages/page-model/README.md`
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
- `packages/page-model/README.md` — canonical DOM representation (`PageModel`).
- `apps/backend/README.md` — backend responsibilities and usage.
- `apps/extension/README.md` — extension responsibilities and usage.

## Target structure

### `README.md`

Target length: 100–120 lines.

- "Forging your experience..."
- Demo
- Overview
- Use Cases
- Disclaimer
- Quick Start
- Usage
- Security
- Roadmap
- Documentation
- License

### `docs/ARCHITECTURE.md`

Target length: 80–100 lines.

- Overview
- Components
- Interaction Flow
- Pipeline (high-level)
- Key Decisions
- Contracts
- Constraints

### `docs/DOM-TO-RAG-PIPELINE.md`

Target length: 80–100 lines.

- Overview
- Stages:
  - Extraction to Structure Representation
  - Transforming to Semantic Representation
  - Indexing / Retrieval
  - Reranking
  - Resolution to Tool Results

### `packages/page-model/README.md`

Target length: 60–80 lines.

- Overview
- Structure
- Content elements
- Interactive elements
- Context
- Importance
- Format
- Usage

### `apps/backend/README.md`

Target length: 50–60 lines.

- Purpose
- Responsibilities
- Run
- Configuration
- API (short)
- Key Parts
- Notes

### `apps/extension/README.md`

Target length: 50–60 lines.

- Purpose
- Responsibilities
- Run
- Load in Chrome
- Key Parts
- Notes
