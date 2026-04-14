import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';

const userErrorSchema = z.object({ message: z.string() });

export async function userExportRoutes(app: FastifyInstance) {
  // GET /users/export - LGPD Data Export
  app.get('/users/export', {
    schema: {
      description: 'Exporta todos os dados do usuário (LGPD compliance)',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.any(),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate, (app as any).proGuard],
  }, async (request, reply) => {
    const userId = request.user.id;

    const userData = await db.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
        },
        budgets: {
          where: { deletedAt: null },
        },
        goals: {
          where: { deletedAt: null },
        },
        investments: {
          where: { deletedAt: null },
          include: {
            dividends: true,
            sales: true,
          },
        },
        debts: {
          where: { deletedAt: null },
        },
        reminders: {
          where: { deletedAt: null },
        },
        bankAccounts: {
          where: { deletedAt: null },
        },
      },
    });

    if (!userData) {
      return reply.status(404).send({ message: 'User not found' });
    }

    // Remove sensitive fields
    const { passwordHash, ...exportData } = userData;

    // Log export for audit
    await db.auditLog.create({
      data: {
        userId,
        action: 'DATA_EXPORT',
        resource: 'user',
        resourceId: userId,
        metadata: JSON.stringify({ exportedAt: new Date().toISOString() }),
      },
    });

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
    
    return exportData;
  });
}
