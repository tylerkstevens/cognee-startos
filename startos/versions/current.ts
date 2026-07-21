import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.6:0',
  releaseNotes: {
    en_US:
      'Separate LLM and embedding configuration actions. LLM config syncs to Cognee settings API immediately (no restart). New Configure Embeddings action with independent API key, provider, model, endpoint, and dimensions. Embedding config no longer hardcoded. Removed custom pipeline references from instructions. Store.json expanded with embedding fields.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})