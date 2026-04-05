import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '../lib/db';
import { getCacheValue, setCacheValue } from '../lib/cache';

const budgetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});
const budgetParamsSchema = z.object({ id: z.string().min(1).max(191) });
const budgetBodySchema = z.object({
  category: z.string().trim().min(1).max(80),
  limit: z.number().nonnegative().max(1_000_000_000),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});
const budgetUpdateBodySchema = z.object({
  limit: z.number().nonnegative().max(1_000_000_000),
  spent: z.number().nonnegative().max(1_000_000_000).optional(),
});
const budgetResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.string(),
  limit: z.number(),
  spent: z.number().optional().nullable(),
  month: z.string(),
});
const budgetListResponseSchema = z.object({
  items: z.array(budgetResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
const budgetErrorSchema = z.object({ message: z.string() });

export async function budgetRoutes(app: FastifyInstance) {
  app.get('/budgets', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      querystring: budgetQuerySchema,
      response: { 200: budgetListResponseSchema },
    },
  }, async (request, reply) => {
    const user = request.user as { id: string };
    const { page, limit, month } = request.query as z.infer<typeof budgetQuerySchema>;

    const cacheKey = `budgets:list:${user.id}:${month || 'all'}:${page}:${limit}`;
    const cachedResult = await getCacheValue(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const where = { userId: user.id, ...(month ? { month } : {}) };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.budget.findMany({ where, skip, take: limit, orderBy: { month: 'desc' } }),
      db.budget.count({ where }),
    ]);

    const result = { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
    await setCacheValue(cacheKey, result, 1800000); // 30 minutes for stable data
    return result;
  });

  app.post('/budgets', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      body: budgetBodySchema,
      response: {
        200: budgetResponseSchema,
        409: budgetErrorSchema,
      },
    },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof budgetBodySchema>;
    const user = request.user as { id: string };

    try {
      return await db.budget.create({
        data: { ...body, userId: user.id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2002'
      ) {
        return reply.status(409).send({
          message: 'Já existe um orçamento para esta categoria neste mês',
        });
      }

      throw error;
    }
  });

  app.put('/budgets/:id', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      params: budgetParamsSchema,
      body: budgetUpdateBodySchema,
      response: {
        200: budgetResponseSchema,
        404: budgetErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof budgetParamsSchema>;
    const body = request.body as z.infer<typeof budgetUpdateBodySchema>;
    const user = request.user as { id: string };
    const updated = await db.budget.updateMany({ where: { id, userId: user.id }, data: body });
    if (updated.count === 0) {
      return reply.status(404).send({ message: 'Budget not found' });
    }
    return db.budget.findFirst({ where: { id, userId: user.id } });
  });

  app.delete('/budgets/:id', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      params: budgetParamsSchema,
      response: {
        204: z.null(),
        404: budgetErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof budgetParamsSchema>;
    const user = request.user as { id: string };
    const deleted = await db.budget.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) {
      return reply.status(404).send({ message: 'Budget not found' });
    }
    return reply.status(204).send();
  });
}
