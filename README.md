# Cognee — StartOS Package

![Version](https://img.shields.io/badge/version-0.1.4-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![StartOS](https://img.shields.io/badge/StartOS-0.4.0+-orange)

[![Build and Release s9pk](https://github.com/tylerkstevens/cognee-startos/actions/workflows/build.yml/badge.svg)](https://github.com/tylerkstevens/cognee-startos/actions/workflows/build.yml)

**Run [Cognee](https://github.com/topoteretes/cognee) — the open-source AI long-term memory platform — as a fully managed service on StartOS.**

Cognee gives AI agents persistent memory across sessions. Ingest documents, emails, voice recordings, and notes — it builds a self-hosted knowledge graph with vector search, graph reasoning, and ontology generation.

This package wraps Cognee as a StartOS 0.4.0+ service with embedded databases, OpenRouter-ready configuration, and automated backup.

**[Detailed Setup & Usage Instructions →](./instructions.md)**

---

## Quick Start

Install via sideload on StartOS 0.4.0+:

```bash
# Download the latest build
curl -LO https://github.com/tylerkstevens/cognee-startos/releases/latest/download/cognee_x86_64.s9pk

# Install
start-cli package install --sideload cognee_x86_64.s9pk
```

Then use the **Configure LLM** action in the StartOS UI to set your API key, then start the service.

---

## What's Inside

| Component | Details |
|-----------|---------|
| **Upstream** | [Cognee](https://github.com/topoteretes/cognee) — Apache 2.0 licensed |
| **Container** | `cognee/cognee:latest` (API) + `ghcr.io/tylerkstevens/cognee-frontend:latest` (UI) |
| **Ports** | 3000 — native Cognee web UI (Open UI); 8000 — REST API |
| **Databases** | LanceDB (vectors), Kuzu (graph), SQLite (metadata) — all embedded, zero setup |
| **LLM** | OpenAI-compatible endpoint — pre-configured for OpenRouter |
| **SDK** | `@start9labs/start-sdk` v1.5.3 |

---

## Features

- **Native web UI** — click Open UI to use Cognee's own interface on port 3000
- **REST API** — full control via HTTP at port 8000
- **Self-hosted knowledge graphs** — documents, emails, recordings, websites all become queryable memory
- **Vector + graph search** — semantic similarity and relationship traversal
- **Multi-format ingestion** — PDFs, text, CSV, images (captioning), audio (transcription), web pages
- **Two-tier backup** — binary tar (full restore) + semantic text exports (re-ingest safety net)
- **Auto-ingestion pipelines** — designed to integrate with Hermes Agent cron workflows (email, Pocket, Obsidian)

See the **[instructions.md](./instructions.md)** for full API reference, dataset management, and troubleshooting.

---

## Building Locally

```bash
git clone https://github.com/tylerkstevens/cognee-startos
cd cognee-startos
npm ci
npm run build              # compiles TypeScript → JavaScript via ncc

# Install system deps (first time only)
sudo apt-get install squashfs-tools squashfs-tools-ng

# Pack the s9pk
start-cli s9pk pack -o cognee_x86_64.s9pk --arch x86_64 --no-assets
```

Requires Node.js 22 and `start-cli` (download: `https://github.com/Start9Labs/start-os/releases/download/v0.4.0-beta.9/start-cli_x86_64-linux`).

### CI/CD

Every push to `master` / `main` triggers a GitHub Actions workflow that:
1. Installs dependencies and compiles
2. Packs the `.s9pk` artifact
3. Creates a GitHub Release with tag `build-{run_number}`

Signed releases are available on the [Releases page](https://github.com/tylerkstevens/cognee-startos/releases).

---

## Registry Status

- ✅ **Self-hosted registry** — published to `https://192.168.0.4:50286` (Personal Registry)
- 🔜 **Community Registry submission** — polish and submit for global StartOS discoverability

---

## Project Structure

```
cognee-startos/
├── .github/workflows/build.yml   # CI/CD pipeline
├── startos/
│   ├── init.ts                    # First-run setup + config
│   ├── main.ts                    # Service lifecycle
│   ├── backups.ts                 # Backup/restore hooks (tar-based)
│   ├── actions/                   # Configurable actions (Configure LLM)
│   ├── manifest/
│   │   ├── index.ts               # Package manifest
│   │   └── i18n.ts                # Descriptions (en_US)
│   └── versions/                  # Version migration graph
├── icon.svg                       # Service icon
├── instructions.md                # User-facing documentation
└── package.json
```

---

## License

- Package code: MIT
- Upstream Cognee: Apache 2.0

---

## Links

- [Upstream Cognee](https://github.com/topoteretes/cognee) — the AI memory platform this packages
- [Cognee Documentation](https://docs.cognee.ai)
- [Cognee Website](https://cognee.ai)
- [StartOS SDK](https://github.com/Start9Labs/start-sdk)
- [StartOS Registry Docs](https://docs.start9.com)
