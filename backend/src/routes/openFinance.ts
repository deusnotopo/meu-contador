import { FastifyInstance } from 'fastify';
import { db } from '../lib/db';
import { getConnectToken, syncBankConnection, pluggyClient } from '../services/pluggy';

export async function openFinanceRoutes(app: FastifyInstance) {
  // Configs
  app.addHook('preHandler', async (request, reply) => {
    // Se for rota de webhook, ignora a autenticação normal
    if (request.url.includes('/webhook')) return;

    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Não autorizado' });
    }
  });

  // GET Token para iniciar ou editar conexão
  // Retorna um accessToken do Pluggy
  app.get('/open-finance/token', async (request, reply) => {
    try {
      const token = await getConnectToken();
      return { accessToken: token };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET Bancos já conectados do usuário atual
  app.get('/open-finance/connections', async (request, reply) => {
    try {
      const connections = await db.bankConnection.findMany({
        where: { userId: request.user.id },
        include: { accounts: true },
        orderBy: { createdAt: 'desc' }
      });
      return connections;
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao buscar conexões' });
    }
  });

  // POST Sync Manual / Force Sync
  app.post('/open-finance/sync/:itemId', async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    try {
      const result = await syncBankConnection(itemId, request.user.id);
      return result;
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao sincronizar' });
    }
  });

  // POST Webhook (Público, Pluggy vai enviar POSTs aqui)
  app.post('/open-finance/webhook', async (request, reply) => {
    const event = request.body as any;
    console.log("Pluggy Webhook Event:", event.event);
    
    try {
      if (event.event === 'item/created') {
        // Encontrar quem é o dono desse webhook
        // (Na prática precisamos amarrar o evento ao usuário, aqui usamos um mock ou o `clientUserId` mapeado pela API)
      }

      if (event.event === 'item/updated') {
        console.log(`Item atualizado: ${event.itemId}`);
        const connection = await db.bankConnection.findUnique({ where: { pluggyItemId: event.itemId } });
        if (connection) {
          // Sync Accounts
          await syncBankConnection(event.itemId, connection.userId);

          // Todo: Sincronizar transactions usando o client
        }
      }

      reply.status(200).send({ ok: true });
    } catch (error) {
      console.error("Webhook Error:", error);
      reply.status(500).send({ error: 'Erro ao processar evento' });
    }
  });
}
