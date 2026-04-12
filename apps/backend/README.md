# Backend

## Purpose

AI agent backend that processes user queries, understands page context, and generates actionable UI guidance using a RAG pipeline.

## Responsibilities

- Run AI agent with ReAct pattern (LangGraph)
- Process user queries and page data
- Perform semantic search over indexed content
- Manage vector storage and embeddings (LanceDB)
- Expose HTTP API for extension

## Run (standalone)

```bash
npm i
cp .env.example .env
npm run build
npm start
```

Development mode with auto-reload:

```bash
npm run dev
```

Server runs on http://localhost:3477

## Configuration

Configured via `.env` file:

- `LLM_PROVIDER` — `ollama-local` or `openai`
- `OLLAMA_LOCAL_MODEL` / `OPENAI_MODEL` — model names
- `INDEXER_CHUNK_SIZE` — document chunk size for RAG
- `AGENT_TOOL_CALL_LIMIT` — max tool calls per query

See [.env.example](.env.example) for all options.

## API

- `POST /query` — main agent entry point (question + page data)
- `POST /search` — semantic search over indexed content
- `GET /analytics` — usage data and query tracking
- `GET /health` — service status

## Key Parts

- `agent/` — ReAct agent implementation and tool definitions
- `indexer/` — RAG pipeline, embeddings, and vector search
- `analytics/` — query tracking and usage metrics

## Notes

- One-page context only (no cross-page memory)
- In-memory analytics (resets on restart)
- Requires running LLM provider (Ollama or OpenAI API key)
- See [Architecture](../../docs/ARCHITECTURE.md) for system design
