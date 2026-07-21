import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.7:0',
  releaseNotes: {
    en_US:
      'Frontend now built from source (dockerBuild) instead of pre-built image. No external image dependencies. Separate LLM and embedding configuration actions. LLM config syncs to Cognee settings API immediately. New Configure Embeddings action. Generic documentation for public release.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})