import { app } from "./app";
import { startWorkers } from "./workers/notifier";
import { startBackupScheduler } from "./workers/backup-worker";
import { startOpenFinanceSync } from "./workers/openFinance-sync";
import { startReconciliationWorker } from "./workers/reconciliation-worker";
import { db } from "./lib/db";

async function bootstrap() {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Server running at http://localhost:${port}`);
    startWorkers();
    startBackupScheduler();
    startOpenFinanceSync();
    startReconciliationWorker();
    app.log.info('📦 Backup scheduler started');
    app.log.info('🔄 Open Finance sync worker started');
    app.log.info('💰 Reconciliação de saldo worker started');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Implementação de Graceful Shutdown (Auditoria de Backend - Resiliência)
const signals = ["SIGINT", "SIGTERM"] as const;
signals.forEach((signal) => {
  process.on(signal, async () => {
    app.log.info(
      `[${signal}] Recebido sinal de parada do sistema operativo...`,
    );
    try {
      await app.close();
      await db.$disconnect();
      app.log.info(
        "✅ Conexões HTTP e Banco de Dados fechadas com segurança. Processo finalizado.",
      );
      process.exit(0);
    } catch (err) {
      app.log.error({
        message: "Erro durante o graceful shutdown",
        error: err,
      });
      process.exit(1);
    }
  });
});

bootstrap();
