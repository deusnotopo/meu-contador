import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { PredictiveEngine } from '../services/ai.js';
import { getCacheValue, setCacheValue, deleteCacheByPrefix } from '../lib/cache.js';
import { createAndEmitNotification } from './notifications.js';
import { checkBudgetAlerts } from './websocket.js';

async function invalidateBudgetCache(userId: string) {
  await deleteCacheByPrefix(`budgets:list:${userId}:`);
}

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
  paymentMethod: z.string().trim().min(1).max(80).optional(),
  notes: z.string().max(2000).optional(),
  recurring: z.boolean().optional(),
  recurrenceInterval: z.enum(['monthly', 'weekly', 'bi-weekly', 'yearly']).optional(),
  classification: z.enum(['necessity', 'want', 'investment', 'debt']).optional(),
  currency: z.enum(['BRL', 'USD', 'EUR', 'GBP']).optional(),
  originalAmount: z.number().finite().positive().optional(),
  exchangeRate: z.union([
    z.number().finite().positive(),
    z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Exchange rate must be a positive number'
    })
  ]).optional(),
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
  paymentMethod: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  recurring: z.boolean().optional(),
  recurrenceInterval: z.string().nullable().optional(),
  classification: z.string().nullable().optional(),
  currency: z.string().optional(),
  originalAmount: z.number().nullable().optional(),
  exchangeRate: z.number().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  mood: z.string().nullable().optional(),
  motivation: z.string().nullable().optional(),
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
  await deleteCacheByPrefix(`transactions:list:${userId}:`);
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
      deletedAt: null,
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

    const { date, amount, description, category, exchangeRate, ...restBody } = body;
    const numericAmount: number = typeof amount === 'string' ? parseFloat(amount) : amount;
    const numericExchangeRate = exchangeRate === undefined
      ? undefined
      : typeof exchangeRate === 'string'
        ? parseFloat(exchangeRate)
        : exchangeRate;
    
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
        ...(numericExchangeRate !== undefined ? { exchangeRate: numericExchangeRate } : {}),
        date: new Date(date),
        userId: user.id,
      },
    });

    await Promise.all([
      invalidateTransactionCache(user.id),
      invalidateBudgetCache(user.id),
      // Persist notification + emit via WebSocket
      createAndEmitNotification(
        user.id,
        body.type === 'income' ? 'transaction_income' : 'transaction_expense',
        body.type === 'income' ? '💰 Receita registrada' : '💸 Despesa registrada',
        `${finalDesc}: R$ ${numericAmount.toFixed(2)}`,
        { transactionId: transaction.id, category: finalCategory },
        app
      ),
      // Check budget alerts (WS only — already existing)
      body.type === 'expense'
        ? checkBudgetAlerts(user.id, numericAmount, finalCategory)
        : Promise.resolve(),
    ]);

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
    const deleted = await db.transaction.updateMany({
      where: { id, userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (deleted.count === 0) {
      return reply.status(404).send({ message: 'Transaction not found' });
    }
    await Promise.all([
      invalidateTransactionCache(user.id),
      invalidateBudgetCache(user.id),
    ]);
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

    const existing = await db.transaction.findFirst({ where: { id, userId: user.id, deletedAt: null } });
    if (!existing) {
      return reply.status(404).send({ message: 'Transaction not found' });
    }

    const { date, amount, exchangeRate, ...restBody } = body;
    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...restBody,
        ...(amount !== undefined ? { amount: typeof amount === 'string' ? parseFloat(amount) : amount } : {}),
        ...(exchangeRate !== undefined ? { exchangeRate: typeof exchangeRate === 'string' ? parseFloat(exchangeRate) : exchangeRate } : {}),
        ...(date ? { date: new Date(date) } : {}),
      },
    });

    await Promise.all([
      invalidateTransactionCache(user.id),
      invalidateBudgetCache(user.id),
    ]);

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
