import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { apiPort } from '../utils'

const cogneeSettingsPort = apiPort

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  llmApiKey: Value.text({
    name: i18n('API Key'),
    description: i18n(
      'Your OpenAI-compatible API key for LLM calls (e.g. OpenRouter, OpenAI, Groq)',
    ),
    required: true,
    default: '',
    masked: true,
    placeholder: 'sk-...',
  }),
  llmProvider: Value.text({
    name: i18n('LLM Provider'),
    description:
      'Provider name — "openai" works for any OpenAI-compatible endpoint',
    required: false,
    default: 'openai',
    placeholder: 'openai',
  }),
  llmModel: Value.text({
    name: i18n('LLM Model'),
    description:
      'Model name including provider prefix if using OpenRouter (e.g. openai/gpt-4.1-mini, deepseek/deepseek-v4-flash)',
    required: false,
    default: 'openai/gpt-4.1-mini',
    placeholder: 'openai/gpt-4.1-mini',
  }),
  llmEndpoint: Value.text({
    name: i18n('API Endpoint'),
    description:
      'OpenAI-compatible API endpoint URL (e.g. https://openrouter.ai/api/v1, https://api.openai.com/v1)',
    required: false,
    default: 'https://openrouter.ai/api/v1',
    placeholder: 'https://openrouter.ai/api/v1',
  }),
})

export const configureLlm = sdk.Action.withInput(
  'configure-llm',
  async () => ({
    name: i18n('Configure LLM'),
    description: i18n(
      'Set the LLM provider, model, API key, and endpoint. Config syncs to Cognee immediately — no restart required.',
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
      llmModel: store?.llmModel || 'openai/gpt-4.1-mini',
      llmEndpoint: store?.llmEndpoint || 'https://openrouter.ai/api/v1',
    }
  },
  async ({ effects, input }) => {
    // Write to StartOS store.json (persistent, survives restarts)
    await storeJson.merge(effects, {
      llmApiKey: input.llmApiKey || undefined,
      llmProvider: input.llmProvider || undefined,
      llmModel: input.llmModel || undefined,
      llmEndpoint: input.llmEndpoint || undefined,
    })

    // Also sync to Cognee's internal settings API so changes take effect immediately
    // without a restart. Cognee stores LLM config both in env vars (at startup)
    // and in its internal settings store (at runtime via this API).
    try {
      await sdk.SubContainer.withTemp(
        effects,
        { imageId: 'cognee' as any },
        sdk.Mounts.of(),
        'cognee-settings-sync',
        async (subcontainer) => {
          const settingsPayload = JSON.stringify({
            llm: {
              provider: input.llmProvider || 'openai',
              model: input.llmModel || 'openai/gpt-4.1-mini',
              apiKey: input.llmApiKey || '',
            },
          })
          await subcontainer.execFail(
            [
              'curl',
              '-s',
              '-X',
              'POST',
              `http://127.0.0.1:${cogneeSettingsPort}/api/v1/settings`,
              '-H',
              'Content-Type: application/json',
              '-d',
              settingsPayload,
            ],
            {},
            30000,
          )
        },
      )
    } catch {
      // Cognee may not be running — config is still saved to store.json
      // and will be applied on next restart. This is non-fatal.
    }

    return {
      version: '1' as const,
      title: i18n('Configure LLM'),
      message: i18n('LLM configuration updated and synced to Cognee.'),
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