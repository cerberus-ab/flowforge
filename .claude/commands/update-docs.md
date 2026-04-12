Update the project documentation using the existing README and architecture files as the source material.

Files to update:

- README.md
- docs/ARCHITECTURE.md
- apps/backend/README.md
- apps/extension/README.md

Source of truth:

- Keep all facts aligned with the current codebase and these four docs.
- Preserve the current positioning, scope, and terminology of FlowForge.
- Do not invent features, components, APIs, workflows, or setup steps.

Document roles:

- README.md = landing page + quick start + navigation hub
- docs/ARCHITECTURE.md = high-level system architecture
- apps/backend/README.md = backend component guide
- apps/extension/README.md = extension component guide

Target structure and limits:

README.md

- Slogan at the top: "Forging your experience..."
- Sections:
    - Demo
    - Overview
    - Disclaimer
    - Quick Start (Prerequisites + Run)
    - Usage
    - Roadmap
    - Documentation
    - License
- Target size: 80-100 lines
- Keep it concise, product-oriented, and easy to scan

docs/ARCHITECTURE.md

- Sections:
    - Overview
    - Components
    - Interaction Flow
    - Key Decisions
    - Contracts
    - Constraints
- Target size: 80-100 lines
- Keep only high-level architecture, no deep implementation details

apps/backend/README.md

- Sections:
    - Purpose
    - Responsibilities
    - Run (standalone)
    - Configuration
    - API (short)
    - Key Parts
    - Notes
- Target size: 50-60 lines

apps/extension/README.md

- Sections:
    - Purpose
    - Responsibilities
    - Run (standalone)
    - Load in Chrome
    - Key Parts
    - Notes
- Target size: 50-60 lines

Writing rules:

- Be brief, clear, and consistent
- Avoid repetition across files
- Keep each fact in the most appropriate file only
- Use consistent terminology across all docs
- Prefer short paragraphs and compact bullet lists
- Do not add roadmap/future sections unless already required
- Do not add badges, marketing fluff, or unnecessary emojis

Content boundaries:

- Root README should help a user understand and run the project from the repo root
- App READMEs should help a developer understand and work on that specific component
- ARCHITECTURE should explain how the system fits together, not how every file works

Important:

- Preserve existing correct links between docs
- Keep examples and commands valid
- Keep markdown clean and readable
- If a section exceeds the target scope, trim it instead of expanding other docs

Task:

1. Review the four documentation files
2. Rewrite them to match the structure and size limits above
3. Keep terminology and facts aligned across all four files
4. Output the updated content for all four files
