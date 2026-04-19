import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as AnalyticsService from '../services/AnalyticsService.js';

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // POST /analytics/health-score — persists daily score snapshot
  app.post('/analytics/health-score', {
    schema: {
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        score: z.number().int().min(0).max(100),
        date: z.string().optional(),
      }),
      response: {
        200: z.object({ success: z.boolean(), history: z.array(z.object({ date: z.string(), score: z.number() })) }),
      },
    },
  }, async (request) => {
    const { score, date } = request.body as { score: number; date?: string };
    const history = await AnalyticsService.saveHealthScore(request.user.id, score, date);
    return { success: true, history };
  });

  // GET /analytics/health-score — returns history
  app.get('/analytics/health-score', {
    schema: {
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ history: z.array(z.object({ date: z.string(), score: z.number() })) }),
      },
    },
  }, async (request) => {
    const history = await AnalyticsService.getHealthScoreHistory(request.user.id);
    return { history };
  });

  // GET /analytics/summary — server-side transaction aggregation
  app.get('/analytics/summary', {
    schema: {
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        months: z.coerce.number().int().min(1).max(24).default(6),
        scope: z.enum(['personal', 'business', 'all']).default('personal'),
      }),
      response: {
        200: z.object({
          monthly: z.array(z.object({
            month: z.string(),
            income: z.number(),
            expense: z.number(),
            balance: z.number(),
          })),
          byCategory: z.array(z.object({
            category: z.string(),
            total: z.number(),
            count: z.number(),
          })),
          totals: z.object({
            income: z.number(),
            expense: z.number(),
            balance: z.number(),
            transactionCount: z.number(),
          }),
        }),
      },
    },
  }, async (request) => {
    const { months, scope } = request.query as { months: number; scope: string };
    return AnalyticsService.getSummary(request.user.id, months, scope);
  });
}
