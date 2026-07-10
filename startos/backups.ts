import { sdk } from './sdk'

/**
 * Cognee backup strategy:
 *
 * PROBLEM: LanceDB vector store creates ~65,000 small parquet files (2.2 GB).
 * Both rsync and tar time out (>300s) trying to enumerate/compress this many
 * files on the current hardware.
 *
 * FIX:
 * 1. Back up the 'main' volume, but EXCLUDE the LanceDB directory
 *    (cognee.lancedb/ — 65K files, the bottleneck)
 * 2. The SQLite database at cognee_db contains all source document text and
 *    can regenerate vectors on restore via Cognee's re-indexing
 * 3. The Kuzu graph DB (cognee_graph_kuzu) IS backed up — preserves graph structure
 * 4. Pre/Post hooks stop/start Cognee for database consistency
 *
 * ON RESTORE: The user will need to re-run ingestion on source documents
 * to rebuild the LanceDB vector index. Source text is preserved in SQLite.
 */
export const { createBackup, restoreInit } = sdk.setupBackups(async ({ effects }) =>
  sdk.Backups.ofVolumes('main')
    .setBackupOptions({
      exclude: ['.cognee_system/databases/cognee.lancedb/'],
    })
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