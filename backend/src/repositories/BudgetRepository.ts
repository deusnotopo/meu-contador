/**
 * BudgetRepository
 * ────────────────
 * Single place for all Prisma queries on the Budget model.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix, getCacheValue, setCacheValue } from '../lib/cache.js';
import type { Prisma } from '@prisma/client';

export interface BudgetFindManyOptions {
  userId: string;
  month?: string;
  page: number;
  limit: number;
}

export interface BudgetCreateData {
  userId: string;
  category: string;
  limit: number;
  month: string;
}

export interface BudgetUpdateData {
  limit?: number;
}

const CACHE_TTL = 300_000; // 5 minutes

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function budgetListCacheKey(userId: string, month: string | undefined, page: number, limit: number) {
  return `budgets:list:${userId}:${month || 'all'}:${page}:${limit}`;
}

export async function invalidateBudgetCache(userId: string) {
  await deleteCacheByPrefix(`budgets:list:${userId}:`);
}

// Formatação removida do repositório para manter consistência com o banco (cents)
// A conversão para unidades de exibição deve ser feita na camada de Serviço/API.

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findManyPaginated(opts: BudgetFindManyOptions) {
  const { userId, month, page, limit } = opts;
  const where = { userId, deletedAt: null, ...(month ? { month } : {}) };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.budget.findMany({ where, skip, take: limit, orderBy: { month: 'desc' } }),
    db.budget.count({ where }),
  ]);

  return {
    items, // Raw cents
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findOne(id: string, userId: string) {
  return db.budget.findFirst({ where: { id, userId, deletedAt: null } });
}

export async function createOne(data: BudgetCreateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.budget.create({ data });
}

export async function createMany(data: BudgetCreateData[], tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.budget.createMany({ data });
}

export async function updateOne(id: string, userId: string, data: BudgetUpdateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.budget.update({
    where: { id, userId },
    data,
  });
}

export async function softDeleteOne(id: string, userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
  const client = tx || db;
  const result = await client.budget.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Calculates total spent for a specific category and month.
 * Logic: Sum of all non-deleted 'expense' transactions for that user/category/month.
 */
export async function getBudgetSpent(userId: string, category: string, month: string): Promise<number> {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const aggregate = await db.transaction.aggregate({
    where: {
      userId,
      deletedAt: null,
      type: 'expense',
      category: {
        equals: category,
        mode: 'insensitive',
      },
      date: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Note: amount is stored in cents, we return cents here for consistency with the service processing.
  return Math.abs(aggregate._sum.amount ?? 0);
}
