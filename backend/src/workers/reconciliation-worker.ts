import { db } from "../lib/db";
import { writeAuditLog } from "../lib/audit";
import { webpush } from "../lib/webpush";

/**
 * Job de Reconciliação de Saldo
 */
export async function runReconciliation() {
  console.log("⏳ Executando Job: Reconciliação de Saldo...");

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
        // Otimização O(1): Fazer a DB somar, e não explodir a memória do Node.
        const [incomeAgg, expenseAgg] = await Promise.all([
          db.transaction.aggregate({
            where: { userId: account.userId, bankAccountId: account.id, deletedAt: null, type: 'income', date: { lte: new Date() } },
            _sum: { amount: true },
          }),
          db.transaction.aggregate({
            where: { userId: account.userId, bankAccountId: account.id, deletedAt: null, type: 'expense', date: { lte: new Date() } },
            _sum: { amount: true },
          })
        ]);

        const totalIncome = incomeAgg._sum.amount ?? 0;
        const totalExpense = expenseAgg._sum.amount ?? 0;
        const calculatedBalance = totalIncome - totalExpense;

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
              body: `Sua conta ${account.name} tem R$ ${(discrepancyAmount / 100).toFixed(2)} a mais/menos do que o esperado. Verifique suas transações.`,
            });

            // Dispatch push notifications em PARALELO, não trave o thread do Worker
            await Promise.allSettled(account.connection.user.pushSubscriptions.map(async (sub) => {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload,
                );
              } catch (pushError: unknown) {
                const statusCode = (pushError as { statusCode?: number })?.statusCode;
                if (statusCode === 410 || statusCode === 404) {
                  await db.pushSubscription.delete({ where: { id: sub.id } });
                } else {
                  console.error("Falha ao enviar Push de reconciliação:", pushError);
                }
              }
            }));
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
          `✅ Conta ${account.id} reconciliada: banco=R$ ${(bankBalance / 100).toFixed(2)}, calculado=R$ ${(calculatedBalance / 100).toFixed(2)}, diferença=R$ ${(discrepancyAmount / 100).toFixed(2)} (${discrepancyPercent.toFixed(1)}%)`,
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
      action: "BALANCE_RECONCILIATION_COMPLETED",
      resource: "reconciliation_worker",
      metadata: {
        processedAccounts: bankAccounts.length,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("✅ Job de Reconciliação de Saldo concluído");
  } catch (error: unknown) {
    console.error("❌ Erro durante o Job de Reconciliação de Saldo:", error);

    // Tentar logar o erro
    try {
      await writeAuditLog({
        action: "BALANCE_RECONCILIATION_FAILED",
        resource: "reconciliation_worker",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError: any) {
      console.error("Falha ao logar erro de reconciliação:", logError);
    }
    throw error;
  }
}
