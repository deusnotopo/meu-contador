import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { getCacheValue, setCacheValue } from '../lib/cache';

const debtsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const debtParamsSchema = z.object({ id: z.string().uuid() });
const debtBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  balance: z.number().positive().max(1_000_000_000),
  interestRate: z.number().min(0).max(10_000),
  minPayment: z.number().positive().max(1_000_000_000),
  dueDate: z.string().datetime().optional().nullable(),
  category: z.string().trim().min(1).max(40).default('credit_card'),
});
const debtUpdateBodySchema = debtBodySchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'Informe ao menos um campo para atualização',
});
const debtResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  balance: z.number(),
  interestRate: z.number(),
  minPayment: z.number(),
  dueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  category: z.string(),
}).passthrough();
const debtsListResponseSchema = z.object({
  items: z.array(debtResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
const debtDeleteResponseSchema = z.object({ success: z.boolean() });
const debtErrorSchema = z.object({ message: z.string() });

export async function debtRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // List all debts
  app.get('/debts', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      querystring: debtsQuerySchema,
      response: { 200: debtsListResponseSchema },
    },
  }, async (request, reply) => {
    const { page, limit } = request.query as z.infer<typeof debtsQuerySchema>;

    const cacheKey = `debts:list:${request.user.id}:${page}:${limit}`;
    const cachedResult = await getCacheValue(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const skip = (page - 1) * limit;
    const where = { userId: request.user.id };
    const [items, total] = await Promise.all([
      db.debt.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.debt.count({ where }),
    ]);

    const result = { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
    await setCacheValue(cacheKey, result, 1800000); // 30 minutes for stable data
    return result;
  });

  // Create a new debt
  app.post('/debts', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      body: debtBodySchema,
      response: { 200: debtResponseSchema },
    },
  }, async (request, reply) => {
    const validatedData = request.body as z.infer<typeof debtBodySchema>;

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
  });

  // Update a debt
  app.put('/debts/:id', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      params: debtParamsSchema,
      body: debtUpdateBodySchema,
      response: {
        200: debtResponseSchema,
        404: debtErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof debtParamsSchema>;
    const data = request.body as z.infer<typeof debtUpdateBodySchema>;

    const existing = await db.debt.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Debt not found' });
    }

    const debt = await db.debt.update({
      where: {
        id,
      },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate,
      },
    });

    return debt;
  });

  // Delete a debt
  app.delete('/debts/:id', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      params: debtParamsSchema,
      response: {
        200: debtDeleteResponseSchema,
        404: debtErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof debtParamsSchema>;

    const deleted = await db.debt.deleteMany({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (deleted.count === 0) {
      return reply.status(404).send({ message: 'Debt not found' });
    }

    return { success: true };
  });
}
