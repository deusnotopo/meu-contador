import { isQueueAvailable } from '../lib/queue';
import { startNotificationsJob } from './notifications.job';
import { startOpenFinanceSyncJob } from './openfinance-sync.job';
import { startReconciliationJob } from './reconciliation.job';
import { startBackupJob } from './backup.job';

export async function startAllJobs() {
  if (!isQueueAvailable()) {
    console.log('ℹ️ Redis não configurado — jobs BullMQ desabilitados (app funciona sem eles)');
    return;
  }

  console.log('🚀 Inicializando infraestrutura de Filas BullMQ...');
  
  try {
    await Promise.all([
      startNotificationsJob(),
      startOpenFinanceSyncJob(),
      startReconciliationJob(),
      startBackupJob(),
    ]);
    
    console.log('✅ Todos os jobs BullMQ foram agendados com sucesso.');
  } catch (error) {
    console.error('❌ Falha ao inicializar jobs BullMQ:', error);
  }
}
