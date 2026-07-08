import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Cognee...'))

  const store = await storeJson.read().once()
  const apiKey = (store && store.llmApiKey) || ''
  const model = (store && store.llmModel) || ''
  const endpoint = (store && store.llmEndpoint) || ''

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'cognee' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'cognee-sub',
  )

  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer,
    exec: {
      command: [
        'env',
        'LLM_API_KEY=' + apiKey,
        'LLM_MODEL=' + model,
        'LLM_ENDPOINT=' + endpoint,
        'DB_PROVIDER=sqlite',
        'GRAPH_DATABASE_PROVIDER=kuzu',
        'VECTOR_DB_PROVIDER=lancedb',
        'DATA_ROOT_DIRECTORY=/data/.cognee_data',
        'SYSTEM_ROOT_DIRECTORY=/data/.cognee_system',
        'ENV=local',
        'CORS_ALLOWED_ORIGINS=*',
        'REQUIRE_AUTHENTICATION=false',
        'ENABLE_BACKEND_ACCESS_CONTROL=false',
        'ACCEPT_LOCAL_FILE_PATH=false',
        '/app/entrypoint.sh',
      ],
    },
    ready: {
      display: i18n('AI Memory Platform'),
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, uiPort, {
          successMessage: i18n('The Cognee API and web interface'),
          errorMessage: i18n('The Cognee API and web interface'),
        }),
    },
    requires: [],
  })
})
