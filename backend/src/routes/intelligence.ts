import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as IntelligenceService from '../services/IntelligenceService.js';
import * as WealthIntelligenceService from '../services/WealthIntelligenceService.js';
import { calculateProjection, queueProactiveAnalysis } from '../services/IntelligenceService.js';
import { generateWeeklyBriefing } from '../services/BriefingService.js';
import { IsolationForestService } from '../services/IsolationForestService.js';
import type { TransactionFeature } from '../services/IsolationForestService.js';
import { logger } from '../lib/logger.js';

const userIdSchema = z.object({ id: z.string().min(1) });

function getAuthenticatedUserId(request: { user?: unknown }): string {
  return userIdSchema.parse(request.user).id;
}

export async function intelligenceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /intelligence/summary
  app.get('/summary', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
    }
  }, async (request) => {
    const userId = getAuthenticatedUserId(request);
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
    const userId = getAuthenticatedUserId(request);
    const params = simulateBodySchema.parse(request.body);
    return calculateProjection(userId, params);
  });

  // POST /intelligence/analyze
  app.post('/analyze', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Runs proactive anomaly detection and emits persistent notifications for spending spikes.',
    }
  }, async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const { jobId } = await queueProactiveAnalysis(userId);
    return reply.code(202).send({ status: 'analysis_queued', userId, jobId });
  });

  // POST /intelligence/briefing
  app.post('/briefing', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Generates an AI-powered weekly financial briefing and persists it as a notification.',
    }
  }, async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const jobId = `briefing:${userId}:${Date.now()}`;
    void generateWeeklyBriefing(userId).catch(err =>
      logger.error('[Intelligence] Briefing generation failed', { jobId, userId, error: err })
    );
    return reply.code(202).send({ status: 'briefing_queued', userId, jobId });
  });

  // ── COGNITIVE LAYER ────────────────────────────────────────────────────────

  // GET /intelligence/regime
  // Retorna o regime financeiro atual via Hidden Markov Model
  app.get('/regime', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Returns current financial regime (EXPANSION/STABILITY/CONTRACTION) via HMM.',
    }
  }, async (request) => {
    const userId = getAuthenticatedUserId(request);
    const summary = await IntelligenceService.getDashboardSummary(userId);
    return { regime: summary.regime };
  });

  // POST /intelligence/counterfactual
  // Motor de inferência causal — simulação contrafatual
  const counterfactualSchema = z.object({
    type: z.enum(['REMOVE_CATEGORY', 'CAP_SPENDING', 'INCREASE_INCOME', 'REDUCE_DEBT_PAYMENT']),
    categoryName: z.string().optional(),
    valueInCents: z.number().optional(),
    monthsBack: z.number().min(1).max(24).default(6),
  });

  app.post('/counterfactual', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Causal inference: "what would have happened if...?" Computes counterfactual financial trajectory.',
    }
  }, async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const intervention = counterfactualSchema.parse(request.body);

    const { db } = await import('../lib/db.js');
    const { computeCounterfactual } = await import('../services/CausalInferenceService.js');

    const monthsBack = intervention.monthsBack ?? 6;
    const since = new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000);

    const transactions = await db.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: since } },
      select: { type: true, amount: true, category: true, date: true },
      orderBy: { date: 'asc' },
    });

    type MonthlyAccumulator = {
      month: string;
      incomeCents: number;
      expenseCents: number;
      categoryCents: Record<string, number>;
    };

    const monthlyMap: Record<string, MonthlyAccumulator> = {};
    for (const tx of transactions) {
      const month = tx.date.toISOString().slice(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, incomeCents: 0, expenseCents: 0, categoryCents: {} };
      }
      if (tx.type === 'income') monthlyMap[month].incomeCents += tx.amount;
      if (tx.type === 'expense') {
        monthlyMap[month].expenseCents += tx.amount;
        monthlyMap[month].categoryCents[tx.category] =
          (monthlyMap[month].categoryCents[tx.category] ?? 0) + tx.amount;
      }
    }

    const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    const result = computeCounterfactual(monthlyData, {
      type: intervention.type,
      categoryName: intervention.categoryName,
      valueInCents: intervention.valueInCents,
      monthsBack,
    });

    return reply.send(result);
  });

  // GET /intelligence/rules
  // Avalia todas as regras para o usuário autenticado com trace de auditoria
  app.get('/rules', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Evaluates all financial rules and returns decisions with audit trace (LGPD-compliant).',
    }
  }, async (request) => {
    const userId = getAuthenticatedUserId(request);
    const summary = await IntelligenceService.getDashboardSummary(userId);
    return {
      decisions: summary.decisions,
      evaluatedAt: new Date().toISOString(),
      ruleCount: summary.decisions.length,
    };
  });

  // GET /intelligence/anomalies
  // Detecção de anomalias via Isolation Forest (unsupervised, baseado no comportamento individual)
  app.get('/anomalies', {
    schema: {
      tags: ['Intelligence'],
      security: [{ bearerAuth: [] }],
      description: 'Detects spending anomalies using Isolation Forest. Returns flagged transactions with anomaly_score.',
    }
  }, async (request) => {
    const userId = getAuthenticatedUserId(request);

    const { db } = await import('../lib/db.js');
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [historical, recent] = await Promise.all([
      db.transaction.findMany({
        where: { userId, deletedAt: null, type: 'expense', date: { gte: ninetyDaysAgo, lt: thirtyDaysAgo } },
        select: { id: true, description: true, amount: true, category: true, date: true },
      }),
      db.transaction.findMany({
        where: { userId, deletedAt: null, type: 'expense', date: { gte: thirtyDaysAgo } },
        select: { id: true, description: true, amount: true, category: true, date: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    if (historical.length < 4) {
      return {
        anomalies: [],
        message: 'Dados históricos insuficientes. São necessários ao menos 2 meses de transações.',
        analyzedAt: new Date().toISOString(),
      };
    }

    const toFeature = (tx: { id: string; category: string; amount: number; date: Date }): TransactionFeature => ({
      id: tx.id,
      category: tx.category,
      amountCents: tx.amount,
      dayOfMonth: new Date(tx.date).getDate(),
      dayOfWeek: new Date(tx.date).getDay(),
      monthOfYear: new Date(tx.date).getMonth() + 1,
      isRecurring: false,
    });

    const forest = new IsolationForestService();
    const historicalFeatures = historical.map(toFeature);
    const recentFeatures = recent.map(toFeature);
    const anomalies = forest.detectAnomalies(historicalFeatures, recentFeatures);

    const enriched = anomalies.map(a => {
      const tx = recent.find(t => t.id === a.transactionId);
      return {
        id: a.transactionId,
        description: tx?.description ?? '',
        amountReais: a.amountCents / 100,
        category: a.category,
        date: tx?.date,
        anomalyScore: a.anomalyScore,
        severity: a.anomalyScore >= 0.85 ? 'HIGH' : a.anomalyScore >= 0.75 ? 'MEDIUM' : 'LOW',
        reason: a.reason,
      };
    });

    return {
      anomalies: enriched,
      totalAnalyzed: recent.length,
      historicalBaseline: historical.length,
      analyzedAt: new Date().toISOString(),
      engine: 'IsolationForest (100 trees, ANOMALY_THRESHOLD=0.6)',
    };
  });
}
