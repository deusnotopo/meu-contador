import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function budgetRoutes(app: FastifyInstance) {
  app.get('/budgets', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };

    return db.budget.findMany({ where: { userId: user.id } });
  });

  app.post('/budgets', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const schema = z.object({
      category: z.string(),
      limit: z.number(),
      month: z.string(),
    });

    const body = schema.parse(request.body);
    const user = request.user as { id: string };

    return db.budget.create({
      data: { ...body, userId: user.id },
    });
  });

  app.put('/budgets/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      limit: z.number(),
      spent: z.number().optional(),
    });

    const body = schema.parse(request.body);
    return db.budget.update({ where: { id }, data: body });
  });

  app.delete('/budgets/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.budget.delete({ where: { id } });
    return reply.status(204).send();
  });
}
