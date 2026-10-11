# Architecture

## Overview

FlowForge is a client–server system that connects user intent to UI-level actions. A Chrome extension or embeddable runtime handles page/UI work; the backend runs the AI agent and RAG pipeline.

Browser runtimes represent page context as [`PageTrail`](../packages/page-trail/README.md), the shared canonical DOM representation.

![Architecture overview](assets/architecture-overview.webp)

## Components

### Extension

Extracts page data, handles UI, highlights elements, and manages user interaction. Runs as a Manifest V3 extension with popup, background service worker, and content script. These contexts exchange typed messages that the worker routes to focused handlers.

### Embed runtime

Website-embedded bundle that can use the local backend or a demo API client with predefined responses.

### Backend

Processes queries, runs the AI agent, manages vector storage, and exposes HTTP API. Built with Express, LangChain/LangGraph primitives, and LanceDB.

### Agent

Interprets user intent and orchestrates tool usage with the ReAct pattern and structured tool calls.

### RAG pipeline

Indexes page content into LanceDB and retrieves relevant context for queries using semantic search.

### LLM provider

Inference layer supporting Ollama or OpenAI models for embeddings and generation.

## Interaction flow

### Query flow

1. User asks a question in the Assistant popup or embed shell
2. Background saves a pending query for the page, collects `PageTrailDto`, and sends it with the question to the backend (`POST /query`)
3. Backend restores `PageTrail`, indexes the snapshot, and runs the agent with tools and vector search
4. Background saves the answer and notifies the popup when the query finishes
5. Popup displays the answer; a single direct match may be highlighted automatically, while step-by-step onboarding starts only on request
6. Reopening the popup restores an active pending query or a completed answer for the same page URL; a changed data-ID signature marks the answer as stale

### Indexing flow

1. Browser runtime extracts a `PageTrail` with basics, a container structure, elements, and metadata
2. Backend splits data into documents with metadata
3. Embeddings are generated via LLM provider
4. Documents stored in vector database (LanceDB)

## Pipeline

High-level overview of the [DOM-to-RAG pipeline](dom-to-rag-pipeline.md):

1. **Extraction** — DOM → runtime `PageTrail` → serializable `PageTrailDto`
2. **Transformation** — restored `PageTrail` → semantic `IndexableDocuments` with metadata
3. **Indexing** — Documents → embeddings → vector storage (LanceDB)
4. **Retrieval** — Query → Top-K relevant documents via semantic search
5. **Reranking** — Hybrid scoring (semantic + importance signals)
6. **Resolution** — Documents → actionable tool results (selectors + descriptions)

## Key decisions

**ReAct agent (LangGraph)**
Provides tool-based reasoning with controlled execution flow and observability.

**RAG over page context**
Retrieves relevant page content instead of relying only on agent memory.

**LanceDB**
Embedded vector storage that runs locally alongside the backend.

**Local + cloud LLM**
Switches between local Ollama and OpenAI providers.

**Typed contracts**
Shared request/response contracts live in `@flowforge/contract`; DOM snapshots live in `@flowforge/page-trail`.

## Contracts

Browser runtime ↔ backend:

- `POST /query` — submit user question with page data
- `POST /search` — semantic search over an already indexed page URL
- `GET /health` — service status
- `GET /analytics` — in-memory query analytics

`POST /query` accepts `question`, `pageTrailDto`, `domain`, and optional `userContext.previousQuestions`. It rejects invalid references and context-only snapshots because query results must resolve back to DOM elements. The backend restores the runtime model, indexes the submitted page, and returns `{ result, metadata }`.

`result` is an `AgentResult` with `answer`, `mode`, optional `topic`, and target `elements`. `metadata` includes model, token usage, and execution time. `POST /search` accepts `pageUrl`, `query`, and optional `k`, then returns retrieved documents.

Agent tools use structured Zod schemas. Indexer documents are stored per page URL and embedding provider with content text and source element metadata.

## Constraints

**Single-page context:** No cross-page DOM memory. Each query operates on the submitted page snapshot. The extension keeps short per-domain question history.

**Local backend:** Designed for single-user local deployment. No authentication or multi-tenancy.
