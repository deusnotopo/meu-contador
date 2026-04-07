import { createQueue, createWorker } from '../lib/queue';
import { checkBudgetsAndGoals, runSensitiveDataPurge } from '../workers/notifier';

const QUEUE_NAME = 'notifications';

export const notificationsQueue = createQueue(QUEUE_NAME);

export const notificationsWorker = createWorker(QUEUE_NAME, async (job) => {
  console.log(`[Job] Processing ${job.name}...`);
  
  if (job.name === 'daily-alerts') {
    await checkBudgetsAndGoals();
  } else if (job.name === 'data-purge') {
    await runSensitiveDataPurge();
  }
});

export async function startNotificationsJob() {
  // Add recurring jobs
  // 9:00 AM every day
  await notificationsQueue.add(
    'daily-alerts',
    {},
    {
      repeat: { pattern: '0 9 * * *' },
      jobId: 'daily-alerts-sync', // deterministic ID to prevent duplicates
    }
  );

  // 3:30 AM every day
  await notificationsQueue.add(
    'data-purge',
    {},
    {
      repeat: { pattern: '30 3 * * *' },
      jobId: 'data-purge-sync',
    }
  );

  console.log('📢 Notifications jobs scheduled');
}
