import { db } from '../lib/db';
import { purgeExpiredSensitiveData, writeAuditLog } from '../lib/audit';
import { webpush } from '../lib/webpush';

/**
 * Job Diário: Checagem de Orçamentos e Metas
 */
export async function checkBudgetsAndGoals() {
  console.log('⏳ Executando Job: Checagem de Orçamentos e Metas...');
  
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Buscar todos os orçamentos do mês atual
    const budgets = await db.budget.findMany({
      where: { month: currentMonth },
      include: { 
        user: {
          include: {
            pushSubscriptions: true
          }
        }
      }
    });

    for (const budget of budgets) {
      if (!budget.user.pushSubscriptions || budget.user.pushSubscriptions.length === 0) continue;

      const limit = budget.limit;
      const spent = budget.spent;
      const percentage = (spent / limit) * 100;

      // Se gastou > 80% do envelope
      if (percentage >= 80 && percentage < 100) {
        const payload = JSON.stringify({
          title: `Atenção ao Orçamento! 🚨`,
          body: `Seu envelope de ${budget.category} está em ${percentage.toFixed(0)}% do limite. Faltam apenas R$ ${(limit - spent).toFixed(2)} para estourar.`,
        });
        
        await dispatchPushs(budget.user.pushSubscriptions, payload);
      } else if (percentage >= 100) {
        const payload = JSON.stringify({
          title: `Orçamento Estourado! 💥`,
          body: `Infelizmente, você ultrapassou o limite do envelope de ${budget.category} neste mês.`,
        });
        
        await dispatchPushs(budget.user.pushSubscriptions, payload);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante Job de Notificações:', error);
    throw error;
  }
}

/**
 * Job de Expurgo de Dados Sensíveis
 */
export async function runSensitiveDataPurge() {
  try {
    const result = await purgeExpiredSensitiveData();
    await writeAuditLog({
      action: 'SENSITIVE_DATA_PURGED',
      resource: 'retention_job',
      metadata: result,
      retentionDays: 30,
    });
  } catch (error) {
    console.error('❌ Erro durante job de retenção/expurgo:', error);
    throw error;
  }
}

// Helper interno para interar sobre múltiplas assinaturas do mesmo User
export async function dispatchPushs(subscriptions: any[], payload: string) {
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload);
    } catch (e: any) {
      console.error('Falha ao enviar Push, possivelmente expirado:', sub.endpoint);
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Exclui a inscrição inválida/expirada de forma limpa
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}
