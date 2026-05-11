/**
 * DebtService
 * ───────────
 * All business rules for debts live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as DebtRepository from '../repositories/DebtRepository.js';
import { toCents } from '../../../shared/currency.js';
import { withJitter } from '../../../shared/cache-utils.js';
import type { Prisma } from '@prisma/client';

const BASE_CACHE_TTL = 300_000;

export interface CreateDebtInput {
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  dueDate?: string | null;
  category: string;
}

export interface UpdateDebtInput {
  name?: string;
  balance?: number;
  interestRate?: number;
  minPayment?: number;
  dueDate?: string | null;
  category?: string;
}

export async function listDebts(userId: string, query: { page: number; limit: number }) {
  const { page, limit } = query;
  const cacheKey = DebtRepository.debtListCacheKey(userId, page, limit);

  const cached = await getCacheValue(cacheKey);
  if (cached) return cached;

  const result = await DebtRepository.findManyPaginated({ userId, page, limit });
  await setCacheValue(cacheKey, result, withJitter(BASE_CACHE_TTL));

  return result;
}

export async function getDebt(id: string, userId: string) {
  return DebtRepository.findOne(id, userId);
}

export async function createDebt(userId: string, input: CreateDebtInput, tx?: Prisma.TransactionClient) {
  const data: DebtRepository.DebtCreateData = {
    userId,
    name: input.name,
    balance: toCents(input.balance),
    interestRate: input.interestRate,
    minPayment: toCents(input.minPayment),
    dueDate: input.dueDate ? new Date(input.dueDate.includes('T') ? input.dueDate : `${input.dueDate}T12:00:00Z`) : null,
    category: input.category,
  };

  const debt = await DebtRepository.createOne(data, tx);
  if (!tx) await DebtRepository.invalidateDebtCache(userId);
  return debt;
}

export async function createManyDebts(userId: string, data: DebtRepository.DebtCreateData[], tx?: Prisma.TransactionClient) {
  const result = await DebtRepository.createMany(data, tx);
  if (!tx) await DebtRepository.invalidateDebtCache(userId);
  return result;
}

export async function updateDebt(id: string, userId: string, input: UpdateDebtInput, tx?: Prisma.TransactionClient) {
  const existing = await DebtRepository.findOne(id, userId);
  if (!existing) return null;

  const data: DebtRepository.DebtUpdateData = {
    name: input.name,
    interestRate: input.interestRate,
    category: input.category,
    ...(input.balance !== undefined ? { balance: toCents(input.balance) } : {}),
    ...(input.minPayment !== undefined ? { minPayment: toCents(input.minPayment) } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate.includes('T') ? input.dueDate : `${input.dueDate}T12:00:00Z`) : null } : {}),
  };

  const debt = await DebtRepository.updateOne(id, userId, data, tx);
  if (!tx) await DebtRepository.invalidateDebtCache(userId);
  return debt;
}

export async function deleteDebt(id: string, userId: string, tx?: Prisma.TransactionClient) {
  const success = await DebtRepository.softDeleteOne(id, userId, tx);
  if (success && !tx) {
    await DebtRepository.invalidateDebtCache(userId);
  }
  return success;
}
