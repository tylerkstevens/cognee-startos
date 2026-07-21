import { i18n } from './i18n'
import { sdk } from './sdk'
import { apiPort, uiPort } from './utils'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Cognee...'))

  const store = await storeJson.read().once()
  const llmApiKey = (store && store.llmApiKey) || ''
  const llmProvider = (store && store.llmProvider) || 'openai'
  const llmModel = (store && store.llmModel) || 'openai/gpt-4.1-mini'
  const llmEndpoint =
    (store && store.llmEndpoint) || 'https://openrouter.ai/api/v1'

  // Embedding config — defaults to LLM values if not set separately
  const embeddingApiKey =
    (store && store.embeddingApiKey) || llmApiKey
  const embeddingProvider =
    (store && store.embeddingProvider) || 'openai'
  const embeddingModel =
    (store && store.embeddingModel) || 'openai/text-embedding-3-small'
  const embeddingEndpoint =
    (store && store.embeddingEndpoint) || llmEndpoint
  const embeddingDimensions =
    (store && store.embeddingDimensions) || 1536

  const userEmail =
    (store && store.userEmail) || 'default_user@example.com'
  const userPassword =
    (store && store.userPassword) || 'default_password'

  // Create both subcontainers up front so daemon types infer cleanly.
  const [subcontainer, uiSubcontainer] = await Promise.all([
    sdk.SubContainer.of(
      effects,
      { imageId: 'cognee' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      }),
      'cognee-sub',
    ),
    sdk.SubContainer.of(
      effects,
      { imageId: 'cognee-frontend' },
      sdk.Mounts.of(),
      'cognee-ui-sub',
    ),
  ])

  // Inject ALL config as env vars via sh -c prefix.
  // LLM config also needs to be pushed to Cognee's internal settings API
  // after startup (see post-start sync below).
  // Embedding config is env-only — Cognee reads it from pydantic-settings.
  const envPrefix = [
    'LLM_API_KEY="' + llmApiKey + '"',
    'LLM_PROVIDER=' + llmProvider,
    'LLM_MODEL="' + llmModel + '"',
    'LLM_ENDPOINT="' + llmEndpoint + '"',
    'EMBEDDING_API_KEY="' + embeddingApiKey + '"',
    'EMBEDDING_PROVIDER=' + embeddingProvider,
    'EMBEDDING_MODEL=' + embeddingModel,
    'EMBEDDING_ENDPOINT="' + embeddingEndpoint + '"',
    'EMBEDDING_DIMENSIONS=' + embeddingDimensions,
    'DB_PROVIDER=sqlite',
    'GRAPH_DATABASE_PROVIDER=kuzu',
    'VECTOR_DB_PROVIDER=lancedb',
    'DATA_ROOT_DIRECTORY=/data/.cognee_data',
    'SYSTEM_ROOT_DIRECTORY=/data/.cognee_system',
    'ENV=local',
    'CORS_ALLOWED_ORIGINS=*',
    'REQUIRE_AUTHENTICATION=false',
    'ENABLE_BACKEND_ACCESS_CONTROL=false',
    'ACCEPT_LOCAL_FILE_PATH=true',
    'DEFAULT_USER_EMAIL="' + userEmail + '"',
    'DEFAULT_USER_PASSWORD="' + userPassword + '"',
  ].join(' ')

  return sdk.Daemons.of(effects)
    .addDaemon('primary', {
      subcontainer,
      exec: {
        command: [
          'sh',
          '-c',
          envPrefix + ' exec /app/entrypoint.sh',
        ],
      },
      ready: {
        display: i18n('AI Memory Platform'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, apiPort, {
            successMessage: i18n('The Cognee API is ready'),
            errorMessage: i18n('The Cognee API is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('ui', {
      subcontainer: uiSubcontainer,
      exec: {
        command: ['npm', 'run', 'start'],
      },
      ready: {
        display: i18n('Cognee UI'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The Cognee UI is ready'),
            errorMessage: i18n('The Cognee UI is not ready'),
          }),
      },
      requires: ['primary' as const],
    })
})