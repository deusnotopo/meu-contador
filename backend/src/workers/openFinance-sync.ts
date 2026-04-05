import cron from 'node-cron';
import { db } from '../lib/db';
import { syncBankConnection } from '../services/pluggy';

export function startOpenFinanceSync() {
  console.log('🔄 Inicializando Worker de Sincronização Open Finance...');

  cron.schedule('0 */6 * * *', async () => {
    console.log('⏳ Executando sync de Bank Connections (Open Finance)...');
    
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

      console.log(`📊 Encontradas ${activeConnections.length} conexões ativas para sincronizar.`);

      let successCount = 0;
      let errorCount = 0;
      let reauthCount = 0;

      for (const connection of activeConnections) {
        try {
          await syncBankConnection(connection.pluggyItemId, connection.userId);
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Erro ao sincronizar conexão ${connection.pluggyItemId}:`, error.message);

          const errorMessage = error.message?.toLowerCase() || '';
          
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
            console.log(`🔐 Conexão ${connection.pluggyItemId} marcada para re-autenticação.`);
          }
        }
      }

      console.log(`✅ Sync Open Finance concluído: ${successCount} sincronizados, ${errorCount} erros, ${reauthCount} marcados para re-autenticação.`);

    } catch (error) {
      console.error('❌ Erro crítico no Job de Sync Open Finance:', error);
    }
  });

  console.log('⏰ Agendado: Sync Open Finance a cada 6 horas.');
}