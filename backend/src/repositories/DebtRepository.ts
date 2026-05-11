/**
 * DebtRepository
 * ──────────────
 * Single place for all Prisma queries on the Debt model.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix, getCacheValue, setCacheValue } from '../lib/cache.js';
import type { Prisma } from '@prisma/client';

export interface DebtFindManyOptions {
  userId: string;
  page: number;
  limit: number;
}

export interface DebtCreateData {
  userId: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  dueDate?: Date | null;
  category: string;
}

export interface DebtUpdateData {
  name?: string;
  balance?: number;
  interestRate?: number;
  minPayment?: number;
  dueDate?: Date | null;
  category?: string;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function debtListCacheKey(userId: string, page: number, limit: number) {
  return `debts:list:${userId}:${page}:${limit}`;
}

export async function invalidateDebtCache(userId: string) {
  await deleteCacheByPrefix(`debts:list:${userId}:`);
}

// ── Mapping Helper ────────────────────────────────────────────────────────────

function formatDebt<T extends { balance: number; minPayment: number }>(debt: T): T {
  return {
    ...debt,
    balance: debt.balance / 100,
    minPayment: debt.minPayment / 100,
  } as T;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findManyPaginated(opts: DebtFindManyOptions) {
  const { userId, page, limit } = opts;
  const where = { userId, deletedAt: null };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.debt.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    db.debt.count({ where }),
  ]);

  return {
    items: items.map(formatDebt),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findOne(id: string, userId: string) {
  const debt = await db.debt.findFirst({ where: { id, userId, deletedAt: null } });
  return debt ? formatDebt(debt) : null;
}

export async function createOne(data: DebtCreateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const debt = await client.debt.create({ data });
  return formatDebt(debt);
}

export async function createMany(data: DebtCreateData[], tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.debt.createMany({ data });
}

export async function updateOne(id: string, userId: string, data: DebtUpdateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const debt = await client.debt.update({
    where: { id, userId },
    data,
  });
  return formatDebt(debt);
}

export async function softDeleteOne(id: string, userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
  const client = tx || db;
  const result = await client.debt.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
