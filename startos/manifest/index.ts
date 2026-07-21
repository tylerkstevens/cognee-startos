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
      source: { dockerTag: 'cognee/cognee:1.4.0' },
      arch: ['x86_64'],
      emulateMissingAs: 'x86_64',
      nvidiaContainer: false,
    },
    'cognee-frontend': {
      source: { dockerTag: 'cognee-frontend:latest' },
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
  version: '0.1.7:0',
  releaseNotes: {
    en_US:
      'Frontend now built from source (dockerBuild) instead of pre-built image. No external image dependencies. Separate LLM and embedding configuration actions. LLM config syncs to Cognee settings API immediately. New Configure Embeddings action with independent API key, provider, model, endpoint, and dimensions. Generic documentation for public release.',
  },
  canMigrateTo: '=0.1.7:0',
  canMigrateFrom: '<=0.1.7:0',
  satisfies: [],
  gitHash: null,
  osVersion: '0.4.0-beta.9',
  sdkVersion: '1.5.3',
  hardwareAcceleration: false,
  nestedRuntime: false,
  plugins: [],
  hardwareRequirements: {
    device: [],
    ram: 4096,
    arch: ['x86_64'],
  },
} as any)
