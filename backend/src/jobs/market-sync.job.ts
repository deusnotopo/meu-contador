import { createQueue, createWorker, isQueueAvailable } from '../lib/queue.js';
import { syncMarketInterestRates } from '../services/MarketSyncService.js';
import { logger } from '../lib/logger.js';

const QUEUE_NAME = 'market-sync';

export const marketSyncQueue = createQueue(QUEUE_NAME);

export async function startMarketSyncJob() {
  if (!isQueueAvailable() || !marketSyncQueue) {
    logger.warn('[MarketSyncJob] Redis indisponível — job de market-sync desativado.');
    return;
  }

  logger.info('[MarketSyncJob] Agendando job de sincronização de taxas (24h)...');

  await marketSyncQueue.add(
    'sync-interest-rates',
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // Todos os dias às 03:00 AM
      },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  createWorker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === 'sync-interest-rates') {
        try {
          await syncMarketInterestRates();
        } catch (error) {
          logger.error('[MarketSyncJob] Erro na execução do job', error);
          throw error;
        }
      }
    },
  );
}
