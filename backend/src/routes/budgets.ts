import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function budgetRoutes(app: FastifyInstance) {
  app.get('/budgets', async (request, reply) => {
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    return db.budget.findMany({ where: { userId: user.id } });
  });

  app.post('/budgets', async (request, reply) => {
    const schema = z.object({
      category: z.string(),
      limit: z.number(),
      month: z.string(),
    });

    const body = schema.parse(request.body);
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    return db.budget.create({
      data: { ...body, userId: user.id },
    });
  });

  app.put('/budgets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      limit: z.number(),
      spent: z.number().optional(),
    });

    const body = schema.parse(request.body);
    return db.budget.update({ where: { id }, data: body });
  });

  app.delete('/budgets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.budget.delete({ where: { id } });
    return reply.status(204).send();
  });
}
