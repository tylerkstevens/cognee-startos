# Cognee — AI Memory Platform for StartOS

Cognee is an open-source AI memory platform that gives AI agents persistent long-term memory across sessions. Ingest data in any format, build a self-hosted knowledge graph with vector search and graph reasoning, and let agents recall, connect, and act with full context.

**This package runs Cognee as a StartOS service.** The native web UI is available on port 3000 and the REST API on port 8000. It is pre-configured for use with an OpenAI-compatible API endpoint (OpenRouter, OpenAI, etc.) and uses embedded databases — no external setup required.

---

## Before You Start

You need an **API key** from an OpenAI-compatible LLM provider. Cognee uses this for:
- **LLM calls** — generating summaries, extracting entities and relationships, answering queries
- **Embeddings** — generating vector embeddings for semantic search

### Recommended: OpenRouter

This service is configured to work with OpenRouter out of the box, giving you access to hundreds of models without managing multiple API keys. Get one at [openrouter.ai/keys](https://openrouter.ai/keys).

The default setup uses:
- **LLM:** `openai/gpt-4o-mini` (fast, cheap, good quality)
- **Embeddings:** `openai/text-embedding-3-small` (1536-dim, low cost)

You can change these in the Configure LLM action.

**Alternative providers:** OpenAI, Anthropic, Groq, or any OpenAI-compatible endpoint.

---

## Setup

### 1. Configure the LLM

Use the **Configure LLM** action from the StartOS UI or via `start-cli`:

- **API Key** — Your OpenRouter (or OpenAI-compatible) API key
- **API Endpoint** — `https://openrouter.ai/api/v1`
- **LLM Model** — `openai/gpt-4o-mini` (or your preferred model)
- **Embedding Model** — `openai/text-embedding-3-small` (1536-dim)
- **Embedding Endpoint** — `https://openrouter.ai/api/v1`

The API key is stored in `store.json` on the persistent volume and read at startup.

### 2. Start the service and open the UI

Once configured, start Cognee from the StartOS UI.

- Click **Open UI** to open the native Cognee web interface (port 3000)
- Use the **Cognee API** interface for direct REST access (port 8000)

### 3. Sign in to the local instance

The native UI opens to the *Local instance* sign-in page. Use the default local credentials already filled in:

- **Email:** `default_user@example.com`
- **Password:** `default_password`

These credentials are created automatically by the local Cognee backend. After signing in you can change the password from the UI or use an API key.

### 4. Verify it's running

```bash
# API health check
curl http://cognee.embassy:8000/health
# {"status":"ready","health":"healthy","version":"1.2.2-local"}

# UI is ready when port 3000 responds
curl -I http://cognee.embassy:3000
```

---

## How to Use Cognee

### Ingest data (documents, text, files)

Via REST API:

```bash
# Upload a text file to a dataset
curl -X POST "http://cognee.embassy:8000/api/v1/add" \
  -F "data=@my-document.txt" \
  -F "datasetName=my-knowledge"
```

Supported formats: text, PDF (via pypdf), CSV, images (via captioning), audio (via transcription), and web pages.

### Query / recall

Via REST API:
```bash
# Search across all datasets
curl -X POST "http://cognee.embassy:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "What do I know about X?", "datasets": ["my-knowledge"]}'
```

### Export dataset content

Each dataset can be exported as a human-readable text dump of all summaries, entities, and relationships:

```bash
curl "http://cognee.embassy:8000/api/v1/activity/export/{dataset_id}"
```

This is used by the daily backup pipeline to produce semantic text exports for disaster recovery.

---

## Datasets & Organization

Cognee organizes data into **datasets**. You create them by naming the dataset when you ingest data. Each dataset has its own vector index, knowledge graph, and document store.

This StartOS instance is pre-configured for:
- **Auto-ingestion pipelines** — Email (via Hermes cron), Pocket recordings, Obsidian vault notes
- **Manual ingestion** — Upload any document via the API

---

## Backup & Restore

The package uses a **two-tier backup strategy:**

### Tier 1: StartOS Local Backup (full binary)

During backup, Cognee is stopped and all data is archived into a single tar file (`/data/.cognee_backup/cognee-data.tar`). This preserves:

| Data | Contents | Size |
|------|----------|------|
| `.cognee_data` | Raw text chunks and document storage | ~100 MB |
| `.cognee_system` | LanceDB vectors + Kuzu graph DB + SQLite | ~2.6 GB (65K+ files) |
| `store.json` | API key and model configuration | ~1 KB |

The tar file is rsynced to the backup target as a single file, avoiding the timeout that affects raw rsync of 65K+ tiny files. On restore, the tar is extracted and Cognee resumes with all vectors and graph data intact.

**Note:** The first backup may take 2–3 minutes as it tar-compresses ~2.6 GB of data.

### Tier 2: Semantic Text Export (GitHub)

A separate daily pipeline exports all datasets as markdown text (summaries, entities, relationships) to GitHub. This provides a lightweight backup that can be re-ingested from scratch if needed.

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/v1/add` | POST | Ingest a document (multipart: `data` + `datasetName`) |
| `/api/v1/search` | POST | Search across datasets |
| `/api/v1/activity/export/{dataset_id}` | GET | Export dataset as markdown |
| `/api/v1/activity/pipeline-runs` | GET | List recent pipeline runs |
| `/` | GET | Root health check |

---

## For Developers

The StartOS package source is at `github.com/tylerkstevens/cognee-startos`. The package:
- Uses `@start9labs/start-sdk` v1.5.3
- Builds via ncc + GitHub Actions CI
- Uses embedded databases: LanceDB (vectors), Kuzu (graph), SQLite (metadata)
- Runs on StartOS 0.4.0+

### Environment variables (injected at startup)

| Variable | Value |
|----------|-------|
| `LLM_API_KEY` | From store.json configuration |
| `LLM_PROVIDER` | `openai` (forced — works with any OpenAI-compatible endpoint) |
| `LLM_MODEL` | Configurable via Configure LLM action |
| `LLM_ENDPOINT` | Configurable |
| `EMBEDDING_API_KEY` | Same as LLM API key |
| `EMBEDDING_PROVIDER` | `openai` |
| `EMBEDDING_MODEL` | Configurable |
| `EMBEDDING_ENDPOINT` | Configurable |
| `VECTOR_DB_PROVIDER` | `lancedb` |
| `GRAPH_DATABASE_PROVIDER` | `kuzu` |
| `DB_PROVIDER` | `sqlite` |
| `REQUIRE_AUTHENTICATION` | `false` |
| `ENABLE_BACKEND_ACCESS_CONTROL` | `false` |
| `ACCEPT_LOCAL_FILE_PATH` | `true` |

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Health check returns "not ready" | Cognee still loading LanceDB | Wait 30–60 seconds after start |
| `/datasets` returns 404 | Not a valid endpoint | Use `/api/v1/activity/pipeline-runs` instead |
| Backup shows tar error | Staging directory missing (pre-v0.1.3) | Upgrade to v0.1.3+ |
| API key errors on ingest | Key not set or expired | Run Configure LLM action again |
| Slow first pipeline run | Embedding model first call (cold start) | Subsequent runs are faster |

---

## Resources

- [Upstream Cognee GitHub](https://github.com/topoteretes/cognee)
- [Cognee Documentation](https://docs.cognee.ai)
- [StartOS Package Repo](https://github.com/tylerkstevens/cognee-startos) (source + CI builds)