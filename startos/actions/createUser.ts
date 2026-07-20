import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: Value.text({
    name: i18n('Email'),
    description: i18n('Email address for the new user.'),
    required: true,
    default: '',
    placeholder: 'user@example.com',
  }),
  password: Value.text({
    name: i18n('Password'),
    description: i18n('Minimum 8 characters.'),
    required: true,
    default: '',
    masked: true,
    placeholder: '••••••••',
  }),
})

export const createUser = sdk.Action.withInput(
  'create-user',
  async () => ({
    name: i18n('Create User'),
    description: i18n(
      'Create a new local Cognee user account. The Cognee service must be running. ' +
        'Note: datasets are owned per-user — a new user starts with an empty workspace.',
    ),
    warning: i18n('New users do NOT see datasets owned by other users.'),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({ email: '', password: '' }),
  async ({ effects, input }) => {
    const email = ((input.email as string) || '').trim()
    const password = (input as any).password as string

    if (!email || !email.includes('@')) {
      throw new Error('A valid email address is required.')
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.')
    }

    const output = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'cognee' as any },
      sdk.Mounts.of(),
      'create-user',
      async (subcontainer) => {
        const script = `
import json, sys, urllib.request, urllib.error

email = sys.argv[1]
password = sys.argv[2]

payload = json.dumps({'email': email, 'password': password}).encode()
req = urllib.request.Request(
    'http://cognee.embassy:8000/api/v1/auth/register',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST',
)
try:
    resp = urllib.request.urlopen(req, timeout=30)
    print('OK:' + email)
    sys.exit(0)
except urllib.error.HTTPError as e:
    body = e.read().decode()[:200]
    if e.code == 400 and 'EXIST' in body.upper():
        print('EXISTS:' + email)
        sys.exit(0)
    print('ERROR:' + str(e.code) + ' ' + body)
    sys.exit(0)
except Exception as e:
    print('ERROR:' + str(e))
    sys.exit(0)
`
        await subcontainer.writeFile('/tmp/create_user.py', script)
        const result = await subcontainer.execFail(
          ['python3', '/tmp/create_user.py', email, password],
          {},
          60000,
        )
        return result.stdout.toString().trim()
      },
    )

    if (output.startsWith('EXISTS:')) {
      throw new Error('A user with email ' + email + ' already exists.')
    }
    if (output.startsWith('ERROR:')) {
      throw new Error(
        'User creation failed: ' + output.slice(6) + ' (is the Cognee service running?)',
      )
    }

    return {
      version: '1' as const,
      title: i18n('User Created'),
      message: i18n(
        'User ' + email + ' created. They can sign in via the Cognee UI. ' +
          'Their workspace is empty — datasets are owned per-user.',
      ),
      result: {
        type: 'single' as const,
        name: i18n('Account'),
        description: null,
        value: email,
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)