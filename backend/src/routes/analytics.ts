import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

// ── Helpers ────────────────────────────────────────────────────────────────

function parseUserBlob(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  try { return JSON.parse(raw as string); } catch { return {}; }
}

async function readHealthData(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { gamificationData: true } });
  const blob = parseUserBlob(user?.gamificationData);
  return (blob.healthScoreHistory as HealthEntry[] | undefined) ?? [];
}

interface HealthEntry {
  date: string;  // ISO date yyyy-mm-dd
  score: number;
}

// ── Routes ─────────────────────────────────────────────────────────────────

export async function analyticsRoutes(app: FastifyInstance) {

  // POST /analytics/health-score — persiste snapshot diário do score
  app.post('/analytics/health-score', {
    schema: {
      description: 'Persiste o score de saúde financeira do dia',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        score: z.number().int().min(0).max(100),
        date: z.string().optional(), // default: today
      }),
      response: {
        200: z.object({ success: z.boolean(), history: z.array(z.object({ date: z.string(), score: z.number() })) }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { score, date } = request.body as { score: number; date?: string };
    const entryDate = date ?? new Date().toISOString().slice(0, 10);
    const userId = request.user.id;

    const user = await db.user.findUnique({ where: { id: userId }, select: { gamificationData: true } });
    const blob = parseUserBlob(user?.gamificationData);
    const history: HealthEntry[] = (blob.healthScoreHistory as HealthEntry[] | undefined) ?? [];

    // Upsert: se já existe entrada para o dia, atualiza
    const idx = history.findIndex(h => h.date === entryDate);
    if (idx >= 0) {
      history[idx]!.score = score;
    } else {
      history.push({ date: entryDate, score });
    }

    // Mantém só os últimos 90 dias
    const trimmed = history
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90);

    await db.user.update({
      where: { id: userId },
      data: { gamificationData: JSON.stringify({ ...blob, healthScoreHistory: trimmed }) },
    });

    return { success: true, history: trimmed };
  });

  // GET /analytics/health-score — retorna histórico
  app.get('/analytics/health-score', {
    schema: {
      description: 'Retorna histórico de score de saúde financeira',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ history: z.array(z.object({ date: z.string(), score: z.number() })) }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const history = await readHealthData(request.user.id);
    return { history };
  });

  // GET /analytics/summary — agregação server-side das transações
  app.get('/analytics/summary', {
    schema: {
      description: 'Sumariza transações por período e categoria',
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
    preHandler: [app.authenticate],
  }, async (request) => {
    const { months, scope } = request.query as { months: number; scope: string };
    const userId = request.user.id;
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const txs = await db.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { gte: since },
        ...(scope !== 'all' ? { scope } : {}),
      },
      select: { amount: true, type: true, category: true, date: true },
      orderBy: { date: 'asc' },
    });

    // Monthly aggregation
    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const tx of txs) {
      const key = tx.date.toISOString().slice(0, 7);
      const entry = monthMap.get(key) ?? { income: 0, expense: 0 };
      if (tx.type === 'income') entry.income += Number(tx.amount);
      else entry.expense += Number(tx.amount);
      monthMap.set(key, entry);
    }

    const monthly = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { income, expense }]) => ({
        month,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        balance: Math.round((income - expense) * 100) / 100,
      }));

    // Category aggregation (expenses only)
    const catMap = new Map<string, { total: number; count: number }>();
    for (const tx of txs.filter(t => t.type === 'expense')) {
      const entry = catMap.get(tx.category) ?? { total: 0, count: 0 };
      entry.total += Number(tx.amount);
      entry.count++;
      catMap.set(tx.category, entry);
    }

    const byCategory = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([category, { total, count }]) => ({
        category,
        total: Math.round(total * 100) / 100,
        count,
      }));

    const totals = txs.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.income += Number(tx.amount);
        else acc.expense += Number(tx.amount);
        acc.transactionCount++;
        return acc;
      },
      { income: 0, expense: 0, balance: 0, transactionCount: 0 }
    );
    totals.balance = Math.round((totals.income - totals.expense) * 100) / 100;
    totals.income = Math.round(totals.income * 100) / 100;
    totals.expense = Math.round(totals.expense * 100) / 100;

    return { monthly, byCategory, totals };
  });
}
