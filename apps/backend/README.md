# Backend

## Purpose

AI agent backend that processes user queries, understands page context, and generates actionable UI guidance using a RAG pipeline.

## Responsibilities

- Run AI agent with ReAct pattern (LangGraph)
- Process user queries and page data
- Perform semantic search over indexed content
- Manage embeddings and LanceDB vector storage
- Expose HTTP API for extension
- Track in-memory query analytics

## Run

```bash
npm i
cp .env.example .env
npm run build
npm start
npm run dev
```

For watch mode, run `npm run dev -w @flowforge/backend` in another terminal.

## Configuration

Configured via `.env` file:

- `PORT`, `LOG_LEVEL`
- `LLM_PROVIDER` — `ollama-local` or `openai`
- `OLLAMA_LOCAL_MODEL`, `OPENAI_MODEL`
- `OLLAMA_LOCAL_EMBEDDING`, `OPENAI_EMBEDDING`
- `INDEXER_CHUNK_SIZE`, `INDEXER_CHUNK_OVERLAP_RATIO` — RAG chunking
- `AGENT_TOOL_CALL_LIMIT`, `AGENT_RECURSION_LIMIT`, `AGENT_TEMPERATURE`, `AGENT_MAX_TOKENS` — agent runtime

See [.env.example](.env.example) for all options.

## API

- `POST /query` — main agent entry point (`question`, `pageTrail`, `domain`)
- `POST /search` — semantic search over an indexed `pageUrl`
- `GET /health` — service status
- `GET /analytics` — in-memory query analytics

`/query` returns `{ result, metadata }`. `result` contains answer, mode, optional topic, and matched elements; `metadata` contains model, token usage, and execution time.

## Notes

- Single-page context; no cross-page memory
- In-memory analytics; resets on restart
- Requires Ollama or OpenAI API key
- See [Architecture](../../docs/ARCHITECTURE.md) for system design
