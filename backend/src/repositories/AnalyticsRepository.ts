/**
 * AnalyticsRepository
 * ───────────────────
 * Centralizes complex SQL aggregations for reporting.
 */

import { db } from '../lib/db.js';
import { Prisma } from '@prisma/client';

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getMonthlySummary(userId: string, since: Date, scope?: string) {
  const scopeCondition = scope && scope !== 'all' 
    ? Prisma.sql`AND "scope" = ${scope}` 
    : Prisma.empty;

  // High-Performance Raw SQL for Monthly Aggregation
  const monthlyRaw = await db.$queryRaw<Array<{ month: string, income: number, expense: number }>>`
    SELECT 
      TO_CHAR("date", 'YYYY-MM') as month,
      SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END) as income,
      SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END) as expense
    FROM "Transaction"
    WHERE "userId" = ${userId}
      AND "deletedAt" IS NULL
      AND "date" >= ${since}
      ${scopeCondition}
    GROUP BY TO_CHAR("date", 'YYYY-MM')
    ORDER BY month ASC
  `;

  return monthlyRaw.map(row => ({
    month: row.month,
    income: Number(row.income) / 100,
    expense: Number(row.expense) / 100,
    balance: (Number(row.income) - Number(row.expense)) / 100,
  }));
}

export async function getCategoryBreakdown(userId: string, since: Date, scope?: string) {
  const cats = await db.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      type: 'expense',
      deletedAt: null,
      date: { gte: since },
      ...(scope && scope !== 'all' ? { scope } : {}),
    },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  return cats.map(c => ({
    category: c.category,
    total: Number(c._sum.amount ?? 0) / 100,
    count: c._count._all,
  }));
}

export async function getGlobalTotals(userId: string, since: Date, scope?: string) {
  const globals = await db.transaction.groupBy({
    by: ['type'],
    where: {
      userId,
      deletedAt: null,
      date: { gte: since },
      ...(scope && scope !== 'all' ? { scope } : {}),
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const totals = { income: 0, expense: 0, balance: 0, transactionCount: 0 };
  globals.forEach(g => {
    const amt = Number(g._sum.amount ?? 0) / 100;
    if (g.type === 'income') totals.income = amt;
    if (g.type === 'expense') totals.expense = amt;
    totals.transactionCount += g._count._all;
  });
  totals.balance = totals.income - totals.expense;

  return totals;
}
