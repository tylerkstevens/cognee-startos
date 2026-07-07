import { sdk } from '../sdk'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { actions } from '../actions'

export const init = sdk.setupInit(restoreInit, setDependencies, setInterfaces, actions)
