import { i18n } from './i18n'
import { sdk } from './sdk'
import { apiPort, uiPort } from './utils'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Cognee...'))

  const store = await storeJson.read().once()
  const apiKey = (store && store.llmApiKey) || ''
  const model = (store && store.llmModel) || 'openai/gpt-4.1-mini'
  const endpoint = (store && store.llmEndpoint) || 'https://openrouter.ai/api/v1'
  const userEmail = (store && store.userEmail) || 'default_user@example.com'
  const userPassword = (store && store.userPassword) || 'default_password'

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

  // Embeddings + LLM both point at OpenRouter via the shared API key.
  // Construction via sh -c is intentional: StartOS env propagation into
  // Python/pydantic-settings is unreliable, so we inject at process start.
  const envPrefix = [
    'LLM_API_KEY="' + apiKey + '"',
    'LLM_PROVIDER=openai',
    'LLM_MODEL="' + model + '"',
    'LLM_ENDPOINT="' + endpoint + '"',
    'EMBEDDING_API_KEY="' + apiKey + '"',
    'EMBEDDING_PROVIDER=openai',
    'EMBEDDING_MODEL=openai/text-embedding-3-small',
    'EMBEDDING_ENDPOINT="' + endpoint + '"',
    'EMBEDDING_DIMENSIONS=1536',
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
    'COGNEE_USER_EMAIL="' + userEmail + '"',
    'COGNEE_USER_PASSWORD="' + userPassword + '"',
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
