import { isQueueAvailable } from '../lib/queue';
import { startNotificationsJob } from './notifications.job';
import { startOpenFinanceSyncJob } from './openfinance-sync.job';
import { startReconciliationJob } from './reconciliation.job';
import { startBackupJob } from './backup.job';
import { startMarketSyncJob } from './market-sync.job.js';
import { logger } from '../lib/logger.js';

export async function startAllJobs() {
  if (!isQueueAvailable()) {
    logger.info('[Jobs] Redis não configurado — jobs BullMQ desabilitados (app funciona sem eles)');
    return;
  }

  logger.info('[Jobs] Inicializando infraestrutura de Filas BullMQ...');
  
  try {
    await Promise.all([
      startNotificationsJob(),
      startOpenFinanceSyncJob(),
      startReconciliationJob(),
      startBackupJob(),
      startMarketSyncJob(),
    ]);
    
    logger.info('[Jobs] Todos os jobs BullMQ foram agendados com sucesso.');
  } catch (error) {
    logger.error('[Jobs] Falha ao inicializar jobs BullMQ', error);
  }
}
