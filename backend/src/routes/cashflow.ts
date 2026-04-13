import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecurringItem {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dueDay: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Detects recurring transactions from the past 3 months by matching description+type */
async function detectRecurring(userId: string): Promise<RecurringItem[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const txs = await db.transaction.findMany({
    where: { userId, deletedAt: null, date: { gte: since } },
    select: { description: true, amount: true, type: true, category: true, date: true },
    orderBy: { date: 'asc' },
  });

  const map = new Map<string, { amounts: number[]; type: 'income'|'expense'; category: string; days: number[] }>();

  for (const tx of txs) {
    const key = `${tx.type}::${tx.description.toLowerCase().trim()}`;
    const day = new Date(tx.date).getDate();
    const existing = map.get(key);
    if (existing) {
      existing.amounts.push(Number(tx.amount));
      existing.days.push(day);
    } else {
      map.set(key, {
        amounts: [Number(tx.amount)],
        type: tx.type as 'income' | 'expense',
        category: tx.category,
        days: [day],
      });
    }
  }

  const recurring: RecurringItem[] = [];
  for (const [key, data] of map.entries()) {
    if (data.amounts.length >= 2) {
      const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
      const avgDay = Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length);
      recurring.push({
        description: key.split('::')[1]!.charAt(0).toUpperCase() + key.split('::')[1]!.slice(1),
        amount: Math.round(avgAmount * 100) / 100,
        type: data.type,
        category: data.category,
        dueDay: avgDay,
      });
    }
  }

  return recurring.sort((a, b) => a.dueDay - b.dueDay);
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function cashflowRoutes(app: FastifyInstance) {

  // GET /cashflow/projection — 30-day cash flow projection (server-side)
  app.get('/cashflow/projection', {
    schema: {
      description: 'Projeção de fluxo de caixa para os próximos N dias',
      tags: ['CashFlow'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        days: z.coerce.number().int().min(7).max(90).default(30),
        scope: z.enum(['personal', 'business', 'all']).default('personal'),
      }),
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { days, scope } = request.query as { days: number; scope: string };
    const userId = request.user.id;

    // Get current balance from recent transactions
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    const txs = await db.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { gte: since },
        ...(scope !== 'all' ? { scope } : {}),
      },
      select: { amount: true, type: true, date: true },
    });

    const currentBalance = txs.reduce((acc, tx) => {
      return tx.type === 'income' ? acc + Number(tx.amount) : acc - Number(tx.amount);
    }, 0);

    // Detect recurring items
    const recurring = await detectRecurring(userId);

    // Get upcoming reminders
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);

    const reminders = await db.billReminder.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { lte: nextDate.toISOString().split('T')[0] },
      },
      select: { name: true, amount: true, dueDate: true, category: true },
    });

    // Get active goals (monthly contribution)
    const goals = await db.savingsGoal.findMany({
      where: { userId },
      select: { name: true, targetAmount: true, currentAmount: true },
    });

    // Build day-by-day projection
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let runningBalance = currentBalance;
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const projection = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfMonth = date.getDate();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      const inflows: { description: string; amount: number; category: string }[] = [];
      const outflows: { description: string; amount: number; category: string }[] = [];

      // Recurring items
      for (const r of recurring) {
        if (r.dueDay === dayOfMonth) {
          (r.type === 'income' ? inflows : outflows).push({
            description: r.description,
            amount: r.amount,
            category: r.category,
          });
        }
      }

      // Reminders
      const isoDate = date.toISOString().split('T')[0]!;
      for (const rem of reminders) {
        const remDate = rem.dueDate instanceof Date
          ? rem.dueDate.toISOString().split('T')[0]
          : String(rem.dueDate).split('T')[0];
        if (remDate === isoDate) {
          outflows.push({ description: rem.name, amount: Number(rem.amount), category: rem.category });
        }
      }

      // Goal contributions on 1st
      if (dayOfMonth === 1) {
        for (const goal of goals) {
          const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
          if (remaining > 0) {
            outflows.push({
              description: `Meta: ${goal.name}`,
              amount: Math.min(remaining, 500),
              category: 'Metas',
            });
          }
        }
      }

      const totalIn = inflows.reduce((s, x) => s + x.amount, 0);
      const totalOut = outflows.reduce((s, x) => s + x.amount, 0);
      runningBalance += totalIn - totalOut;

      projection.push({
        date: isoDate,
        dateFormatted: `${dayOfMonth} ${months[date.getMonth()]}`,
        weekday: weekdays[date.getDay()],
        inflows,
        outflows,
        netFlow: Math.round((totalIn - totalOut) * 100) / 100,
        projectedBalance: Math.round(runningBalance * 100) / 100,
        isCritical: runningBalance < 0,
        isToday: i === 0,
        isWeekend,
      });
    }

    // Summary
    const totalInflows = projection.reduce((s, d) => s + d.inflows.reduce((a, x) => a + x.amount, 0), 0);
    const totalOutflows = projection.reduce((s, d) => s + d.outflows.reduce((a, x) => a + x.amount, 0), 0);
    const criticalDays = projection.filter(d => d.isCritical).length;
    const avgDailyFlow = (totalInflows - totalOutflows) / days;
    const committedNext7 = projection.slice(0, 7).reduce((s, d) => s + d.outflows.reduce((a, x) => a + x.amount, 0), 0);

    return {
      projection,
      recurring,
      summary: {
        currentBalance: Math.round(currentBalance * 100) / 100,
        projectedBalanceEnd: Math.round(runningBalance * 100) / 100,
        totalInflows: Math.round(totalInflows * 100) / 100,
        totalOutflows: Math.round(totalOutflows * 100) / 100,
        criticalDays,
        averageDailyFlow: Math.round(avgDailyFlow * 100) / 100,
        safeToSpend: Math.max(0, Math.round((currentBalance - committedNext7) * 100) / 100),
        committedNext7Days: Math.round(committedNext7 * 100) / 100,
        burnRate: avgDailyFlow < 0 && currentBalance > 0
          ? Math.floor(currentBalance / Math.abs(avgDailyFlow))
          : null,
      },
    };
  });

  // GET /cashflow/recurring — lista recorrentes detectados
  app.get('/cashflow/recurring', {
    schema: {
      description: 'Lista transações recorrentes detectadas',
      tags: ['CashFlow'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const recurring = await detectRecurring(request.user.id);
    return { recurring };
  });
}
