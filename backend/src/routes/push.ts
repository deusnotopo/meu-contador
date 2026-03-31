import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { webpush } from '../lib/webpush';

export async function pushRoutes(app: FastifyInstance) {
  
  // Endpoint para o navegador PWA enviar os segredos da Subscrição
  app.post(
    '/api/push/subscribe',
    {
      preValidation: [app.authenticate],
      schema: {
        body: z.object({
          endpoint: z.string(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { endpoint, keys } = request.body as any;

      try {
        const subscription = await db.pushSubscription.upsert({
          where: { endpoint },
          update: {
            p256dh: keys.p256dh,
            auth: keys.auth,
            userId,
          },
          create: {
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            userId,
          },
        });

        // Teste Opcional: Alerta de Boa-Vindas enviado imediatamente
        const welcomePayload = JSON.stringify({
          title: 'Meu Contador',
          body: 'Notificações Inteligentes ativadas com sucesso neste aparelho.',
        });

        const subObj = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          }
        };

        webpush.sendNotification(subObj, welcomePayload).catch((err: unknown) => console.error('Erro no first-push:', err));

        return reply.status(201).send({ status: 'success', id: subscription.id });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ message: 'Error saving push subscription' });
      }
    }
  );

  // Rota de Teste Simples no Frontend (Botão "Testar Notificação")
  app.post(
    '/api/push/test',
    {
      preValidation: [app.authenticate],
      schema: {
        body: z.object({
          title: z.string().optional(),
          body: z.string().optional(),
        }).optional(),
      },
    },
    async (request, reply) => {
      const userId = request.user.id;
      const bodyParams = request.body as any || {};

      const subscriptions = await db.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        return reply.status(404).send({ message: 'Nenhuma assinatura de Push Ativa encontrada para seu usuário.' });
      }

      const payload = JSON.stringify({
        title: bodyParams.title || 'Notificação de Teste',
        body: bodyParams.body || 'O sistema WebPush no backend disparou perfeitamente.',
      });

      let successCount = 0;
      let failureCount = 0;

      for (const subRecord of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: subRecord.endpoint,
            keys: {
              p256dh: subRecord.p256dh,
              auth: subRecord.auth,
            }
          }, payload);
          successCount++;
        } catch (error: any) {
          app.log.error(error);
          failureCount++;
          // Cleanup: Dispositivo Deslogado, App Desinstalado ou Permissão Removida (404/410)
          if (error.statusCode === 410 || error.statusCode === 404) {
             await db.pushSubscription.delete({ where: { id: subRecord.id } });
          }
        }
      }

      return reply.send({ status: 'sent', successCount, failureCount });
    }
  );
}
