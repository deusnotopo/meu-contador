import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as CashFlowService from '../services/CashFlowService.js';

export async function cashflowRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /cashflow/projection — 30-day cash flow projection
  app.get('/cashflow/projection', {
    schema: {
      tags: ['CashFlow'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        days: z.coerce.number().int().min(7).max(90).default(30),
        scope: z.enum(['personal', 'business', 'all']).default('personal'),
      }),
    },
  }, async (request) => {
    const { days, scope } = request.query as { days: number; scope: string };
    return CashFlowService.getProjection(request.user.id, days, scope);
  });

  // GET /cashflow/recurring — list detected recurring transactions
  app.get('/cashflow/recurring', {
    schema: {
      tags: ['CashFlow'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    const recurring = await CashFlowService.detectRecurring(request.user.id);
    // Format response to float for Consistency with other routes
    return { recurring: recurring.map(r => ({ ...r, amount: r.amount / 100 })) };
  });
}
