import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as IntelligenceService from '../services/IntelligenceService.js';
import * as WealthIntelligenceService from '../services/WealthIntelligenceService.js';
import { calculateProjection, runProactiveAnalysis } from '../services/IntelligenceService.js';
import { generateWeeklyBriefing } from '../services/BriefingService.js';

export async function intelligenceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /intelligence/summary (AGREGADO AKITA)
  app.get('/summary', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
    }
  }, async (request) => {
    const { id: userId } = request.user as { id: string };
    return WealthIntelligenceService.getUnifiedDashboardState(userId);
  });

  // POST /intelligence/simulate
  const simulateBodySchema = z.object({
    additionalMonthlyDeposit: z.number(),
    expectedAnnualYield: z.number(),
    horizonYears: z.number(),
  });

  app.post('/simulate', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      body: simulateBodySchema,
    }
  }, async (request) => {
    const { id: userId } = request.user as { id: string };
    const params = request.body as z.infer<typeof simulateBodySchema>;
    return calculateProjection(userId, params);
  });

  // POST /intelligence/analyze
  // Triggers the Proactive Analysis engine on demand.
  // Detects spending anomalies and emits persistent notifications.
  app.post('/analyze', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Runs proactive anomaly detection and emits persistent notifications for spending spikes.',
    }
  }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    // Run async — don't block the response
    runProactiveAnalysis(userId).catch(err =>
      console.error('[Intelligence] Proactive analysis failed:', err)
    );

    return reply.code(202).send({ status: 'analysis_queued', userId });
  });

  // POST /intelligence/briefing
  // Generates an on-demand AI Weekly Briefing for the authenticated user.
  // The cron job calls this automatically on Sundays at 20:00 BRT.
  app.post('/briefing', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Generates an AI-powered weekly financial briefing and persists it as a notification.',
    }
  }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    // Fire and forget — generation can take 2-5s
    generateWeeklyBriefing(userId).catch(err =>
      console.error('[Intelligence] Briefing generation failed:', err)
    );

    return reply.code(202).send({ status: 'briefing_queued', userId });
  });
}
