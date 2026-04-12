## General

- Support Anthropic, Ollama Cloud providers
- Try open source models: gpt-oss:120b, nemotron-3-super
- Enhance logging (with pino, LangSmith, opentelemetry)
- Enhance error handling and API validation
- Test coverage (unit/integration, vitest, playwright, promptfoo)
- Create extendable abstraction over extractors, embeddings, tooling

## Backend

### RAG

- Enhance Embeddings semantic: templates instead of '. '
- Add cache (node-cache/Redis) before index and search calls
- Enhance Vector Storage, re-fresh and metadata control
- Add knowledge about web standards (ARIA)
- Research embeddings-based splitting

### Reasoning

- Use user context and navigation history for prompting

### Tools

- Add UI graph presentation and tooling
- Add FormExtractor tool for workflows
- Add Statistics tool: how many elements on the page, etc.
- Fetch data from links to provide website context

### Tech Improvements

- Consider using Vercel AI SDK
- Use pnpm for package management instead of npm
- Add metrics: tokens usage, latency, errors, etc.
- Refactor the Server, consider using Fastify instead of Express

### Analytics

- Save steps for workflows for more details
- Persistence layer for Analytics (start from Postgres)
- Provide an LLM-based summary over domain

## Extension

- Support standalone mode
- Cache for pageData transfer, with RAG cache
- CSS modules ?

## DX

- Dev/Prod mode
- Update backend/quick-setup.js
- Generate CHANGELOG.md

## Landing

- Create a landing page for the project
- Add Demo with standalone extension
