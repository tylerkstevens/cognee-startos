import { sdk } from '../sdk'
import { configureLlm } from './configureLlm'
import { changePassword } from './changePassword'
import { createUser } from './createUser'

export const actions = sdk.Actions.of()
  .addAction(configureLlm)
  .addAction(changePassword)
  .addAction(createUser)