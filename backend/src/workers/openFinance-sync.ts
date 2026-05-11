import { db } from '../lib/db';
import { syncBankConnection } from '../services/pluggy';
import { logger } from '../lib/logger.js';

/**
 * Job de Sincronização Open Finance (Pluggy)
 */
export async function runOpenFinanceSync() {
  logger.info('[OpenFinance] Executando Job: Sincronização Open Finance (Pluggy)...');
  
  try {
    const activeConnections = await db.bankConnection.findMany({
      where: {
        deletedAt: null,
        NOT: {
          status: 'LOGIN_ERROR'
        }
      },
      include: {
        user: true
      }
    });

    logger.info(`[OpenFinance] ${activeConnections.length} conexões ativas para sincronizar.`);

    let successCount = 0;
    let errorCount = 0;
    let reauthCount = 0;

    for (const connection of activeConnections) {
      try {
        await syncBankConnection(connection.pluggyItemId, connection.userId);
        successCount++;
      } catch (error: unknown) {
        errorCount++;
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.error(`[OpenFinance] Erro ao sincronizar conexão ${connection.pluggyItemId}: ${errMsg}`);

        const errorMessage = errMsg.toLowerCase();
        
        if (
          errorMessage.includes('login') || 
          errorMessage.includes('token') || 
          errorMessage.includes('auth') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')
        ) {
          await db.bankConnection.update({
            where: { id: connection.id },
            data: { status: 'LOGIN_ERROR' }
          });
          reauthCount++;
          logger.warn(`[OpenFinance] Conexão ${connection.pluggyItemId} marcada para re-autenticação.`);
        }
      }
    }

    logger.info(`[OpenFinance] Sync concluído: ${successCount} ok, ${errorCount} erros, ${reauthCount} re-auth.`);
    return { successCount, errorCount, reauthCount };

  } catch (error) {
    logger.error('[OpenFinance] Erro crítico no Job de Sync', error);
    throw error;
  }
}