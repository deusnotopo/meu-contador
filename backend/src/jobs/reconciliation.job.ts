import { createQueue, createWorker } from '../lib/queue';
import { runReconciliation } from '../workers/reconciliation-worker';

const QUEUE_NAME = 'reconciliation';

export const reconciliationQueue = createQueue(QUEUE_NAME);

export const reconciliationWorker = createWorker(QUEUE_NAME, async (job) => {
  console.log(`[Job] Processing ${job.name}...`);
  
  if (job.name === 'reconcile-balances') {
    return await runReconciliation();
  }
});

export async function startReconciliationJob() {
  await reconciliationQueue?.add(
    'reconcile-balances',
    {},
    {
      repeat: { pattern: '0 */6 * * *' },
      jobId: 'reconciliation-task',
    }
  );

  console.log('🔍 Reconciliation job scheduled (every 6 hours)');
}
