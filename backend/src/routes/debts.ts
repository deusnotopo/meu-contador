import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function debtRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // List all debts
  app.get('/debts', async (request, reply) => {
    const debts = await db.debt.findMany({
      where: { userId: request.user.uid },
      orderBy: { name: 'asc' },
    });
    return debts;
  });

  // Create a new debt
  app.post('/debts', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string(),
      balance: z.number(),
      interestRate: z.number(),
      minPayment: z.number(),
      dueDate: z.string().optional().nullable(),
      category: z.string(),
    });

    const { name, balance, interestRate, minPayment, dueDate, category } = bodySchema.parse(request.body);

    const debt = await db.debt.create({
      data: {
        name,
        balance,
        interestRate,
        minPayment,
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        userId: request.user.uid,
      },
    });

    return debt;
  });

  // Update a debt
  app.put('/debts/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      name: z.string().optional(),
      balance: z.number().optional(),
      interestRate: z.number().optional(),
      minPayment: z.number().optional(),
      dueDate: z.string().optional().nullable(),
      category: z.string().optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const data = bodySchema.parse(request.body);

    const debt = await db.debt.update({
      where: {
        id,
        userId: request.user.uid,
      },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate,
      },
    });

    return debt;
  });

  // Delete a debt
  app.delete('/debts/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);

    await db.debt.delete({
      where: {
        id,
        userId: request.user.uid,
      },
    });

    return { success: true };
  });
}
