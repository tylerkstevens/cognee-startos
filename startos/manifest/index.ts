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
      source: { dockerTag: 'ghcr.io/tylerkstevens/cognee-frontend@sha256:7595efcf950da147c8d2f64200b45328f32c6828245537e2de1ca3dc9d3ee82a' },
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
  version: '0.1.5:0',
  releaseNotes: {
    en_US:
      'Fix user management: new Change Password and Create User actions (previous Reset Password wrote unused env vars). Remove obsolete cleanup action. Pin container images. Set 4 GB RAM minimum. Unify license as Apache-2.0.',
  },
  canMigrateTo: '=0.1.5:0',
  canMigrateFrom: '<=0.1.5:0',
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
