import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as PushService from '../services/PushService.js';

export async function pushRoutes(app: FastifyInstance) {
  
  // POST /api/push/subscribe
  app.post(
    '/api/push/subscribe',
    {
      preValidation: [app.authenticate],
      schema: {
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
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
      try {
        const subscription = await PushService.subscribe(request.user.id, request.body);
        return reply.status(201).send({ status: 'success', id: subscription.id });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ message: 'Error saving push subscription' });
      }
    }
  );

  // POST /api/push/test
  app.post(
    '/api/push/test',
    {
      preValidation: [app.authenticate],
      schema: {
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        body: z.object({
          title: z.string().optional(),
          body: z.string().optional(),
        }).optional(),
      },
    },
    async (request, reply) => {
      const result = await PushService.sendUserTestNotification(request.user.id, request.body || {});
      
      if (result.successCount === 0 && result.failureCount === 0) {
        return reply.status(404).send({ message: 'Nenhuma assinatura de Push ativa encontrada.' });
      }

      return reply.send({ status: 'sent', ...result });
    }
  );
}
