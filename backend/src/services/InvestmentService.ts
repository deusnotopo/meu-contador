/**
 * InvestmentService
 * ─────────────────
 * All business rules for investments live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as InvestmentRepository from '../repositories/InvestmentRepository.js';
import { toCents } from '../../../shared/currency.js';
import { withJitter } from '../../../shared/cache-utils.js';
import type { Prisma } from '@prisma/client';

const BASE_CACHE_TTL = 300_000;

export interface CreateInvestmentInput {
  name: string;
  ticker: string;
  type: string;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  currency?: string;
  sector?: string;
}

export interface UpdateInvestmentInput {
  name?: string;
  ticker?: string;
  type?: string;
  amount?: number;
  averagePrice?: number;
  currentPrice?: number;
  currency?: string;
  sector?: string;
}

export interface DividendInput {
  amount: number;
  date: string;
  type: string;
}

export interface SaleInput {
  amount: number; // Quantity to sell
  price: number;
  date: string;
}

export async function listInvestments(userId: string, query: { page: number; limit: number }) {
  const { page, limit } = query;
  const cacheKey = InvestmentRepository.investmentListCacheKey(userId, page, limit);

  const cached = await getCacheValue(cacheKey);
  if (cached) return cached;

  const result = await InvestmentRepository.findManyPaginated({ userId, page, limit });
  await setCacheValue(cacheKey, result, withJitter(BASE_CACHE_TTL));

  return result;
}

export async function getInvestment(id: string, userId: string) {
  return InvestmentRepository.findOne(id, userId);
}

export async function createInvestment(userId: string, input: CreateInvestmentInput, tx?: Prisma.TransactionClient) {
  const data: InvestmentRepository.InvestmentCreateData = {
    userId,
    name: input.name,
    ticker: input.ticker,
    type: input.type,
    amount: input.amount,
    averagePrice: toCents(input.averagePrice),
    currentPrice: toCents(input.currentPrice),
    currency: input.currency,
    sector: input.sector,
  };

  const investment = await InvestmentRepository.createOne(data, tx);
  if (!tx) await InvestmentRepository.invalidateInvestmentCache(userId);
  return investment;
}

export async function createManyInvestments(userId: string, data: InvestmentRepository.InvestmentCreateData[], tx?: Prisma.TransactionClient) {
  const result = await InvestmentRepository.createMany(data, tx);
  if (!tx) await InvestmentRepository.invalidateInvestmentCache(userId);
  return result;
}

export async function updateInvestment(id: string, userId: string, input: UpdateInvestmentInput, tx?: Prisma.TransactionClient) {
  const existing = await InvestmentRepository.findOne(id, userId);
  if (!existing) return null;

  const data: InvestmentRepository.InvestmentUpdateData = {
    name: input.name,
    ticker: input.ticker,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    sector: input.sector,
    ...(input.averagePrice !== undefined ? { averagePrice: toCents(input.averagePrice) } : {}),
    ...(input.currentPrice !== undefined ? { currentPrice: toCents(input.currentPrice) } : {}),
  };

  const investment = await InvestmentRepository.updateOne(id, userId, data, tx);
  if (!tx) await InvestmentRepository.invalidateInvestmentCache(userId);
  return investment;
}

export async function deleteInvestment(id: string, userId: string, tx?: Prisma.TransactionClient) {
  const success = await InvestmentRepository.softDeleteOne(id, userId, tx);
  if (success && !tx) {
    await InvestmentRepository.invalidateInvestmentCache(userId);
  }
  return success;
}

// ── Dividend Operations ───────────────────────────────────────────────────────

export async function addDividend(investmentId: string, userId: string, input: DividendInput, tx?: Prisma.TransactionClient) {
  const investment = await InvestmentRepository.findOne(investmentId, userId);
  if (!investment) return null;

  const data: InvestmentRepository.DividendCreateData = {
    investmentId,
    amount: toCents(input.amount),
    date: new Date(input.date.includes('T') ? input.date : `${input.date}T12:00:00Z`),
    type: input.type,
  };

  const dividend = await InvestmentRepository.createDividend(data, tx);
  if (!tx) await InvestmentRepository.invalidateInvestmentCache(userId);
  return dividend;
}

export async function removeDividend(investmentId: string, userId: string, dividendId: string, tx?: Prisma.TransactionClient) {
  const investment = await InvestmentRepository.findOne(investmentId, userId);
  if (!investment) return false;

  const success = await InvestmentRepository.deleteDividend(dividendId, investmentId, tx);
  if (success && !tx) {
    await InvestmentRepository.invalidateInvestmentCache(userId);
  }
  return success;
}

// ── Sale Operations ───────────────────────────────────────────────────────────

export async function recordSale(investmentId: string, userId: string, input: SaleInput, tx?: Prisma.TransactionClient) {
  const investment = await InvestmentRepository.findOne(investmentId, userId);
  if (!investment) return { error: 'NOT_FOUND' };

  if (investment.amount < input.amount) {
    return { error: 'INSUFFICIENT_QUANTITY' };
  }

  const priceInCents = toCents(input.price);
  const saleData: InvestmentRepository.SaleCreateData = {
    investmentId,
    userId,
    ticker: investment.ticker,
    amount: input.amount,
    price: priceInCents,
    totalValue: Math.round(input.amount * priceInCents),
    date: new Date(input.date.includes('T') ? input.date : `${input.date}T12:00:00Z`),
    currency: investment.currency || 'BRL',
  };

  const newQuantity = investment.amount - input.amount;
  const sale = await InvestmentRepository.createSaleAndUpdateInvestment(saleData, newQuantity, tx);
  
  if (!tx) await InvestmentRepository.invalidateInvestmentCache(userId);
  
  return { sale };
}
