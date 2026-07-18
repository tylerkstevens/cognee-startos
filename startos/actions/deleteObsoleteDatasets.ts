import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const deleteObsoleteDatasets = sdk.Action.withoutInput(
  'delete-obsolete-datasets',
  async () => ({
    name: i18n('Delete Obsolete Datasets'),
    description: i18n(
      'Remove old source-based datasets (emails-exergy, obsidian-vault) ' +
      'from the SQLite database, bypassing KuzuDB.',
    ),
    warning: i18n(
      'Removes old dataset entries directly from the SQLite database. ' +
      'Topic datasets are safe. A backup is recommended first.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    let output = ''

    try {
      const mounts = sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      })

      output = await sdk.SubContainer.withTemp(
        effects,
        { imageId: 'cognee' as any },
        mounts,
        'cleanup-obsolete-datasets',
        async (subcontainer) => {
          // Simple Python one-liner to test
          const testResult = await subcontainer.execFail(
            ['python3', '-c', 'print("hello from subcontainer")'],
            {},
            30000,
          )
          const testOutput = testResult.stdout.toString().trim()

          // Write the actual cleanup script
          const script = `
import sqlite3, sys
DB = '/data/.cognee_system/databases/cognee_db'
OLD = ['emails-exergy', 'obsidian-vault']
conn = sqlite3.connect(DB)
conn.execute('PRAGMA foreign_keys = ON')
c = conn.cursor()
c.execute('SELECT id, name FROM datasets WHERE name IN (?, ?)', OLD)
ds = c.fetchall()
if not ds:
  print('No old datasets found')
  conn.close()
  sys.exit(0)
ids = [str(d[0]) for d in ds]
ph = ','.join('?' * len(ids))
c.execute(f'SELECT dd.data_id FROM dataset_data dd WHERE dd.dataset_id IN ({ph}) AND dd.data_id NOT IN (SELECT dd2.data_id FROM dataset_data dd2 WHERE dd2.dataset_id NOT IN ({ph}))', ids + ids)
excl = [str(r[0]) for r in c.fetchall()]
if excl:
  dph = ','.join('?' * len(excl))
  c.execute(f'DELETE FROM data WHERE id IN ({dph})', excl)
  print(f'Deleted {c.rowcount} exclusive data records')
c.execute(f'DELETE FROM dataset_data WHERE dataset_id IN ({ph})', ids)
print(f'Deleted {c.rowcount} dataset_data rows')
c.execute(f'DELETE FROM datasets WHERE id IN ({ph})', ids)
print(f'Deleted {c.rowcount} dataset records')
conn.commit()
for d_id, d_name in ds:
  print(f'Removed: {d_name} ({d_id})')
conn.close()
`
          await subcontainer.writeFile('/tmp/cleanup.py', script)
          const result = await subcontainer.execFail(
            ['python3', '/tmp/cleanup.py'],
            {},
            60000,
          )
          return `Test: ${testOutput}\n` + result.stdout.toString().trim()
        },
      )
    } catch (err: any) {
      output = `ERROR: ${err?.message || err}`
    }

    return {
      version: '1' as const,
      title: i18n('Delete Obsolete Datasets'),
      message: i18n(output),
      result: {
        type: 'single' as const,
        name: i18n('Result'),
        description: null,
        value: output,
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)