import { createQueue, createWorker } from '../lib/queue';
import { runOpenFinanceSync } from '../workers/openFinance-sync';
import { logger } from '../lib/logger.js';

const QUEUE_NAME = 'openfinance-sync';

export const openFinanceQueue = createQueue(QUEUE_NAME);

export const openFinanceWorker = createWorker(QUEUE_NAME, async (job) => {
  logger.info(`[Job] Processing ${job.name}...`);
  
  if (job.name === 'sync-connections') {
    return await runOpenFinanceSync();
  }
});

export async function startOpenFinanceSyncJob() {
  await openFinanceQueue?.add(
    'sync-connections',
    {},
    {
      repeat: { pattern: '0 */6 * * *' },
      jobId: 'openfinance-sync-task',
    }
  );

  logger.info('[Job] Open Finance sync job scheduled (every 6 hours)');
}
