import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Username / Email'),
    description: i18n('The account email to reset the password for.'),
    required: false,
    default: 'default_user@example.com',
    placeholder: 'default_user@example.com',
  }),
  newPassword: Value.text({
    name: i18n('New Password'),
    description: i18n('The new password. Must be at least 8 characters.'),
    required: true,
    default: '',
    masked: true,
    placeholder: '••••••••',
  }),
})

export const resetPassword = sdk.Action.withInput(
  'reset-password',
  async () => ({
    name: i18n('Reset Local Password'),
    description: i18n(
      'Change the password for the local Cognee user account.',
    ),
    warning: i18n(
      'Saves the new credentials to the Cognee config. ' +
      'Restart the service for the change to take effect.',
    ),
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
    const username = (input.username || 'default_user@example.com') as string
    const newPassword = (input as any).newPassword as string

    await storeJson.merge(effects, {
      userEmail: username,
      userPassword: newPassword,
    })

    return {
      version: '1' as const,
      title: i18n('Password Saved'),
      message: i18n(
        `New password saved for '${username}'. ` +
        'Restart the Cognee service for the change to take effect.',
      ),
      result: {
        type: 'single' as const,
        name: i18n('Status'),
        description: null,
        value: 'Saved — restart to apply',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)
