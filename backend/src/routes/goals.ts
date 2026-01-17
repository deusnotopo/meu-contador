import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function goalRoutes(app: FastifyInstance) {
  app.get('/goals', async (request, reply) => {
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    return db.savingsGoal.findMany({ where: { userId: user.id } });
  });

  app.post('/goals', async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      targetAmount: z.number(),
      currentAmount: z.number().default(0),
      deadline: z.string(),
      icon: z.string().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    return db.savingsGoal.create({
      data: {
        ...body,
        deadline: new Date(body.deadline),
        userId: user.id,
      },
    });
  });

  app.patch('/goals/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      currentAmount: z.number(),
    });

    const body = schema.parse(request.body);
    return db.savingsGoal.update({ where: { id }, data: body });
  });

  app.delete('/goals/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.savingsGoal.delete({ where: { id } });
    return reply.status(204).send();
  });
}
