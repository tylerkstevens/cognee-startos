import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  llmApiKey: z.string().optional().catch(undefined),
  llmProvider: z.string().optional().catch(undefined),
  llmModel: z.string().optional().catch(undefined),
  llmEndpoint: z.string().optional().catch(undefined),
  embeddingApiKey: z.string().optional().catch(undefined),
  embeddingProvider: z.string().optional().catch(undefined),
  embeddingModel: z.string().optional().catch(undefined),
  embeddingEndpoint: z.string().optional().catch(undefined),
  embeddingDimensions: z.number().optional().catch(undefined),
  userEmail: z.string().optional().catch(undefined),
  userPassword: z.string().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
