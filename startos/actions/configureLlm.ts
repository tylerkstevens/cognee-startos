import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  llmApiKey: Value.text({
    name: i18n('API Key'),
    description: i18n('Your OpenAI-compatible API key'),
    required: true,
    default: '',
    masked: true,
    placeholder: 'sk-...',
  }),
  llmProvider: Value.text({
    name: i18n('LLM Provider'),
    description: 'e.g. openai, anthropic, or custom provider name',
    required: false,
    default: 'openai',
    placeholder: 'openai',
  }),
  llmModel: Value.text({
    name: i18n('LLM Model'),
    description: 'Model name (e.g. gpt-4o, claude-sonnet-4-20250514)',
    required: false,
    default: 'gpt-4o',
    placeholder: 'gpt-4o',
  }),
  llmEndpoint: Value.text({
    name: i18n('API Endpoint'),
    description: i18n('Optional custom API endpoint'),
    required: false,
    default: '',
    placeholder: 'https://api.openai.com/v1',
  }),
})

export const configureLlm = sdk.Action.withInput(
  'configure-llm',
  async () => ({
    name: i18n('Configure LLM'),
    description: i18n(
      'Set the LLM provider, model, and API key for Cognee.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => {
    const store = await storeJson.read().once()
    return {
      llmApiKey: store?.llmApiKey,
      llmProvider: store?.llmProvider || 'openai',
      llmModel: store?.llmModel || 'gpt-4o',
      llmEndpoint: store?.llmEndpoint || '',
    }
  },
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      llmApiKey: input.llmApiKey || undefined,
      llmProvider: input.llmProvider || undefined,
      llmModel: input.llmModel || undefined,
      llmEndpoint: input.llmEndpoint || undefined,
    })

    return {
      version: '1' as const,
      title: i18n('Configure LLM'),
      message: i18n('LLM configuration updated.'),
      result: {
        type: 'single' as const,
        name: i18n('Status'),
        description: null,
        value: 'Configured',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)
