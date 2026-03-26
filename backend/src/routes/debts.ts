import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function debtRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // List all debts
  app.get('/debts', async (request, reply) => {
    const debts = await db.debt.findMany({
      where: { userId: request.user.id },
      orderBy: { name: 'asc' },
    });
    return debts;
  });

  // Create a new debt
  app.post('/debts', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      balance: z.number().positive("Saldo deve ser positivo"),
      interestRate: z.number().min(0, "Taxa de juros deve ser maior ou igual a zero"),
      minPayment: z.number().positive("Pagamento mínimo deve ser positivo"),
      dueDate: z.string().optional().nullable(),
      category: z.string().default("credit_card"),
    });

    try {
      const validatedData = bodySchema.parse(request.body);
      
      const debt = await db.debt.create({
        data: {
          name: validatedData.name,
          balance: validatedData.balance,
          interestRate: validatedData.interestRate,
          minPayment: validatedData.minPayment,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          category: validatedData.category,
          userId: request.user.id,
        },
      });

      return debt;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      throw error;
    }
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
        userId: request.user.id,
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
        userId: request.user.id,
      },
    });

    return { success: true };
  });
}
