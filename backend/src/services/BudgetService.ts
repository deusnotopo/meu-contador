/**
 * BudgetService
 * ─────────────
 * All business rules for budgets live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as BudgetRepository from '../repositories/BudgetRepository.js';
import { toCents, fromCents } from '../../../shared/currency.js';
import { withJitter } from '../../../shared/cache-utils.js';

const BASE_CACHE_TTL = 300_000; // 5 minutes base

export interface CreateBudgetInput {
  category: string;
  limit: number;
  month: string;
}

export interface UpdateBudgetInput {
  limit: number;
}

/**
 * Hydrates a list of budgets with their 'spent' amount from transactions.
 * Note: 'spent' is returned in dollars/float for the API response.
 */
async function hydrateBudgetsSpent(userId: string, budgets: any[]) {
  return Promise.all(
    budgets.map(async (budget) => {
      const spentCents = await BudgetRepository.getBudgetSpent(userId, budget.category, budget.month);
      return {
        ...budget,
        limit: fromCents(budget.limit),
        spent: fromCents(spentCents),
      };
    })
  );
}

export async function listBudgets(userId: string, query: { page: number; limit: number; month?: string }) {
  const { page, limit, month } = query;
  const cacheKey = BudgetRepository.budgetListCacheKey(userId, month, page, limit);
  
  const cachedResult = await getCacheValue(cacheKey);
  if (cachedResult) return cachedResult;

  const { items, total, totalPages } = await BudgetRepository.findManyPaginated({ userId, month, page, limit });
  
  const hydratedItems = await hydrateBudgetsSpent(userId, items);
  
  const result = { items: hydratedItems, page, limit, total, totalPages };
  await setCacheValue(cacheKey, result, withJitter(BASE_CACHE_TTL));
  
  return result;
}

export async function getBudget(id: string, userId: string) {
  const budget = await BudgetRepository.findOne(id, userId);
  if (!budget) return null;

  const spentCents = await BudgetRepository.getBudgetSpent(userId, budget.category, budget.month);
  return {
    ...budget,
    limit: fromCents(budget.limit),
    spent: fromCents(spentCents),
  };
}

export async function createBudget(userId: string, input: CreateBudgetInput, tx?: any) {
  const data = {
    userId,
    category: input.category,
    limit: toCents(input.limit),
    month: input.month,
  };

  const budget = await BudgetRepository.createOne(data, tx);
  
  if (!tx) {
    await BudgetRepository.invalidateBudgetCache(userId);
    // Hydrate spent for single return
    const spentCents = await BudgetRepository.getBudgetSpent(userId, budget.category, budget.month);
    return {
      ...budget,
      limit: fromCents(budget.limit),
      spent: fromCents(spentCents),
    };
  }

  return budget;
}

export async function createManyBudgets(userId: string, data: any[], tx?: any) {
  const result = await BudgetRepository.createMany(data, tx);
  if (!tx) await BudgetRepository.invalidateBudgetCache(userId);
  return result;
}

export async function updateBudget(id: string, userId: string, input: UpdateBudgetInput, tx?: any) {
  const data = {
    limit: Math.round(input.limit * 100), // Scale to cents
  };

  const budget = await BudgetRepository.updateOne(id, userId, data, tx);
  
  if (!tx) {
    await BudgetRepository.invalidateBudgetCache(userId);
    // Hydrate spent for single return
    const spentCents = await BudgetRepository.getBudgetSpent(userId, budget.category, budget.month);
    return {
      ...budget,
      limit: budget.limit / 100,
      spent: spentCents / 100,
    };
  }

  return budget;
}

export async function deleteBudget(id: string, userId: string, tx?: any) {
  const deleted = await BudgetRepository.softDeleteOne(id, userId, tx);
  if (deleted && !tx) {
    await BudgetRepository.invalidateBudgetCache(userId);
  }
  return deleted;
}
