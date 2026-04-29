## General

- Enhance logging (with pino, LangSmith, opentelemetry)
- Enhance error handling and API validation
- Test coverage (unit/integration, vitest, playwright, promptfoo)
- Create extendable abstraction over extractors, embeddings, tooling

## Backend

### Models

- Support Anthropic, Ollama Cloud providers
- Research WebLLM in browser: instant summary, intent classification, local reranking, etc.
- Try open source models: gpt-oss:120b, nemotron-3-super

### RAG

- Try to use crawl4ai for extracting and fetching data
- Enhance embeddings semantic: intent action, UX, parents graph, etc.
- Enhance reranking based on contextual relevance
- Add cache (node-cache/Redis) before index and search calls
- Enhance Vector Storage, re-fresh and metadata control
- Consider using PostgreSQL pgvector instead of LanceDB
- Add knowledge about web standards (ARIA)

### Reasoning

- Use user context and navigation history for prompting
- Present a page/website UI and meanings graph for reasoning

### Tools

- Improve find_workflow tool by building the graph of steps
- Add FormExtractor tool for workflows
- Add Statistics tool: how many elements on the page, etc.
- Answer the question: How does the product work? What alternatives do I have? What is the next step?
- Fetch data from links to provide website context

### Tech Improvements

- Consider using Vercel AI SDK, OpenRouter
- Use pnpm for package management instead of npm
- Add metrics: tokens usage, latency, errors, etc.
- Refactor the Server, consider using Fastify instead of Express

### Analytics

- Save steps for workflows for more details
- Persistence layer for Analytics (start from Postgres)
- Provide an LLM-based summary over domain

## Extension

- Support standalone mode, properly
- Cache for pageModel transfer, with RAG cache

## DX

- Dev/Prod mode
- Update backend/quick-setup.js
- Generate CHANGELOG.md
