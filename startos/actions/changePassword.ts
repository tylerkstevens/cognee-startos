import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Account Email'),
    description: i18n('The email of the account whose password you want to change.'),
    required: false,
    default: 'default_user@example.com',
    placeholder: 'default_user@example.com',
  }),
  newPassword: Value.text({
    name: i18n('New Password'),
    description: i18n('Minimum 8 characters.'),
    required: true,
    default: '',
    masked: true,
    placeholder: '••••••••',
  }),
})

export const changePassword = sdk.Action.withInput(
  'change-password',
  async () => ({
    name: i18n('Change Password'),
    description: i18n(
      'Change the password for a local Cognee user account. Takes effect immediately — no restart needed.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => {
    const store = await storeJson.read().once()
    return {
      username: (store && store.userEmail) || 'default_user@example.com',
      newPassword: '',
    }
  },
  async ({ effects, input }) => {
    const username = ((input.username as string) || 'default_user@example.com').trim()
    const newPassword = (input as any).newPassword as string

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.')
    }

    const mounts = sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    })

    const output = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'cognee' as any },
      mounts,
      'change-password',
      async (subcontainer) => {
        const script = `
import sqlite3, sys
from fastapi_users.password import PasswordHelper

email = sys.argv[1]
password = sys.argv[2]

hashed = PasswordHelper().hash(password)
conn = sqlite3.connect('/data/.cognee_system/databases/cognee_db')
c = conn.cursor()
c.execute('UPDATE users SET hashed_password = ? WHERE email = ?', (hashed, email))
if c.rowcount == 0:
    print('NO_USER:' + email)
    conn.close()
    sys.exit(0)
conn.commit()
conn.close()
print('OK:' + email)
`
        await subcontainer.writeFile('/tmp/change_password.py', script)
        const result = await subcontainer.execFail(
          ['python3', '/tmp/change_password.py', username, newPassword],
          {},
          60000,
        )
        return result.stdout.toString().trim()
      },
    )

    if (output.startsWith('NO_USER:')) {
      throw new Error('No Cognee user found with email ' + username)
    }

    return {
      version: '1' as const,
      title: i18n('Password Changed'),
      message: i18n(
        'Password for ' + username + ' was updated. It takes effect immediately for new logins.',
      ),
      result: {
        type: 'single' as const,
        name: i18n('Account'),
        description: null,
        value: username,
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)