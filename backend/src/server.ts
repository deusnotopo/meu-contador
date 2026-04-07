import { app } from "./app";
import { db } from "./lib/db";
import { startAllJobs } from "./jobs";

async function bootstrap() {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Server running at http://localhost:${port}`);
    
    // Iniciar infraestrutura de filas (Substitui workers individuais node-cron)
    await startAllJobs();
    
    app.log.info('📦 BullMQ Infrastructure initialized (Distributed Workers)');
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
