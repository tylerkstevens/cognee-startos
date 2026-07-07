import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Cognee...'))

  const store = await storeJson.read().once()

  // Build .env content from stored config
  const envLines: string[] = []
  const apiKey = (store && store.llmApiKey) || ''
  envLines.push('LLM_API_KEY=' + apiKey)
  if (store && store.llmProvider && store.llmProvider !== 'openai') {
    envLines.push('LLM_PROVIDER=' + store.llmProvider)
  }
  if (store && store.llmModel) {
    envLines.push('LLM_MODEL=' + store.llmModel)
  }
  if (store && store.llmEndpoint) {
    envLines.push('LLM_ENDPOINT=' + store.llmEndpoint)
  }
  envLines.push('DB_PROVIDER=sqlite')
  envLines.push('GRAPH_DATABASE_PROVIDER=kuzu')
  envLines.push('VECTOR_DB_PROVIDER=lancedb')
  envLines.push('ENV=local')
  envLines.push('CORS_ALLOWED_ORIGINS=*')
  envLines.push('REQUIRE_AUTHENTICATION=false')
  envLines.push('ENABLE_BACKEND_ACCESS_CONTROL=false')
  envLines.push('ACCEPT_LOCAL_FILE_PATH=false')
  envLines.push('')
  const envContent = envLines.join('\n')

  // Write .env to the main volume so Cognee can find it
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'cognee' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'cognee-env-writer',
    async (sub) => {
      await sub.execFail([
        'sh',
        '-c',
        'printf "%s" "$0" > /data/.env',
        envContent,
      ])
    },
  )

  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
      effects,
      { imageId: 'cognee' },
      sdk.Mounts.of()
        .mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: false,
        })
        .mountVolume({
          volumeId: 'main',
          subpath: '.env',
          mountpoint: '/app/.env',
          readonly: false,
          type: 'file',
        }),
      'cognee-sub',
    ),
    exec: { command: ['/app/entrypoint.sh'] },
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
