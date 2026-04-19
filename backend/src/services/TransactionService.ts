/**
 * TransactionService
 * ──────────────────
 * All business rules for transactions live here.
 * This layer knows nothing about HTTP (Fastify) or Prisma.
 * It depends only on the Repository and other pure services.
 */

import { FastifyInstance } from 'fastify';
import { PredictiveEngine } from './ai.js';
import { createAndEmitNotification } from '../routes/notifications.js';
import * as NotificationService from './NotificationService.js';
import {
  findManyPaginated,
  findOneBelongingTo,
  findCursor,
  createOne,
  createMany,
  updateOne,
  softDeleteOne,
  invalidateTransactionCache,
  invalidateBudgetCache,
  type TransactionCreateData,
  type TransactionUpdateData,
  type TransactionFindManyOptions,
  type TransactionCursorOptions,
} from '../repositories/TransactionRepository.js';
import { toCents } from '../../../shared/currency.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateTransactionInput {
  description: string;
  amount: number | string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  scope: 'personal' | 'business';
  paymentMethod?: string;
  notes?: string;
  recurring?: boolean;
  recurrenceInterval?: string;
  classification?: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number | string;
  receiptUrl?: string;
  mood?: string;
  motivation?: string;
  totalInstallments?: number;
}

export interface UpdateTransactionInput {
  description?: string;
  amount?: number | string;
  type?: string;
  category?: string;
  date?: string;
  scope?: string;
  paymentMethod?: string;
  notes?: string;
  recurring?: boolean;
  recurrenceInterval?: string;
  classification?: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number | string;
  receiptUrl?: string;
  mood?: string;
  motivation?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNumber(val: number | string | undefined): number | undefined {
  if (val === undefined) return undefined;
  return typeof val === 'string' ? parseFloat(val) : val;
}

/**
 * Auto-predicts category/description when user picks the generic "Outros".
 */
function enrichTransaction(
  description: string,
  category: string,
  amount: number,
  type: 'income' | 'expense',
): { finalDesc: string; finalCategory: string } {
  if (category.toLowerCase() === 'outros' || category.trim() === '') {
    const pred = PredictiveEngine.predictTransaction(
      description,
      amount * (type === 'income' ? 1 : -1),
    );
    return { finalDesc: pred.cleanedDescription, finalCategory: pred.suggestedCategory };
  }
  return {
    finalDesc: PredictiveEngine.cleanDescription(description),
    finalCategory: category,
  };
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function listTransactions(userId: string, opts: Partial<TransactionFindManyOptions>) {
  return findManyPaginated({
    userId,
    page: opts.page || 1,
    limit: opts.limit || 20,
    scope: opts.scope
  });
}

export async function getTransaction(id: string, userId: string) {
  return findOneBelongingTo(id, userId);
}

export async function listTransactionsCursor(opts: TransactionCursorOptions) {
  return findCursor(opts);
}

import { randomUUID } from 'crypto';

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
  app: FastifyInstance,
) {
  // Converte input fiduciário (e.g. 50.25) para Inteiro Base 100 (Cents)
  const numericAmount = toCents(toNumber(input.amount)!);
  const numericExchangeRate = toNumber(input.exchangeRate);
  const { finalDesc, finalCategory } = enrichTransaction(
    input.description,
    input.category,
    numericAmount,
    input.type,
  );

  const isInstallment = input.totalInstallments && input.totalInstallments > 1;
  const isInfiniteRecurrence = input.recurring && !isInstallment;
  
  const totalLoops = isInstallment ? input.totalInstallments! : (isInfiniteRecurrence ? 12 : 1);
  const recurrenceId = (isInstallment || isInfiniteRecurrence) ? randomUUID() : undefined;
  
  const transactionsToCreate: TransactionCreateData[] = [];
  const baseDate = new Date(input.date.includes('T') ? input.date : `${input.date}T12:00:00Z`);

  for (let i = 1; i <= totalLoops; i++) {
    const loopDate = new Date(baseDate);
    // Add (i - 1) months for each iteration
    if (i > 1) {
      if (input.recurrenceInterval === 'yearly') {
        loopDate.setFullYear(loopDate.getFullYear() + (i - 1));
      } else if (input.recurrenceInterval === 'weekly') {
        loopDate.setDate(loopDate.getDate() + (i - 1) * 7);
      } else {
        // default to monthly
        loopDate.setMonth(loopDate.getMonth() + (i - 1));
      }
    }

    const descriptionSuffix = isInstallment ? ` (${i}/${totalLoops})` : '';

    transactionsToCreate.push({
      userId,
      description: finalDesc + descriptionSuffix,
      category: finalCategory,
      amount: isInstallment ? numericAmount / totalLoops : numericAmount,
      type: input.type,
      date: loopDate,
      scope: input.scope,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      recurring: input.recurring,
      recurrenceInterval: input.recurrenceInterval,
      classification: input.classification,
      currency: input.currency,
      originalAmount: input.originalAmount ? toCents(input.originalAmount) : undefined,
      ...(numericExchangeRate !== undefined ? { exchangeRate: numericExchangeRate } : {}),
      receiptUrl: input.receiptUrl,
      mood: input.mood,
      motivation: input.motivation,
      recurrenceId,
      installmentNumber: isInstallment ? i : undefined,
      totalInstallments: isInstallment ? totalLoops : undefined,
    });
  }

  // Create the first one manually to get the exact complete object for return
  const firstTransactionData = transactionsToCreate[0]!;
  const transaction = await createOne(firstTransactionData);

  // Create the rest in bulk
  if (transactionsToCreate.length > 1) {
    const futureTransactions = transactionsToCreate.slice(1);
    await createMany(futureTransactions);
  }

  // Side-effects: fire-and-forget (non-blocking)
  Promise.all([
    invalidateTransactionCache(userId),
    invalidateBudgetCache(userId),
    createAndEmitNotification(
      userId,
      input.type === 'income' ? 'transaction_income' : 'transaction_expense',
      input.type === 'income' ? '💰 Receita registrada' : '💸 Despesa registrada',
      `${finalDesc}: R$ ${(numericAmount / 100).toFixed(2)}`,
      { transactionId: transaction.id, category: finalCategory },
      app,
    ),
    input.type === 'expense'
      ? NotificationService.checkBudgetAlerts(userId, numericAmount, finalCategory)
      : Promise.resolve(),
  ]).catch(() => {}); // Side-effects must never fail the main response

  return transaction;
}

export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput,
) {
  const existing = await findOneBelongingTo(id, userId);
  if (!existing) return null;

  const data: TransactionUpdateData = {
    description:        input.description,
    category:           input.category,
    type:               input.type,
    scope:              input.scope,
    paymentMethod:      input.paymentMethod,
    notes:              input.notes,
    recurring:          input.recurring,
    recurrenceInterval: input.recurrenceInterval,
    classification:     input.classification,
    currency:           input.currency,
    originalAmount:     input.originalAmount !== undefined ? toCents(input.originalAmount) : undefined,
    receiptUrl:         input.receiptUrl,
    mood:               input.mood,
    motivation:         input.motivation,
    ...(input.amount       !== undefined ? { amount:       toCents(toNumber(input.amount)!) }       : {}),
    ...(input.exchangeRate !== undefined ? { exchangeRate: toNumber(input.exchangeRate) } : {}),
    ...(input.date                       ? { date:         new Date(input.date.includes('T') ? input.date : `${input.date}T12:00:00Z`) } : {}),
  };

  const transaction = await updateOne(id, data);

  await Promise.all([
    invalidateTransactionCache(userId),
    invalidateBudgetCache(userId),
  ]);

  return transaction;
}

export async function deleteTransaction(id: string, userId: string) {
  const deleted = await softDeleteOne(id, userId);
  if (!deleted) return false;

  await Promise.all([
    invalidateTransactionCache(userId),
    invalidateBudgetCache(userId),
  ]);

  return true;
}
