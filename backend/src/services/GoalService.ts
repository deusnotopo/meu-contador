/**
 * GoalService
 * ───────────
 * All business rules for goals live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as GoalRepository from '../repositories/GoalRepository.js';
import { toCents } from '../../../shared/currency.js';
import { withJitter } from '../../../shared/cache-utils.js';
import type { Prisma } from '@prisma/client';

const BASE_CACHE_TTL = 300_000;

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon?: string;
  color?: string;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export async function listGoals(userId: string, query: { page: number; limit: number }) {
  const { page, limit } = query;
  const cacheKey = GoalRepository.goalListCacheKey(userId, page, limit);

  const cached = await getCacheValue(cacheKey);
  if (cached) return cached;

  const result = await GoalRepository.findManyPaginated({ userId, page, limit });
  await setCacheValue(cacheKey, result, withJitter(BASE_CACHE_TTL));

  return result;
}

export async function getGoal(id: string, userId: string) {
  return GoalRepository.findOne(id, userId);
}

export async function createGoal(userId: string, input: CreateGoalInput, tx?: Prisma.TransactionClient) {
  const data: GoalRepository.GoalCreateData = {
    userId,
    name: input.name,
    targetAmount: toCents(input.targetAmount),
    currentAmount: toCents(input.currentAmount),
    deadline: new Date(input.deadline.includes('T') ? input.deadline : `${input.deadline}T12:00:00Z`),
    icon: input.icon,
    color: input.color,
  };

  const goal = await GoalRepository.createOne(data, tx);
  if (!tx) await GoalRepository.invalidateGoalCache(userId);
  return goal;
}

export async function createManyGoals(userId: string, data: GoalRepository.GoalCreateData[], tx?: Prisma.TransactionClient) {
  const result = await GoalRepository.createMany(data, tx);
  if (!tx) await GoalRepository.invalidateGoalCache(userId);
  return result;
}

export async function updateGoal(id: string, userId: string, input: UpdateGoalInput, tx?: Prisma.TransactionClient) {
  const existing = await GoalRepository.findOne(id, userId);
  if (!existing) return null;

  const data: GoalRepository.GoalUpdateData = {
    name: input.name,
    icon: input.icon,
    color: input.color,
    ...(input.targetAmount !== undefined ? { targetAmount: toCents(input.targetAmount) } : {}),
    ...(input.currentAmount !== undefined ? { currentAmount: toCents(input.currentAmount) } : {}),
    ...(input.deadline ? { deadline: new Date(input.deadline.includes('T') ? input.deadline : `${input.deadline}T12:00:00Z`) } : {}),
  };

  const goal = await GoalRepository.updateOne(id, userId, data, tx);
  if (!tx) await GoalRepository.invalidateGoalCache(userId);
  return goal;
}

export async function deleteGoal(id: string, userId: string, tx?: Prisma.TransactionClient) {
  const success = await GoalRepository.softDeleteOne(id, userId, tx);
  if (success && !tx) {
    await GoalRepository.invalidateGoalCache(userId);
  }
  return success;
}
