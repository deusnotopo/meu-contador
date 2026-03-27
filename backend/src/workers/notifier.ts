import cron from 'node-cron';
import { db } from '../lib/db';
import { webpush } from '../lib/webpush';

export function startWorkers() {
  console.log('🤖 Inicializando Workers de Notificação Ativa...');

  // Roda todos os dias às 09:00 AM (Timezone Padrão)
  cron.schedule('0 9 * * *', async () => {
    console.log('⏳ Executando Job Diário: Checagem de Orçamentos e Metas...');
    
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
          
          dispatchPushs(budget.user.pushSubscriptions, payload);
        } else if (percentage >= 100) {
          const payload = JSON.stringify({
            title: `Orçamento Estourado! 💥`,
            body: `Infelizmente, você ultrapassou o limite do envelope de ${budget.category} neste mês.`,
          });
          
          dispatchPushs(budget.user.pushSubscriptions, payload);
        }
      }

    } catch (error) {
      console.error('❌ Erro durante o CronJob de Notificações:', error);
    }
  });
}

// Helper interno para interar sobre múltiplas assinaturas do mesmo User
async function dispatchPushs(subscriptions: any[], payload: string) {
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
