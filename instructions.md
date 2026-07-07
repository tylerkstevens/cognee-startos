# Cognee — AI Memory Platform

Cognee is an open-source AI memory platform that gives AI agents persistent long-term memory across sessions.

## Features

- **Knowledge Graphs** — Build self-hosted knowledge graphs from your documents
- **Vector Search** — Semantic search across all ingested content
- **Multi-format Ingestion** — PDFs, text, code, websites, and more
- **Graph Reasoning** — Connect documents by relationships that evolve with your knowledge
- **API Access** — REST API at port 8000 for integration with AI agents

## Setup

1. **Configure LLM** — Use the "Configure LLM" action to set your API key, provider, and model.
   - Default provider: OpenAI
   - Supports: OpenAI, Anthropic, Ollama, and any OpenAI-compatible endpoint
2. **Start the service** — Cognee runs on its own with embedded databases (no external DBs needed).
3. **Access the API** — The web interface and API are available at the service URL shown above.

## Default Configuration

- **LLM**: Requires an API key to function (OpenAI, Anthropic, or compatible)
- **Databases**: SQLite + LanceDB + KuzuDB (all embedded, no setup required)
- **Port**: 8000 (HTTP)
- **Auth**: Disabled by default (single-user mode)

## API Usage

Once running, interact with Cognee via its REST API:

```python
import cognee
await cognee.remember("Your knowledge goes here")
results = await cognee.recall("What do I know about X?")
```

Or use the Cognee MCP server to integrate with AI coding assistants like Claude and Cursor.

## Documentation

- [Cognee Docs](https://docs.cognee.ai)
- [GitHub](https://github.com/topoteretes/cognee)
