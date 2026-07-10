import { i18n } from './i18n'
import { sdk } from './sdk'
import { apiPort, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')

  // Native Cognee UI on port 3000 — this is what the "Open UI" button opens
  const uiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Cognee UI'),
    id: 'ui',
    description: i18n('The native Cognee web interface'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // Backend API on port 8000 — exposed for direct API access
  const apiOrigin = await uiMulti.bindPort(apiPort, {
    protocol: 'http',
  })
  const api = sdk.createInterface(effects, {
    name: i18n('Cognee API'),
    id: 'api',
    description: i18n('The Cognee REST API'),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const uiReceipt = await uiOrigin.export([ui])
  const apiReceipt = await apiOrigin.export([api])

  return [uiReceipt, apiReceipt]
})
