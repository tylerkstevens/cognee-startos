import { sdk } from '../sdk'
import { configureLlm } from './configureLlm'
import { resetPassword } from './resetPassword'

export const actions = sdk.Actions.of()
  .addAction(configureLlm)
  .addAction(resetPassword)
