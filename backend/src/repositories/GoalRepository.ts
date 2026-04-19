/**
 * GoalRepository
 * ──────────────
 * Single place for all Prisma queries on the SavingsGoal model.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix, getCacheValue, setCacheValue } from '../lib/cache.js';

export interface GoalFindManyOptions {
  userId: string;
  page: number;
  limit: number;
}

export interface GoalCreateData {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  icon?: string;
  color?: string;
}

export interface GoalUpdateData {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: Date;
  icon?: string;
  color?: string;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function goalListCacheKey(userId: string, page: number, limit: number) {
  return `goals:list:${userId}:${page}:${limit}`;
}

export async function invalidateGoalCache(userId: string) {
  await deleteCacheByPrefix(`goals:list:${userId}:`);
}

// ── Mapping Helper ────────────────────────────────────────────────────────────

function formatGoal<T extends { targetAmount: number; currentAmount: number }>(goal: T): T {
  return {
    ...goal,
    targetAmount: goal.targetAmount / 100,
    currentAmount: goal.currentAmount / 100,
  } as T;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findManyPaginated(opts: GoalFindManyOptions) {
  const { userId, page, limit } = opts;
  const where = { userId, deletedAt: null };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.savingsGoal.findMany({ where, skip, take: limit, orderBy: { deadline: 'asc' } }),
    db.savingsGoal.count({ where }),
  ]);

  return {
    items: items.map(formatGoal),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findOne(id: string, userId: string) {
  const goal = await db.savingsGoal.findFirst({ where: { id, userId, deletedAt: null } });
  return goal ? formatGoal(goal) : null;
}

export async function createOne(data: GoalCreateData, tx?: any) {
  const client = tx || db;
  const goal = await client.savingsGoal.create({ data });
  return formatGoal(goal);
}

export async function createMany(data: GoalCreateData[], tx?: any) {
  const client = tx || db;
  return client.savingsGoal.createMany({ data });
}

export async function updateOne(id: string, userId: string, data: GoalUpdateData, tx?: any) {
  const client = tx || db;
  const goal = await client.savingsGoal.update({
    where: { id, userId },
    data,
  });
  return formatGoal(goal);
}

export async function softDeleteOne(id: string, userId: string, tx?: any): Promise<boolean> {
  const client = tx || db;
  const result = await client.savingsGoal.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
