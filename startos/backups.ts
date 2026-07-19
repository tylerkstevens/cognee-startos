import { sdk } from './sdk'

/**
 * Cognee backup strategy:
 *
 * LanceDB creates ~65,000 small parquet files (~2.2 GB). StartOS's SDK runs
 * rsync with a hardcoded --timeout=300. Rsync starves on metadata/enumeration
 * between tiny files and exits with code 30, so we can't back up the raw
 * filesystem tree as-is.
 *
 * FIX: stop Cognee, then archive the live data directories into one tar file.
 * StartOS then rsyncs a single large file, which easily stays under the 300s
 * idle timeout and gives us a complete restore of EVERYTHING (LanceDB, Kuzu,
 * SQLite source text, store.json).
 */

const BACKUP_DIR = '.cognee_backup'
const BACKUP_TAR = `${BACKUP_DIR}/cognee-data.tar`

const VOLUME_DATA_PATH = `/media/startos/volumes/main/${BACKUP_TAR}` as const
const BACKUP_TARGET_PATH = `/media/startos/backup/volumes/main/${BACKUP_TAR}` as const

type BackupOperation = 'archive' | 'extract'

async function runCogneeTarStep(
  effects: any,
  operation: BackupOperation,
): Promise<void> {
  // We need write access to the volume during archive (to create the staging
  // tar file) and during extract (to restore the data directories).
  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'cognee' },
    mounts,
    `cognee-backup-${operation}`,
  )

  try {
    if (operation === 'archive') {
      // Ensure the staging directory exists, then remove any stale archive.
      await subcontainer.execFail(
        ['mkdir', '-p', `/data/${BACKUP_DIR}`],
        {},
        60000,
      )
      await subcontainer.exec(
        ['rm', '-f', `/data/${BACKUP_TAR}`],
        {},
        60000,
      )
      await subcontainer.execFail(
        [
          'tar',
          '-cf',
          `/data/${BACKUP_TAR}`,
          '-C',
          '/data',
          '.cognee_data',
          '.cognee_system',
          'store.json',
        ],
        {},
        1800000, // 30 minutes is very generous; tar is one sequential pass
      )
    } else {
      // Restore: wipe old dirs so we don't mix stale files with the backup.
      await subcontainer.exec(
        ['rm', '-rf', '/data/.cognee_data', '/data/.cognee_system'],
        {},
        120000,
      )
      await subcontainer.execFail(
        ['tar', '-xf', `/data/${BACKUP_TAR}`, '-C', '/data'],
        {},
        1800000,
      )
      // Staging file is no longer needed after extraction.
      await subcontainer.exec(
        ['rm', '-rf', `/data/${BACKUP_DIR}`],
        {},
        60000,
      )
    }
  } finally {
    await subcontainer.destroy()
  }
}

export const { createBackup, restoreInit } = sdk.setupBackups(async ({ effects }) =>
  sdk.Backups.ofSyncs({
    dataPath: VOLUME_DATA_PATH,
    backupPath: BACKUP_TARGET_PATH,
  })
    .setPreBackup(async (effects) => {
      // Stop Cognee so the DB files are quiescent, then collapse the data tree
      // into one tar file on the live volume.
      await effects.shutdown()
      await runCogneeTarStep(effects, 'archive')
    })
    .setPostBackup(async (effects) => {
      // Cognee can restart. Leave the tar on disk; it is overwritten on the
      // next backup and costs only ~2 GB on the NVMe volume.
      // Small delay ensures SubContainer volume mounts are released.
      await new Promise((r) => setTimeout(r, 2000))
      try {
        await effects.start()
      } catch {
        // If start fails, give it another shot after a brief wait
        await new Promise((r) => setTimeout(r, 5000))
        await effects.start()
      }
    })
    .setPreRestore(async (effects) => {
      await effects.shutdown()
      // The SDK has already synced the tar from backup target to the live volume.
      // Extract it back into the data directories.
      await runCogneeTarStep(effects, 'extract')
    })
    .setPostRestore(async (effects) => {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        await effects.start()
      } catch {
        await new Promise((r) => setTimeout(r, 5000))
        await effects.start()
      }
    }),
)
