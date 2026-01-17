import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/transactions', async (request, reply) => {
    const { scope } = request.query as { scope?: string };
    
    // We'll use a default user for now until Auth is implemented
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...(scope ? { scope } : {}),
      },
      orderBy: { date: 'desc' },
    });
    return transactions;
  });

  app.post('/transactions', async (request, reply) => {
    const schema = z.object({
      description: z.string(),
      amount: z.number(),
      type: z.enum(['income', 'expense']),
      category: z.string(),
      date: z.string(),
      scope: z.enum(['personal', 'business']),
    });

    const body = schema.parse(request.body);
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const transaction = await db.transaction.create({
      data: {
        ...body,
        date: new Date(body.date),
        userId: user.id,
      },
    });

    return transaction;
  });

  app.delete('/transactions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.transaction.delete({ where: { id } });
    return reply.status(204).send();
  });
}
