import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { PredictiveEngine } from '../services/ai';
import { getCacheValue, setCacheValue, deleteCacheValue } from '../lib/cache';

const transactionScopeSchema = z.enum(['personal', 'business']);
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  scope: transactionScopeSchema.optional(),
});

const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  scope: transactionScopeSchema.optional(),
});
const transactionParamsSchema = z.object({ id: z.string().min(1).max(191) });
const transactionBodySchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount: z.union([
    z.number().finite().positive(),
    z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number"
    })
  ]),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1).max(80),
  date: z.string().min(10), // Aceita tanto ISO '2026-04-04T00:00:00Z' quanto apenas '2026-04-04' do frontend
  scope: transactionScopeSchema,
  receiptUrl: z.string().trim().url().max(2048).optional(),
  mood: z.string().optional(),
  motivation: z.string().optional(),
});
const transactionPatchBodySchema = transactionBodySchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  'Informe ao menos um campo para atualização',
);
const transactionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.string(),
  category: z.string(),
  date: z.union([z.date(), z.string()]),
  scope: z.string(),
  receiptUrl: z.string().nullable().optional(),
});
const paginatedTransactionsResponseSchema = z.object({
  items: z.array(transactionResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
const errorResponseSchema = z.object({ message: z.string() });

// Helper to invalidate transaction cache for a user
async function invalidateTransactionCache(userId: string) {
  // Since we can't easily delete by pattern with the current cache implementation,
  // we'll just let the cache expire naturally. In production with Redis, we could use KEYS/DEL pattern.
  // For now, this is acceptable as cache will expire in 5 minutes anyway.
}

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/transactions', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Transactions'],
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: {
        200: paginatedTransactionsResponseSchema,
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { scope, page, limit } = request.query as z.infer<typeof paginationQuerySchema>;
    const user = request.user as { id: string; isPro: boolean };

    const cacheKey = `transactions:list:${user.id}:${scope || 'all'}:${page}:${limit}`;
    const cachedResult = await getCacheValue(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(scope ? { scope } : {}),
    };

    const [items, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    const result = {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    await setCacheValue(cacheKey, result, 300000); // 5 minutes for volatile data
    return result;
  });

  app.post('/transactions', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Transactions'],
      security: [{ bearerAuth: [] }],
      body: transactionBodySchema,
      response: {
        200: transactionResponseSchema,
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof transactionBodySchema>;
    const user = request.user as { id: string; isPro: boolean };

    const { date, amount, description, category, ...restBody } = body;
    const numericAmount: number = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    let finalCategory = category;
    let finalDesc = description;

    // Auto-predict se escolheu a categoria vazia/genérica "Outros"
    if (category.toLowerCase() === 'outros' || category.trim() === '') {
      const pred = PredictiveEngine.predictTransaction(description, numericAmount * (body.type === 'income' ? 1 : -1));
      finalCategory = pred.suggestedCategory;
      finalDesc = pred.cleanedDescription;
    } else {
      finalDesc = PredictiveEngine.cleanDescription(description);
    }

    const transaction = await db.transaction.create({
      data: {
        ...restBody,
        description: finalDesc,
        category: finalCategory,
        amount: numericAmount,
        date: new Date(date),
        userId: user.id,
      },
    });

    return transaction;
  });

  app.delete('/transactions/:id', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Transactions'],
      security: [{ bearerAuth: [] }],
      params: transactionParamsSchema,
      response: {
        204: z.null(),
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof transactionParamsSchema>;
    const user = request.user as { id: string };
    const deleted = await db.transaction.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) {
      return reply.status(404).send({ message: 'Transaction not found' });
    }
    return reply.status(204).send();
  });

  app.put('/transactions/:id', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Transactions'],
      security: [{ bearerAuth: [] }],
      params: transactionParamsSchema,
      body: transactionPatchBodySchema,
      response: {
        200: transactionResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof transactionParamsSchema>;
    const body = request.body as z.infer<typeof transactionPatchBodySchema>;
    const user = request.user as { id: string };

    const existing = await db.transaction.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return reply.status(404).send({ message: 'Transaction not found' });
    }

    const { date, amount, ...restBody } = body;
    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...restBody,
        ...(amount !== undefined ? { amount: typeof amount === 'string' ? parseFloat(amount) : amount } : {}),
        ...(date ? { date: new Date(date) } : {}),
      },
    });

    return transaction;
  });

  // Cursor-based pagination endpoint
  app.get('/transactions/cursor', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Transactions'],
      security: [{ bearerAuth: [] }],
      querystring: cursorPaginationQuerySchema,
      response: {
        200: z.object({
          items: z.array(transactionResponseSchema),
          nextCursor: z.string().nullable(),
          hasMore: z.boolean(),
        }),
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { cursor, limit, scope } = request.query as z.infer<typeof cursorPaginationQuerySchema>;
    const user = request.user as { id: string; isPro: boolean };

    const where: any = {
      userId: user.id,
      deletedAt: null,
      ...(scope ? { scope } : {}),
    };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const items = await db.transaction.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1, // Fetch one extra to check if there's more
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      items: data,
      nextCursor,
      hasMore,
    };
  });
}
