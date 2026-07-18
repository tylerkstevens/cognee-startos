import { i18n } from '../i18n'
import { sdk } from '../sdk'

const CLEANUP_SCRIPT = `
import sqlite3
import sys

DATABASE_PATH = '/data/.cognee_system/databases/cognee_db'
OLD_DATASETS = ['emails-personal', 'emails-exergy', 'obsidian-vault', 'chat-memory']

conn = sqlite3.connect(DATABASE_PATH)
conn.execute('PRAGMA foreign_keys = ON')
cursor = conn.cursor()

# Get IDs of old datasets
cursor.execute(
    'SELECT id, name FROM datasets WHERE name IN (?, ?, ?, ?)',
    OLD_DATASETS
)
old_datasets = cursor.fetchall()

if not old_datasets:
    print('No old datasets found. Nothing to delete.')
    conn.close()
    sys.exit(0)

old_ids = [str(ds[0]) for ds in old_datasets]
placeholders = ','.join('?' * len(old_ids))

print(f'Found {len(old_datasets)} old datasets:')
for ds_id, ds_name in old_datasets:
    print(f'  {ds_name} ({ds_id})')

# Find data records that are ONLY in old datasets (not shared with topic datasets)
cursor.execute(f'''
    SELECT dd.data_id FROM dataset_data dd
    WHERE dd.dataset_id IN ({placeholders})
    AND dd.data_id NOT IN (
        SELECT dd2.data_id FROM dataset_data dd2
        WHERE dd2.dataset_id NOT IN ({placeholders})
    )
''', old_ids + old_ids)

exclusive_data_ids = [str(row[0]) for row in cursor.fetchall()]
print(f'Found {len(exclusive_data_ids)} data records exclusive to old datasets')

# Delete exclusive data records
if exclusive_data_ids:
    data_placeholders = ','.join('?' * len(exclusive_data_ids))
    cursor.execute(f'DELETE FROM data WHERE id IN ({data_placeholders})', exclusive_data_ids)
    print(f'Deleted {cursor.rowcount} data records')

# Delete dataset_data junction rows for old datasets
cursor.execute(f'DELETE FROM dataset_data WHERE dataset_id IN ({placeholders})', old_ids)
print(f'Deleted {cursor.rowcount} dataset_data junction rows')

# Delete the datasets themselves (CASCADE handles acl, dataset_configuration, dataset_database)
cursor.execute(f'DELETE FROM datasets WHERE id IN ({placeholders})', old_ids)
print(f'Deleted {cursor.rowcount} dataset records')

conn.commit()

for ds_id, ds_name in old_datasets:
    print(f'SUCCESS: Removed dataset "{ds_name}" ({ds_id})')

conn.close()
print('Cleanup complete.')
`

export const deleteObsoleteDatasets = sdk.Action.withoutInput(
  'delete-obsolete-datasets',
  async () => ({
    name: i18n('Delete Obsolete Datasets'),
    description: i18n(
      'Remove old source-based datasets (emails-personal, emails-exergy, ' +
      'obsidian-vault, chat-memory) from the SQLite database, bypassing the ' +
      'KuzuDB graph deletion bug. Topic datasets are NOT affected.',
    ),
    warning: i18n(
      'Stops Cognee, removes old dataset entries directly from the database, ' +
      'then restarts. Topic datasets (256-foundation, hashrate-heatpunks, ' +
      'exergy, the-space, personal) are safe. A backup is recommended first.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    // Stop Cognee so the database is quiescent
    await effects.shutdown()

    let output: string

    try {
      // Mount the main volume and create a temporary subcontainer
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
          // Write the Python cleanup script to the subcontainer
          await subcontainer.writeFile('/tmp/cleanup_obsolete_datasets.py', CLEANUP_SCRIPT)

          // Execute the cleanup script
          const result = await subcontainer.execFail(
            ['python3', '/tmp/cleanup_obsolete_datasets.py'],
            {},
            120000, // 2 minute timeout
          )

          return result.stdout.toString()
        },
      )
    } catch (err) {
      // Restart Cognee even on failure
      await effects.restart()
      throw err
    }

    // Restart Cognee
    await effects.restart()

    return {
      version: '1' as const,
      title: i18n('Old Datasets Removed'),
      message: i18n(
        'Old source-based datasets have been removed from the database. ' +
        'Cognee is restarting.',
      ),
      result: {
        type: 'single' as const,
        name: i18n('Result'),
        description: null,
        value: output || 'Done',
        masked: false,
        copyable: false,
        qr: false,
      },
    }
  },
)