## General

- Enhance logging (with pino, LangSmith, opentelemetry)
- Enhance error handling and API validation
- Improve error handling for element lookup, backend availability, and unavailable page runtime
- Test coverage (unit/integration, vitest, playwright, promptfoo)
- Create extendable abstraction over extractors, selectors, embeddings, tooling

## Page Trail

- Cache for the collector heavy computes
- Parse structured data (Schema.org, og, x-card, etc.) for basics info
- Enhance dataId and CSS selector usage for Element locator

## Backend

### Models

- Support Anthropic, Ollama Cloud providers
- Research OpenRouter, Lighter LM, and Cerebras.ai for LLM routing and low-latency inference
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

- Research OpenAI Agents SDK and Agna framework for agent orchestration
- Move from intent-routed tools to reasoning primitives for retrieval, ranking, target resolution, and workflow synthesis
- Use user context and navigation history for prompting
- Present a page/website UI and meanings graph for reasoning

### Tools

- Improve find_workflow tool by building the graph of steps
- Add FormExtractor tool for workflows
- Add Statistics tool: how many elements on the page, etc.
- Answer the question: How does the product work? What alternatives do I have? What is the next step?
- Fetch data from links to provide website context

### Tech improvements

- Consider using Vercel AI SDK, OpenRouter
- Use pnpm for package management instead of npm
- Add metrics: tokens usage, latency, errors, etc.
- Refactor the Server, consider using Fastify instead of Express

### Browser automation

- Research Stagehand for browser action planning and execution

### Analytics

- Save steps for workflows for more details
- Persistence layer for Analytics (start from Postgres)
- Provide an LLM-based summary over domain

## Extension

- Support service pages where browser APIs allow content scripts or fallback flows
- Restore popup/page UI state when reopening the extension
- Style the wizard to better fit the host website
- Consider to separate Inspector

### Page inspector

- Loading state
- Lazy rendering in JsonViewer
- Provide the history data about the page usage

## DX

- Dev/Prod mode
- Add an agent run inspector for tool calls, intermediate reasoning state, retrieved context, and final output
- Publish PageTrail as a standalone package
- Update backend/quick-setup.js
- Generate CHANGELOG.md
