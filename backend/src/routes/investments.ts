import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as InvestmentService from '../services/InvestmentService.js';

const investmentTypeSchema = z.enum(['stock', 'fii', 'crypto', 'fixed_income', 'etf']);

const investmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const isoDateOrDateTimeSchema = z.string().refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && value.trim().length >= 10;
}, 'Data inválida');

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
  date: isoDateOrDateTimeSchema,
  type: z.enum(['dividend', 'jcp']),
});

const saleBodySchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  price: z.number().nonnegative().max(1_000_000_000),
  date: isoDateOrDateTimeSchema,
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
  app.addHook('preHandler', app.authenticate);

  // List investments
  app.get('/investments', {
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      querystring: investmentsQuerySchema,
      response: { 200: paginatedInvestmentsResponseSchema },
    },
  }, async (request) => {
    const query = request.query as z.infer<typeof investmentsQuerySchema>;
    return InvestmentService.listInvestments(request.user.id, query);
  });

  // Create investment
  app.post('/investments', {
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      body: investmentBodySchema,
      response: { 200: investmentResponseSchema },
    },
  }, async (request) => {
    const body = request.body as z.infer<typeof investmentBodySchema>;
    return InvestmentService.createInvestment(request.user.id, body);
  });

  // Update investment
  app.put('/investments/:id', {
    schema: {
      tags: ['Investments'],
      security: [{ bearerAuth: [] }],
      params: investmentParamsSchema,
      body: investmentUpdateBodySchema,
      response: {
        200: investmentResponseSchema,
        404: investmentErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof investmentParamsSchema>;
    const body = request.body as z.infer<typeof investmentUpdateBodySchema>;

    const investment = await InvestmentService.updateInvestment(id, request.user.id, body);
    if (!investment) {
      return reply.status(404).send({ message: 'Investment not found' });
    }
    return investment;
  });

  // Delete investment
  app.delete('/investments/:id', {
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
    const success = await InvestmentService.deleteInvestment(id, request.user.id);
    if (!success) {
      return reply.status(404).send({ message: 'Investment not found' });
    }
    return reply.status(204).send();
  });

  // Log Dividend
  app.post('/investments/:id/dividends', {
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

    const dividend = await InvestmentService.addDividend(id, request.user.id, body);
    if (!dividend) {
      return reply.status(404).send({ message: 'Investment not found' });
    }
    return dividend;
  });

  // Delete Dividend
  app.delete('/investments/:id/dividends/:dividendId', {
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
    const success = await InvestmentService.removeDividend(id, request.user.id, dividendId);
    if (!success) {
      return reply.status(404).send({ message: 'Investment or Dividend not found' });
    }
    return reply.status(204).send();
  });

  // Record Sale
  app.post('/investments/:id/sales', {
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

    const result = await InvestmentService.recordSale(id, request.user.id, body);
    
    if (result.error === 'NOT_FOUND') {
      return reply.status(404).send({ message: 'Investment not found' });
    }
    if (result.error === 'INSUFFICIENT_QUANTITY') {
      return reply.status(400).send({ message: 'Insufficient quantity' });
    }

    return result.sale;
  });
}
