import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/transactions', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { scope } = request.query as { scope?: string };
    const user = request.user as { id: string };

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...(scope ? { scope } : {}),
      },
      orderBy: { date: 'desc' },
    });
    return transactions;
  });

  app.post('/transactions', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const schema = z.object({
      description: z.string(),
      amount: z.number(),
      type: z.enum(['income', 'expense']),
      category: z.string(),
      date: z.string(),
      scope: z.enum(['personal', 'business']),
    });

    const body = schema.parse(request.body);
    const user = request.user as { id: string };

    const transaction = await db.transaction.create({
      data: {
        ...body,
        date: new Date(body.date),
        userId: user.id,
      },
    });

    return transaction;
  });

  app.delete('/transactions/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.transaction.delete({ where: { id } });
    return reply.status(204).send();
  });
}
