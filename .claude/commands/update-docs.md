You are updating project documentation based strictly on the current codebase and existing docs.

Your goal is to rewrite and align documentation — not to invent or expand it.

---

SOURCE OF TRUTH

- Codebase (primary)
- Existing documentation (secondary)

If something is unclear or missing — omit it. Do NOT assume.

---

FILES TO UPDATE

- README.md
- docs/ARCHITECTURE.md
- docs/DOM-TO-RAG-PIPELINE.md
- packages/page-model/README.md
- apps/backend/README.md
- apps/extension/README.md

---

RULES

- Do not invent features, APIs, or workflows
- Keep terminology consistent across all docs
- Align all documents with each other and the codebase
- Avoid duplication between files
- Be concise, clear, and structured

---

DOCUMENT ROLES

- README.md → entry point (what it is, how to run)
- ARCHITECTURE.md → high-level system overview
- DOM-TO-RAG-PIPELINE.md → pipeline description
- page-model README → canonical DOM representation (PageModel)
- backend README → backend responsibilities and usage
- extension README → extension responsibilities and usage

---

TARGET STRUCTURE

README.md (100–120 lines)

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

---

docs/ARCHITECTURE.md (80–100 lines)

- Overview
- Components
- Interaction Flow
- Pipeline (high-level)
- Key Decisions
- Contracts
- Constraints

---

docs/DOM-TO-RAG-PIPELINE.md (80–100 lines)

- Overview
- Stages:
  - Extraction to Structure Representation
  - Transforming to Semantic Representation
  - Indexing / Retrieval
  - Reranking
  - Resolution to Tool Results

---

packages/page-model/README.md (60–80 lines)

- Overview
- Structure
- Content elements
- Interactive elements
- Context
- Importance
- Format
- Usage

---

apps/backend/README.md (50–60 lines)

- Purpose
- Responsibilities
- Run
- Configuration
- API (short)
- Key Parts
- Notes

---

apps/extension/README.md (50–60 lines)

- Purpose
- Responsibilities
- Run
- Load in Chrome
- Key Parts
- Notes

---

IMPORTANT

- Keep links valid
- Keep commands correct
- Keep markdown clean
- If content exceeds scope → trim, don’t expand other docs

---

TASK

1. Review all files
2. Rewrite to match structure and size limits
3. Align terminology across all docs
4. Remove duplication
5. Output updated content for all files
