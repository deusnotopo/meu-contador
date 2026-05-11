/**
 * InvestmentRepository
 * ────────────────────
 * Single place for all Prisma queries on Investment, Dividend and InvestmentSale.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix } from '../lib/cache.js';
import type { Prisma } from '@prisma/client';

export interface InvestmentFindManyOptions {
  userId: string;
  page: number;
  limit: number;
}

export interface InvestmentCreateData {
  userId: string;
  name: string;
  ticker: string;
  type: string;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  currency?: string;
  sector?: string;
}

export interface InvestmentUpdateData {
  name?: string;
  ticker?: string;
  type?: string;
  amount?: number;
  averagePrice?: number;
  currentPrice?: number;
  currency?: string;
  sector?: string;
}

export interface DividendCreateData {
  investmentId: string;
  amount: number;
  date: Date;
  type: string;
}

export interface SaleCreateData {
  investmentId: string;
  userId: string;
  ticker: string;
  amount: number;
  price: number;
  totalValue: number;
  date: Date;
  currency: string;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function investmentListCacheKey(userId: string, page: number, limit: number) {
  return `investments:list:${userId}:${page}:${limit}`;
}

export async function invalidateInvestmentCache(userId: string) {
  await deleteCacheByPrefix(`investments:list:${userId}:`);
}

// ── Mapping Helpers ───────────────────────────────────────────────────────────

function formatDividend<T extends { amount: number }>(dividend: T): T {
  return {
    ...dividend,
    amount: dividend.amount / 100,
  } as T;
}

function formatSale<T extends { price: number; totalValue: number }>(sale: T): T {
  return {
    ...sale,
    price: sale.price / 100,
    totalValue: sale.totalValue / 100,
  } as T;
}

function formatInvestment<T extends { averagePrice: number; currentPrice: number; dividends?: { amount: number }[]; sales?: { price: number; totalValue: number }[] }>(investment: T): T {
  return {
    ...investment,
    averagePrice: investment.averagePrice / 100,
    currentPrice: investment.currentPrice / 100,
    ...(investment.dividends ? { dividends: investment.dividends.map(formatDividend) } : {}),
    ...(investment.sales ? { sales: investment.sales.map(formatSale) } : {}),
  } as T;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findManyPaginated(opts: InvestmentFindManyOptions) {
  const { userId, page, limit } = opts;
  const where = { userId, deletedAt: null };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.investment.findMany({
      where,
      include: { dividends: true, sales: true },
      skip,
      take: limit,
      orderBy: { lastUpdate: 'desc' },
    }),
    db.investment.count({ where }),
  ]);

  return {
    items: items.map(formatInvestment),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findOne(id: string, userId: string) {
  const investment = await db.investment.findFirst({
    where: { id, userId, deletedAt: null },
    include: { dividends: true, sales: true },
  });
  return investment ? formatInvestment(investment) : null;
}

export async function createOne(data: InvestmentCreateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const investment = await client.investment.create({ data });
  return formatInvestment(investment);
}

export async function createMany(data: InvestmentCreateData[], tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.investment.createMany({ data });
}

export async function updateOne(id: string, userId: string, data: InvestmentUpdateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const investment = await client.investment.update({
    where: { id, userId },
    data,
  });
  return formatInvestment(investment);
}

export async function softDeleteOne(id: string, userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
  const client = tx || db;
  const result = await client.investment.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

// ── Dividend Queries ──────────────────────────────────────────────────────────

export async function createDividend(data: DividendCreateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const dividend = await client.dividend.create({ data });
  return formatDividend(dividend);
}

export async function deleteDividend(id: string, investmentId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
  const client = tx || db;
  const result = await client.dividend.deleteMany({
    where: { id, investmentId },
  });
  return result.count > 0;
}

// ── Sale Queries ──────────────────────────────────────────────────────────────

/**
 * Atomic transaction to record an investment sale and update the investment quantity.
 */
export async function createSaleAndUpdateInvestment(saleData: SaleCreateData, newQuantity: number, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  
  // If we already have a transaction context, use it directly without $transaction wrapper
  if (tx) {
    const sale = await client.investmentSale.create({ data: saleData });
    await client.investment.update({
      where: { id: saleData.investmentId },
      data: { amount: newQuantity },
    });
    return formatSale(sale);
  }

  // Otherwise, create a new internal transaction
  const [sale] = await db.$transaction([
    db.investmentSale.create({ data: saleData }),
    db.investment.update({
      where: { id: saleData.investmentId },
      data: { amount: newQuantity },
    }),
  ]);
  return formatSale(sale);
}
