/**
 * TransactionRepository
 * ─────────────────────
 * Single place for all Prisma queries on the Transaction model.
 * Routes and Services MUST NOT import `db` directly — use this instead.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix, getCacheValue, setCacheValue } from '../lib/cache.js';

export interface TransactionFindManyOptions {
  userId: string;
  scope?: 'personal' | 'business';
  page: number;
  limit: number;
}

export interface TransactionCursorOptions {
  userId: string;
  scope?: 'personal' | 'business';
  cursor?: string;
  limit: number;
}

export interface TransactionCreateData {
  userId: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  scope: 'personal' | 'business';
  paymentMethod?: string;
  notes?: string;
  recurring?: boolean;
  recurrenceInterval?: string;
  classification?: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  receiptUrl?: string;
  mood?: string;
  motivation?: string;
}

export interface TransactionUpdateData {
  description?: string;
  category?: string;
  amount?: number;
  type?: string;
  date?: Date;
  scope?: string;
  paymentMethod?: string;
  notes?: string;
  recurring?: boolean;
  recurrenceInterval?: string;
  classification?: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  receiptUrl?: string;
  mood?: string;
  motivation?: string;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

const CACHE_TTL = 300_000; // 5 minutes

function listCacheKey(userId: string, scope: string, page: number, limit: number) {
  return `transactions:list:${userId}:${scope}:${page}:${limit}`;
}

export async function invalidateTransactionCache(userId: string) {
  await deleteCacheByPrefix(`transactions:list:${userId}:`);
}

export async function invalidateBudgetCache(userId: string) {
  await deleteCacheByPrefix(`budgets:list:${userId}:`);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findManyPaginated(opts: TransactionFindManyOptions) {
  const { userId, scope, page, limit } = opts;
  const cacheKey = listCacheKey(userId, scope ?? 'all', page, limit);

  const cached = await getCacheValue(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof _queryPaginated>>;

  const result = await _queryPaginated(opts);
  await setCacheValue(cacheKey, result, CACHE_TTL);
  return result;
}

async function _queryPaginated({ userId, scope, page, limit }: TransactionFindManyOptions) {
  const where = { userId, deletedAt: null, ...(scope ? { scope } : {}) };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.transaction.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
    db.transaction.count({ where }),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findOneBelongingTo(id: string, userId: string) {
  return db.transaction.findFirst({ where: { id, userId, deletedAt: null } });
}

export async function createOne(data: TransactionCreateData) {
  return db.transaction.create({ data });
}

export async function updateOne(id: string, data: TransactionUpdateData) {
  return db.transaction.update({ where: { id }, data });
}

export async function softDeleteOne(id: string, userId: string): Promise<boolean> {
  const result = await db.transaction.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

export async function findCursor(opts: TransactionCursorOptions) {
  const { userId, scope, cursor, limit } = opts;
  const where: Record<string, unknown> = {
    userId,
    deletedAt: null,
    ...(scope ? { scope } : {}),
    ...(cursor ? { id: { lt: cursor } } : {}),
  };

  const items = await db.transaction.findMany({
    where,
    orderBy: { id: 'desc' },
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;

  return {
    items: data,
    nextCursor: hasMore ? data[data.length - 1]!.id : null,
    hasMore,
  };
}
