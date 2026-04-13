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
import { checkBudgetAlerts } from '../routes/websocket.js';
import {
  findManyPaginated,
  findOneBelongingTo,
  findCursor,
  createOne,
  updateOne,
  softDeleteOne,
  invalidateTransactionCache,
  invalidateBudgetCache,
  type TransactionCreateData,
  type TransactionUpdateData,
  type TransactionFindManyOptions,
  type TransactionCursorOptions,
} from '../repositories/TransactionRepository.js';

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

export async function listTransactions(opts: TransactionFindManyOptions) {
  return findManyPaginated(opts);
}

export async function listTransactionsCursor(opts: TransactionCursorOptions) {
  return findCursor(opts);
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
  app: FastifyInstance,
) {
  const numericAmount = toNumber(input.amount)!;
  const numericExchangeRate = toNumber(input.exchangeRate);
  const { finalDesc, finalCategory } = enrichTransaction(
    input.description,
    input.category,
    numericAmount,
    input.type,
  );

  const data: TransactionCreateData = {
    userId,
    description: finalDesc,
    category: finalCategory,
    amount: numericAmount,
    type: input.type,
    date: new Date(input.date),
    scope: input.scope,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    recurring: input.recurring,
    recurrenceInterval: input.recurrenceInterval,
    classification: input.classification,
    currency: input.currency,
    originalAmount: input.originalAmount,
    ...(numericExchangeRate !== undefined ? { exchangeRate: numericExchangeRate } : {}),
    receiptUrl: input.receiptUrl,
    mood: input.mood,
    motivation: input.motivation,
  };

  const transaction = await createOne(data);

  // Side-effects: fire-and-forget (non-blocking)
  Promise.all([
    invalidateTransactionCache(userId),
    invalidateBudgetCache(userId),
    createAndEmitNotification(
      userId,
      input.type === 'income' ? 'transaction_income' : 'transaction_expense',
      input.type === 'income' ? '💰 Receita registrada' : '💸 Despesa registrada',
      `${finalDesc}: R$ ${numericAmount.toFixed(2)}`,
      { transactionId: transaction.id, category: finalCategory },
      app,
    ),
    input.type === 'expense'
      ? checkBudgetAlerts(userId, numericAmount, finalCategory)
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
    originalAmount:     input.originalAmount,
    receiptUrl:         input.receiptUrl,
    mood:               input.mood,
    motivation:         input.motivation,
    ...(input.amount       !== undefined ? { amount:       toNumber(input.amount) }       : {}),
    ...(input.exchangeRate !== undefined ? { exchangeRate: toNumber(input.exchangeRate) } : {}),
    ...(input.date                       ? { date:         new Date(input.date) }         : {}),
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
