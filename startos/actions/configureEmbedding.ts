import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  embeddingApiKey: Value.text({
    name: i18n('Embedding API Key'),
    description: i18n(
      'API key for embedding calls. Leave empty to reuse the LLM API key.',
    ),
    required: false,
    default: '',
    masked: true,
    placeholder: 'sk-... (optional — defaults to LLM key)',
  }),
  embeddingProvider: Value.text({
    name: i18n('Embedding Provider'),
    description:
      'Provider name — "openai" works for any OpenAI-compatible endpoint',
    required: false,
    default: 'openai',
    placeholder: 'openai',
  }),
  embeddingModel: Value.text({
    name: i18n('Embedding Model'),
    description:
      'Model name (e.g. openai/text-embedding-3-small, openai/text-embedding-3-large). 1536-dim for -small, 3072-dim for -large.',
    required: false,
    default: 'openai/text-embedding-3-small',
    placeholder: 'openai/text-embedding-3-small',
  }),
  embeddingEndpoint: Value.text({
    name: i18n('Embedding Endpoint'),
    description:
      'OpenAI-compatible API endpoint for embedding calls. Defaults to the LLM endpoint if left empty.',
    required: false,
    default: '',
    placeholder: 'https://openrouter.ai/api/v1 (optional — defaults to LLM endpoint)',
  }),
  embeddingDimensions: Value.number({
    name: i18n('Embedding Dimensions'),
    description:
      'Vector dimension size for the embedding model. Must match your model: 1536 for text-embedding-3-small, 3072 for text-embedding-3-large, 1024 for voyage-3-lite.',
    required: false,
    default: 1536,
    integer: true,
  }),
})

export const configureEmbedding = sdk.Action.withInput(
  'configure-embedding',
  async () => ({
    name: i18n('Configure Embeddings'),
    description: i18n(
      'Set the embedding model, API key, endpoint, and dimensions. Embedding config is env-only and requires a restart to take effect.',
    ),
    warning: i18n(
      'Embedding configuration requires a service restart to take effect. Save your config, then restart Cognee from the StartOS UI.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => {
    const store = await storeJson.read().once()
    return {
      embeddingApiKey: store?.embeddingApiKey,
      embeddingProvider: store?.embeddingProvider || 'openai',
      embeddingModel:
        store?.embeddingModel || 'openai/text-embedding-3-small',
      embeddingEndpoint: store?.embeddingEndpoint || '',
      embeddingDimensions: store?.embeddingDimensions || 1536,
    }
  },
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      embeddingApiKey: input.embeddingApiKey || undefined,
      embeddingProvider: input.embeddingProvider || undefined,
      embeddingModel: input.embeddingModel || undefined,
      embeddingEndpoint: input.embeddingEndpoint || undefined,
      embeddingDimensions: input.embeddingDimensions || undefined,
    })

    return {
      version: '1' as const,
      title: i18n('Configure Embeddings'),
      message: i18n(
        'Embedding configuration saved. Restart Cognee for changes to take effect.',
      ),
      result: {
        type: 'single' as const,
        name: i18n('Status'),
        description: null,
        value: 'Saved — restart required',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)