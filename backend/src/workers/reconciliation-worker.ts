import cron from "node-cron";
import { db } from "../lib/db";
import { writeAuditLog } from "../lib/audit";
import { webpush } from "../lib/webpush";

export function startReconciliationWorker() {
  console.log("🔄 Inicializando Worker de Reconciliação de Saldo...");

  // Roda a cada 6 horas (mesma frequência do sync Open Finance)
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏳ Executando Job de Reconciliação de Saldo...");

    try {
      // Buscar todas as contas bancárias com conexão ativa
      const bankAccounts = await db.bankAccount.findMany({
        where: {
          connection: {
            status: {
              not: "LOGIN_ERROR", // Ignorar conexões com erro de login
            },
          },
        },
        include: {
          connection: {
            include: {
              user: {
                include: {
                  pushSubscriptions: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `🔍 Encontradas ${bankAccounts.length} contas bancárias para reconciliação`,
      );

      for (const account of bankAccounts) {
        try {
          // Pular se não tiver saldo do banco (Open Finance)
          if (account.balance === null) {
            console.log(
              `⚠️  Conta ${account.id} sem saldo do banco, pulando reconciliação`,
            );
            continue;
          }

          // Buscar exclusivamente transações associadas a esta conta bancária
          // Ignorar o que foi deletado (soft-delete) e transações do futuro (agendadas)
          const userTransactions = await db.transaction.findMany({
            where: { 
              userId: account.userId,
              bankAccountId: account.id,
              deletedAt: null,
              date: {
                lte: new Date() // Só considerar transações passadas/hoje
              }
            },
            select: { amount: true, type: true },
          });

          // Calcular saldo calculado (entradas - saídas)
          const calculatedBalance = userTransactions.reduce((sum, tx) => {
            if (tx.type === "INCOME" || tx.type === "CREDIT") {
              return sum + tx.amount;
            } else if (tx.type === "EXPENSE" || tx.type === "DEBIT") {
              return sum - tx.amount;
            }
            return sum;
          }, 0);

          // Calcular discrepância
          const bankBalance = account.balance ?? 0;
          const discrepancyAmount = bankBalance - calculatedBalance;
          const discrepancyPercent =
            bankBalance !== 0
              ? Math.abs(discrepancyAmount / bankBalance) * 100
              : 0;

          // Determinar status
          let reconciliationStatus: "MATCHING" | "DISCREPANCY" | "ERROR" =
            "MATCHING";

          if (Math.abs(discrepancyAmount) < 0.01) {
            reconciliationStatus = "MATCHING";
          } else if (
            discrepancyPercent > 5 ||
            Math.abs(discrepancyAmount) > 100
          ) {
            // Mais de 5% ou mais de R$100 de diferença
            reconciliationStatus = "DISCREPANCY";

            // Enviar notificação de discrepância significativa
            if (
              account.connection?.user?.pushSubscriptions &&
              account.connection.user.pushSubscriptions.length > 0
            ) {
              const payload = JSON.stringify({
                title: `Saldo não confere! 🔍`,
                body: `Sua conta ${account.name} tem R$ ${discrepancyAmount.toFixed(2)} a mais/menos do que o esperado. Verifique suas transações.`,
              });

              // Dispatch push notifications
              for (const sub of account.connection.user.pushSubscriptions) {
                try {
                  await webpush.sendNotification(
                    {
                      endpoint: sub.endpoint,
                      keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload,
                  );
                } catch (pushError: any) {
                  console.error(
                    "Falha ao enviar Push de reconciliação:",
                    pushError,
                  );
                  if (
                    pushError.statusCode === 410 ||
                    pushError.statusCode === 404
                  ) {
                    // Remove expired subscription
                    await db.pushSubscription.delete({
                      where: { id: sub.id }
                    });
                    console.log(`🧹 Assinatura de Push removida (Expirada/410). ID: ${sub.id}`);
                  }
                }
              }
            }
          } else {
            reconciliationStatus = "MATCHING"; // Pequena diferença aceitável
          }

          // Atualizar registro no banco
          await db.bankAccount.update({
            where: { id: account.id },
            data: {
              calculatedBalance,
              lastReconciledAt: new Date(),
              reconciliationStatus,
              discrepancyAmount,
            },
          });

          console.log(
            `✅ Conta ${account.id} reconciliada: banco=R$ ${bankBalance.toFixed(2)}, calculado=R$ ${calculatedBalance.toFixed(2)}, diferença=R$ ${discrepancyAmount.toFixed(2)} (${discrepancyPercent.toFixed(1)}%)`,
          );
        } catch (accountError) {
          console.error(
            `❌ Erro ao reconciliar conta ${account.id}:`,
            accountError,
          );

          // Marcar como erro
          try {
            await db.bankAccount.update({
              where: { id: account.id },
              data: {
                reconciliationStatus: "ERROR",
                lastReconciledAt: new Date(),
              },
            });
          } catch (updateError) {
            console.error("Erro ao atualizar status de erro:", updateError);
          }
        }
      }

      // Log da execução completa
      await writeAuditLog({
        userId: "system", // Worker do sistema
        action: "BALANCE_RECONCILIATION_COMPLETED",
        resource: "reconciliation_worker",
        metadata: {
          processedAccounts: bankAccounts.length,
          timestamp: new Date().toISOString(),
        },
      });

      console.log("✅ Job de Reconciliação de Saldo concluído");
    } catch (error: any) {
      console.error("❌ Erro durante o Job de Reconciliação de Saldo:", error);

      // Tentar logar o erro
      try {
        await writeAuditLog({
          userId: "system",
          action: "BALANCE_RECONCILIATION_FAILED",
          resource: "reconciliation_worker",
          metadata: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (logError: any) {
        console.error("Falha ao logar erro de reconciliação:", logError);
      }
    }
  });
}
