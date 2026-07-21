import { sdk } from '../sdk'
import { configureLlm } from './configureLlm'
import { configureEmbedding } from './configureEmbedding'
import { changePassword } from './changePassword'
import { createUser } from './createUser'

export const actions = sdk.Actions.of()
  .addAction(configureLlm)
  .addAction(configureEmbedding)
  .addAction(changePassword)
  .addAction(createUser)