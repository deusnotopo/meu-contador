import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function goalRoutes(app: FastifyInstance) {
  app.get('/goals', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };

    return db.savingsGoal.findMany({ where: { userId: user.id } });
  });

  app.post('/goals', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      targetAmount: z.number(),
      currentAmount: z.number().default(0),
      deadline: z.string(),
      icon: z.string().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const user = request.user as { id: string };

    return db.savingsGoal.create({
      data: {
        ...body,
        deadline: new Date(body.deadline),
        userId: user.id,
      },
    });
  });

  app.patch('/goals/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().optional(),
      targetAmount: z.number().optional(),
      currentAmount: z.number().optional(),
      deadline: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    
    // Convert deadline string to Date if provided
    const updateData = { ...body };
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline) as any;
    }

    return db.savingsGoal.update({ where: { id }, data: updateData });
  });

  app.delete('/goals/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.savingsGoal.delete({ where: { id } });
    return reply.status(204).send();
  });
}
