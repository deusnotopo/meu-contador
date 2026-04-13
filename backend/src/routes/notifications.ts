import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';

// ── Helper: persist + emit via WS ────────────────────────────────────────────

export async function createAndEmitNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  app?: FastifyInstance
) {
  const notification = await db.notification.create({
    data: { userId, type, title, body, data: data ? JSON.stringify(data) : null },
  });

  // Emit over WebSocket if app available
  if (app) {
    try {
      const { wsManager } = await import('./websocket.js');
      wsManager.sendToUser(userId, {
        type: 'notification:new',
        payload: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
        },
      });
    } catch { /* WS not critical */ }
  }

  return notification;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function notificationsRoutes(app: FastifyInstance) {

  // GET /notifications — lista notificações do usuário
  app.get('/notifications', {
    schema: {
      description: 'Lista notificações do usuário autenticado',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        limit: z.coerce.number().int().min(1).max(50).default(20),
        unreadOnly: z.coerce.boolean().default(false),
      }),
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { limit, unreadOnly } = request.query as { limit: number; unreadOnly: boolean };
    const userId = request.user.id;

    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        readAt: true,
        createdAt: true,
      },
    });

    const unreadCount = await db.notification.count({
      where: { userId, readAt: null },
    });

    return {
      notifications,
      unreadCount,
      total: notifications.length,
    };
  });

  // PATCH /notifications/:id/read — marcar como lida
  app.patch('/notifications/:id/read', {
    schema: {
      description: 'Marca uma notificação como lida',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return reply.code(404).send({ error: 'Not found' });

    await db.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return { success: true };
  });

  // POST /notifications/read-all — marcar todas como lidas
  app.post('/notifications/read-all', {
    schema: {
      description: 'Marca todas as notificações como lidas',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const userId = request.user.id;

    const { count } = await db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true, count };
  });

  // DELETE /notifications/:id — remover notificação
  app.delete('/notifications/:id', {
    schema: {
      description: 'Remove uma notificação',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return reply.code(404).send({ error: 'Not found' });

    await db.notification.delete({ where: { id } });
    return { success: true };
  });

  // DELETE /notifications — limpar todas as lidas
  app.delete('/notifications', {
    schema: {
      description: 'Remove todas as notificações lidas',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const userId = request.user.id;

    const { count } = await db.notification.deleteMany({
      where: { userId, readAt: { not: null } },
    });

    return { success: true, count };
  });
}
