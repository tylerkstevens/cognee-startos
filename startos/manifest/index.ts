import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'cognee',
  title: 'Cognee',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/tylerkstevens/cognee-startos',
  upstreamRepo: 'https://github.com/topoteretes/cognee',
  marketingUrl: 'https://cognee.ai',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    cognee: {
      source: { dockerTag: 'cognee/cognee:latest' },
      arch: ['x86_64'],
      emulateMissingAs: 'x86_64',
      nvidiaContainer: false,
    },
    'cognee-frontend': {
      source: { dockerTag: 'ghcr.io/tylerkstevens/cognee-frontend:latest' },
      arch: ['x86_64'],
      emulateMissingAs: 'x86_64',
      nvidiaContainer: false,
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
  version: '0.1.4:0',
  releaseNotes: {
    en_US: 'Add native Cognee web UI. The Open UI button now serves the Cognee frontend on port 3000, backed by the existing API on port 8000.',
  },
  canMigrateTo: '=0.1.4:0',
  canMigrateFrom: '<=0.1.4:0',
  satisfies: [],
  gitHash: null,
  osVersion: '0.4.0-beta.9',
  sdkVersion: '1.5.3',
  hardwareAcceleration: false,
  nestedRuntime: false,
  plugins: [],
  hardwareRequirements: {
    device: [],
    ram: null,
    arch: ['x86_64'],
  },
} as any)
