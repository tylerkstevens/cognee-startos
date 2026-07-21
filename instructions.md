# Cognee — AI Memory Platform for StartOS

Cognee is an open-source AI memory platform that gives AI agents persistent long-term memory across sessions. Ingest data in any format, build a self-hosted knowledge graph with vector search and graph reasoning, and let agents recall, connect, and act with full context.

**This package runs Cognee as a StartOS service.** The native web UI is available on port 3000 and the REST API on port 8000. It uses embedded databases — no external database setup required.

---

## Before You Start

You need at least one **API key** from an OpenAI-compatible LLM provider. Cognee uses separate configuration for:

- **LLM calls** — generating summaries, extracting entities and relationships, answering queries
- **Embeddings** — generating vector embeddings for semantic search

You can use the same API key and endpoint for both, or configure them independently.

### Recommended: OpenRouter

[OpenRouter](https://openrouter.ai/keys) gives you a single API key that works with hundreds of models from different providers. The default configuration uses:

- **LLM:** `openai/gpt-4.1-mini` (fast, cheap, good quality)
- **Embeddings:** `openai/text-embedding-3-small` (1536 dimensions, low cost)

### Alternative Providers

OpenAI, Anthropic, Groq, or any OpenAI-compatible endpoint. Use the **Configure LLM** and **Configure Embeddings** actions to set your provider, model, and endpoint.

---

## Setup

### 1. Configure the LLM

Use the **Configure LLM** action from the StartOS UI (Actions → Configure LLM):

| Field | Example |
|-------|---------|
| **API Key** | `sk-or-v1-...` (OpenRouter) or `sk-...` (OpenAI) |
| **LLM Provider** | `openai` (works for any OpenAI-compatible endpoint) |
| **LLM Model** | `openai/gpt-4.1-mini` |
| **API Endpoint** | `https://openrouter.ai/api/v1` |

LLM config syncs to Cognee immediately — no restart required.

### 2. Configure Embeddings

Use the **Configure Embeddings** action (Actions → Configure Embeddings):

| Field | Example |
|-------|---------|
| **Embedding API Key** | Leave empty to reuse the LLM key, or set a different key |
| **Embedding Provider** | `openai` |
| **Embedding Model** | `openai/text-embedding-3-small` (1536 dim) or `openai/text-embedding-3-large` (3072 dim) |
| **Embedding Endpoint** | Leave empty to reuse the LLM endpoint, or set a different endpoint |
| **Embedding Dimensions** | Must match your model: 1536 for `-small`, 3072 for `-large` |

> **Embedding config requires a service restart.** Save your config, then restart Cognee from the StartOS UI.

### 3. Start the service and open the UI

Once configured, start Cognee from the StartOS UI.

- Click **Open UI** to open the native Cognee web interface (port 3000)
- Use the **Cognee API** interface for direct REST access (port 8000)

### 4. Sign in to the local instance

The native UI opens to the *Local instance* sign-in page. Use the default local credentials:

- **Email:** `default_user@example.com`
- **Password:** `default_password`

These credentials are created automatically on first use.

**To change the password:** use the **Change Password** action (Actions → Change Password). Takes effect immediately.

**To create additional users:** use the **Create User** action, or call the API:

```bash
curl -X POST "http://cognee.embassy:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "their-password"}'
```

> Datasets are owned per-user. A new user starts with an empty workspace.

### 5. Verify it's running

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

```bash
# Upload a text file to a dataset
curl -X POST "http://cognee.embassy:8000/api/v1/add" \
  -F "data=@my-document.txt" \
  -F "datasetName=my-knowledge"
```

### Cognify (build the knowledge graph)

After ingesting data, run cognify to process it into the knowledge graph:

```bash
curl -X POST "http://cognee.embassy:8000/api/v1/cognify" \
  -H "Content-Type: application/json" \
  -d '{"datasets": ["my-knowledge"]}'
```

### Search / recall

```bash
curl -X POST "http://cognee.embassy:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "What do I know about X?", "datasets": ["my-knowledge"]}'
```

Supported ingestion formats: text, PDF, CSV, images (via captioning), audio (via transcription), web pages.

---

## Configuration Architecture

Cognee uses two layers of config:

| Layer | What it controls | How it's set |
|-------|-----------------|-------------|
| **StartOS store.json** | Persistent config on the data volume | Configure LLM / Configure Embeddings actions |
| **Cognee internal settings** | Runtime LLM config | Synced automatically by the Configure LLM action |

**LLM config:** Synced to both layers. StartOS actions update both `store.json` and Cognee's internal settings API. Changes take effect immediately.

**Embedding config:** Environment variables only (Cognee limitation). Set via the Configure Embeddings action, then restart the service.

On restart, all config is read from `store.json` and injected as environment variables — StartOS is always the source of truth.

---

## Datasets & Organization

Cognee organizes data into **datasets**. Create them by naming the dataset when you ingest data. Each dataset has its own vector index, knowledge graph, and document store.

- Ingest documents via the API or UI into named datasets
- Run cognify to process and build the knowledge graph
- Search across one or more datasets

---

## Backup & Restore

The package uses a **two-tier backup strategy:**

### Tier 1: StartOS Local Backup (full binary)

During backup, Cognee is stopped and all data is archived into a single tar file (`/data/.cognee_backup/cognee-data.tar`). This preserves:

| Data | Contents | Typical Size |
|------|----------|-------------|
| `.cognee_data` | Raw text chunks and document storage | ~100 MB |
| `.cognee_system` | LanceDB vectors + Kuzu graph DB + SQLite | ~2.6 GB (65K+ files) |
| `store.json` | API keys and model configuration | ~1 KB |

The tar file is rsynced as a single file, avoiding the timeout that affects raw rsync of 65K+ tiny LanceDB files. On restore, the tar is extracted and Cognee resumes with all data intact.

### Tier 2: Semantic Text Export

Use the `/api/v1/activity/export/{dataset_id}` endpoint to export datasets as markdown text for off-site backup. These exports can be re-ingested from scratch if needed.

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/v1/add` | POST | Ingest a document (multipart: `data` + `datasetName`) |
| `/api/v1/cognify` | POST | Build knowledge graph for datasets |
| `/api/v1/search` | POST | Search across datasets |
| `/api/v1/settings` | GET/POST | LLM configuration (runtime) |
| `/api/v1/activity/export/{dataset_id}` | GET | Export dataset as markdown |
| `/api/v1/activity/pipeline-runs` | GET | List recent pipeline runs |

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Health check returns "not ready" | Cognee still loading LanceDB | Wait 30–60 seconds after start |
| API errors on ingest | LLM API key not configured or invalid | Run Configure LLM action again |
| Embedding errors / wrong vectors | Embedding dimensions don't match model | Check dimensions in Configure Embeddings; must match model spec |
| Backup timeout | LanceDB has 65K+ tiny files | Tar-before-rsync pattern included in this package |
| Changed default user password but login still works with old password | Default user already exists — env vars only seed first-run creation | Use Change Password action |
| Slow first pipeline run | Embedding model cold start | Subsequent runs are faster |

---

## Resources

- [Upstream Cognee GitHub](https://github.com/topoteretes/cognee)
- [Cognee Documentation](https://docs.cognee.ai)
- [StartOS Package Repo](https://github.com/tylerkstevens/cognee-startos)
- [OpenRouter — get an API key](https://openrouter.ai/keys)