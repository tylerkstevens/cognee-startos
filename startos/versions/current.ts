import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.5:0',
  releaseNotes: {
    en_US:
      'Fix user management: new Change Password and Create User actions (previous Reset Password wrote unused env vars). Remove obsolete cleanup action. Pin container images. Set 4 GB RAM minimum. Unify license as Apache-2.0.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})