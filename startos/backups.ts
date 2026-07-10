import { sdk } from './sdk'

/**
 * Cognee backup strategy:
 *
 * PROBLEM: rsync of the entire 'main' volume times out after 300 seconds
 * because Cognee's active databases (LanceDB, Kuzu) create many files and
 * ongoing writes can stall rsync.
 *
 * FIX:
 * 1. Pre-backup: Shut down Cognee daemon gracefully — stops all writes
 *    and ensures database consistency before rsync begins
 * 2. Post-backup: Restart Cognee daemon after rsync completes
 * 3. Pre-restore: Same — stop before writing
 * 4. Post-restore: Restart after restore
 *
 * This uses the standard `ofVolumes` approach (backs up entire 'main' volume),
 * which includes .cognee_data, .cognee_system, config, and all other data.
 */
export const { createBackup, restoreInit } = sdk.setupBackups(async ({ effects }) =>
  sdk.Backups.ofVolumes('main')
    .setPreBackup(async (effects) => {
      // Gracefully stop Cognee to ensure database consistency
      await effects.shutdown()
    })
    .setPostBackup(async (effects) => {
      // Restart Cognee
      await effects.restart()
    })
    .setPreRestore(async (effects) => {
      // Stop Cognee before restoring data
      await effects.shutdown()
    })
    .setPostRestore(async (effects) => {
      // Restart Cognee after restore
      await effects.restart()
    }),
)