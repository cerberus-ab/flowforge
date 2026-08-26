# Backlog

## Research

### Models and providers

- Research OpenRouter, Lighter LM, and Cerebras.ai for LLM routing and low-latency inference.
- Research WebLLM in browser for instant summary, intent classification, local reranking, and related tasks.
- Try open source models such as gpt-oss:120b and nemotron-3-super.

### Agent orchestration and reasoning

- Research OpenAI Agents SDK and Agna framework for agent orchestration.
- Move from intent-routed tools to reasoning primitives for retrieval, ranking, target resolution, and workflow synthesis.
- Present a page or website UI and meanings graph for reasoning.

### Extraction, storage, and automation

- Try crawl4ai for extracting and fetching data.
- Consider using PostgreSQL pgvector instead of LanceDB.
- Research Stagehand for browser action planning and execution.
- Consider using Vercel AI SDK and OpenRouter.

## Implementation

### Page Trail

- Cache heavy collector computations.
- Parse structured data such as Schema.org, Open Graph, and X Card for basic page information.
- Enhance `dataId` and CSS selector usage for element location.
- Create extendable abstractions over extractors, selectors, embeddings, and tooling.

### Extension

- Improve error handling for element lookup, backend availability, and unavailable page runtime.
- Support service pages where browser APIs allow content scripts or fallback flows.
- Restore popup and page UI state when reopening the extension.
- Style the wizard to better fit the host website.
- Consider separating the Inspector.
- Add page inspector loading state.
- Add lazy rendering in `JsonViewer`.
- Provide history data about page usage.

### Backend

- Enhance logging with pino, LangSmith, or OpenTelemetry.
- Enhance error handling and API validation.
- Support Anthropic and Ollama Cloud providers.
- Enhance embedding semantics for intent action, UX, parent graph, and related context.
- Enhance reranking based on contextual relevance.
- Add cache before index and search calls, using node-cache or Redis.
- Enhance vector storage refresh and metadata control.
- Add knowledge about web standards such as ARIA.
- Use user context and navigation history for prompting.
- Improve the `find_workflow` tool by building a graph of steps.
- Add a `FormExtractor` tool for workflows.
- Add a statistics tool for page element counts and related page data.
- Answer product, alternative, and next-step questions from available page context.
- Fetch data from links to provide website context.
- Add metrics for token usage, latency, errors, and related runtime data.
- Refactor the server and consider Fastify instead of Express.
- Save workflow steps with more details.
- Add a persistence layer for analytics, starting from Postgres.
- Provide an LLM-based summary over a domain.

### DX

- Improve test coverage with unit, integration, Vitest, Playwright, and promptfoo tests.
- Add development and production modes.
- Use pnpm for package management instead of npm.
- Add an agent run inspector for tool calls, intermediate reasoning state, retrieved context, and final output.
- Publish PageTrail as a standalone package.
- Update `backend/quick-setup.js`.
