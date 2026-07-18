import { sdk } from '../sdk'
import { configureLlm } from './configureLlm'
import { deleteObsoleteDatasets } from './deleteObsoleteDatasets'
import { resetPassword } from './resetPassword'

export const actions = sdk.Actions.of()
  .addAction(configureLlm)
  .addAction(deleteObsoleteDatasets)
  .addAction(resetPassword)
