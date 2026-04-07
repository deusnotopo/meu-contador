import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

const investmentTypeSchema = z.enum(['stock', 'fii', 'crypto', 'fixed_income', 'etf']);
const investmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const investmentParamsSchema = z.object({ id: z.string().min(1).max(191) });
const investmentBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  ticker: z.string().trim().min(1).max(20),
  type: investmentTypeSchema,
  amount: z.number().positive().max(1_000_000_000),
  averagePrice: z.number().nonnegative().max(1_000_000_000),
  currentPrice: z.number().nonnegative().max(1_000_000_000),
  currency: z.string().trim().min(1).max(10).default('BRL'),
  sector: z.string().trim().max(80).optional(),
});
const investmentUpdateBodySchema = investmentBodySchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'Informe ao menos um campo para atualização',
});
const dividendBodySchema = z.object({
  amount: z.number().nonnegative().max(1_000_000_000),
  date: z.string().datetime(),
  type: z.enum(['dividend', 'jcp']),
});
const saleBodySchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  price: z.number().nonnegative().max(1_000_000_000),
  date: z.string().datetime(),
});
const investmentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  ticker: z.string(),
  type: z.string(),
  amount: z.number(),
  averagePrice: z.number(),
  currentPrice: z.number(),
  currency: z.string(),
  sector: z.string().nullable().optional(),
}).passthrough();
const paginatedInvestmentsResponseSchema = z.object({
  items: z.array(investmentResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
const dividendResponseSchema = z.object({
  id: z.string(),
  investmentId: z.string(),
  amount: z.number(),
  date: z.union([z.date(), z.string()]),
  type: z.string(),
}).passthrough();
const saleResponseSchema = z.object({
  id: z.string(),
  investmentId: z.string(),
  amount: z.number(),
  price: z.number(),
  totalValue: z.number(),
  date: z.union([z.date(), z.string()]),
  userId: z.string(),
  currency: z.string(),
  ticker: z.string(),
}).passthrough();
const investmentErrorSchema = z.object({ message: z.string() });

export async function investmentRoutes(app: FastifyInstance) {
  // GET all investments for authenticated user
  app.get('/investments', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      querystring: investmentsQuerySchema,
      response: {
        200: paginatedInvestmentsResponseSchema,
        401: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });

    const { page, limit } = request.query as z.infer<typeof investmentsQuerySchema>;
    const skip = (page - 1) * limit;

    const where = { userId };
    const [items, total] = await Promise.all([
      db.investment.findMany({
        where,
        include: { dividends: true, sales: true },
        skip,
        take: limit,
      }),
      db.investment.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  });

  // POST create new investment
  app.post('/investments', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      body: investmentBodySchema,
      response: {
        200: investmentResponseSchema,
        401: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof investmentBodySchema>;
    const userId = (request.user as any).id;
    if (!userId) return reply.status(401).send({ message: 'Unauthorized' });

    const investment = await db.investment.create({
      data: {
        ...body,
        userId,
      },
    });

    return investment;
  });

  // PUT update investment
  app.put('/investments/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      params: investmentParamsSchema,
      body: investmentUpdateBodySchema,
      response: {
        200: investmentResponseSchema,
        401: investmentErrorSchema,
        404: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof investmentParamsSchema>;
    const body = request.body as z.infer<typeof investmentUpdateBodySchema>;
    const userId = (request.user as any).id;
    const existing = await db.investment.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ message: 'Investment not found' });

    const investment = await db.investment.update({
      where: { id },
      data: body,
    });

    return investment;
  });

  // DELETE investment
  app.delete('/investments/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      params: investmentParamsSchema,
      response: {
        204: z.null(),
        404: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof investmentParamsSchema>;
    const userId = (request.user as any).id;
    const deleted = await db.investment.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) return reply.status(404).send({ message: 'Investment not found' });
    return reply.status(204).send();
  });

  // POST add dividend
  app.post('/investments/:id/dividends', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      params: investmentParamsSchema,
      body: dividendBodySchema,
      response: {
        200: dividendResponseSchema,
        404: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof investmentParamsSchema>;
    const body = request.body as z.infer<typeof dividendBodySchema>;
    const userId = (request.user as any).id;
    const investment = await db.investment.findFirst({ where: { id, userId } });
    if (!investment) return reply.status(404).send({ message: 'Investment not found' });

    const dividend = await db.dividend.create({
      data: {
        ...body,
        date: new Date(body.date),
        investmentId: id,
      },
    });

    return dividend;
  });

  // DELETE dividend
  app.delete('/investments/:id/dividends/:dividendId', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().min(1).max(191),
        dividendId: z.string().min(1).max(191),
      }),
      response: {
        204: z.null(),
        404: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id, dividendId } = request.params as { id: string; dividendId: string };
    const userId = (request.user as any).id;
    const investment = await db.investment.findFirst({ where: { id, userId } });
    if (!investment) return reply.status(404).send({ message: 'Investment not found' });
    const deleted = await db.dividend.deleteMany({ where: { id: dividendId, investmentId: id } });
    if (deleted.count === 0) return reply.status(404).send({ message: 'Dividend not found' });
    return reply.status(204).send();
  });

  // POST add sale
  app.post('/investments/:id/sales', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      params: investmentParamsSchema,
      body: saleBodySchema,
      response: {
        200: saleResponseSchema,
        400: investmentErrorSchema,
        404: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof investmentParamsSchema>;
    const body = request.body as z.infer<typeof saleBodySchema>;
    const userId = (request.user as any).id;
    
    // Get the investment to update its amount
    const investment = await db.investment.findFirst({ where: { id, userId } });
    if (!investment) return reply.status(404).send({ message: 'Investment not found' });

    if (investment.amount < body.amount) {
      return reply.status(400).send({ message: 'Insufficient quantity' });
    }

    // Create sale record and update investment in a transaction
    const [sale] = await db.$transaction([
      db.investmentSale.create({
        data: {
          investmentId: id,
          ticker: investment.ticker,
          amount: body.amount,
          price: body.price,
          totalValue: body.amount * body.price,
          date: new Date(body.date),
          userId: investment.userId,
          currency: investment.currency,
        },
      }),
      db.investment.update({
        where: { id },
        data: {
          amount: investment.amount - body.amount,
        },
      }),
    ]);

    return sale;
  });
}
