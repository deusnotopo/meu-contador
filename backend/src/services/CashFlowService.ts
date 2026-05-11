/**
 * CashFlowService
 * ───────────────
 * Handles pattern detection and future projections.
 */

import { db } from '../lib/db.js';

export interface RecurringItem {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dueDay: number;
}

/** 
 * Detects recurring transactions from the past 3-6 months.
 * Patterns are identified by matching normalized description + type.
 */
export async function detectRecurring(userId: string): Promise<RecurringItem[]> {
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
        amount: avgAmount, // Keep in cents for internal math
        type: data.type,
        category: data.category,
        dueDay: avgDay,
      });
    }
  }

  return recurring.sort((a, b) => a.dueDay - b.dueDay);
}

export async function getProjection(userId: string, days: number, scope: string) {
  // 1. Current Balance (Last 6 months)
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const txs = await db.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      date: { gte: since },
      ...(scope !== 'all' ? { scope } : {}),
    },
    select: { amount: true, type: true },
  });

  const currentBalance = txs.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + Number(tx.amount) : acc - Number(tx.amount);
  }, 0);

  // 2. Data for projection
  const [recurring, reminders, goals] = await Promise.all([
    detectRecurring(userId),
    db.billReminder.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      },
      select: { name: true, amount: true, dueDate: true, category: true },
    }),
    db.savingsGoal.findMany({
      where: { userId, deletedAt: null },
      select: { name: true, targetAmount: true, currentAmount: true, deadline: true },
    })
  ]);

  // 3. Build Projection
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
    const isoDate = date.toISOString().split('T')[0]!;

    interface CashFlowItem { description: string; amount: number; category: string }
    const inflows: CashFlowItem[] = [];
    const outflows: CashFlowItem[] = [];

    // Recurring
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
    for (const rem of reminders) {
      const remDate = rem.dueDate instanceof Date 
        ? rem.dueDate.toISOString().split('T')[0] 
        : String(rem.dueDate).split('T')[0];
      if (remDate === isoDate) {
        outflows.push({ description: rem.name, amount: Number(rem.amount), category: rem.category });
      }
    }

    // Goals on 1st — use estimated monthly contribution, not full remaining
    if (dayOfMonth === 1) {
      for (const goal of goals) {
        const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
        if (remaining > 0) {
          const monthsLeft = Math.max(
            1,
            Math.round((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
          );
          // Monthly contribution = remaining / monthsLeft, capped at R$2.000 (200_000 cents)
          const monthlyContribution = Math.min(200_000, Math.round(remaining / monthsLeft));
          outflows.push({
            description: `Meta: ${goal.name}`,
            amount: monthlyContribution, // in cents
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
      inflows: inflows.map(i => ({ ...i, amount: i.amount / 100 })),
      outflows: outflows.map(o => ({ ...o, amount: o.amount / 100 })),
      netFlow: (totalIn - totalOut) / 100,
      projectedBalance: runningBalance / 100,
      isCritical: runningBalance < 0,
      isToday: i === 0,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  // Summary Metrics
  const totalInflows = projection.reduce((s, d) => s + d.inflows.reduce((a, x) => a + x.amount, 0), 0);
  const totalOutflows = projection.reduce((s, d) => s + d.outflows.reduce((a, x) => a + x.amount, 0), 0);
  const committedNext7 = projection.slice(0, 7).reduce((s, d) => s + d.outflows.reduce((a, x) => a + x.amount, 0), 0);
  const criticalDays = projection.filter(d => d.isCritical).length;
  const avgDailyFlow = (totalInflows - totalOutflows) / days;

  return {
    projection,
    recurring: recurring.map(r => ({ ...r, amount: r.amount / 100 })),
    summary: {
      currentBalance: currentBalance / 100,
      projectedBalanceEnd: runningBalance / 100,
      totalInflows,
      totalOutflows,
      criticalDays,
      averageDailyFlow: avgDailyFlow,
      safeToSpend: Math.max(0, (currentBalance / 100) - committedNext7),
      committedNext7Days: committedNext7,
      burnRate: avgDailyFlow < 0 && currentBalance > 0
        ? Math.floor((currentBalance / 100) / Math.abs(avgDailyFlow))
        : null,
    },
  };
}
