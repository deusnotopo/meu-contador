import { createQueue, createWorker } from '../lib/queue';
import { createBackup, cleanupOldBackups } from '../workers/backup-worker';
import { logger } from '../lib/logger.js';

const QUEUE_NAME = 'backup';

export const backupQueue = createQueue(QUEUE_NAME);

export const backupWorker = createWorker(QUEUE_NAME, async (job) => {
  logger.info(`[Job] Processing ${job.name}...`);
  
  if (job.name === 'run-backup') {
    await createBackup();
    
    // Cleanup old backups weekly (Sunday at 3 AM)
    const now = new Date();
    if (now.getDay() === 0) {
      await cleanupOldBackups();
    }
  }
});

export async function startBackupJob() {
  await backupQueue?.add(
    'run-backup',
    {},
    {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'backup-task',
    }
  );

  logger.info('[Job] Backup job scheduled (daily at 2 AM)');
}
