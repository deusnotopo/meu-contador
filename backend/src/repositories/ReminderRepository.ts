/**
 * ReminderRepository
 * ──────────────────
 * Single place for all Prisma queries on the BillReminder model.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix } from '../lib/cache.js';
import type { Prisma } from '@prisma/client';

export interface ReminderCreateData {
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  category: string;
  isPaid?: boolean;
  recurring?: string;
}

export interface ReminderUpdateData {
  name?: string;
  amount?: number;
  dueDate?: Date;
  category?: string;
  isPaid?: boolean;
  recurring?: string;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function reminderListCacheKey(userId: string) {
  return `reminders:list:${userId}`;
}

export async function invalidateReminderCache(userId: string) {
  await deleteCacheByPrefix(`reminders:list:${userId}`);
}

// ── Mapping Helper ────────────────────────────────────────────────────────────

function formatReminder<T extends { amount: number }>(reminder: T): T {
  return {
    ...reminder,
    amount: reminder.amount / 100,
  } as T;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findAll(userId: string) {
  const reminders = await db.billReminder.findMany({
    where: { userId, deletedAt: null },
    orderBy: { dueDate: 'asc' },
  });
  return reminders.map(formatReminder);
}

export async function findOne(id: string, userId: string) {
  const reminder = await db.billReminder.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return reminder ? formatReminder(reminder) : null;
}

export async function createOne(data: ReminderCreateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const reminder = await client.billReminder.create({ data });
  return formatReminder(reminder);
}

export async function createMany(data: ReminderCreateData[], tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.billReminder.createMany({ data });
}

export async function updateOne(id: string, userId: string, data: ReminderUpdateData, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const reminder = await client.billReminder.update({
    where: { id },
    data,
  });
  return formatReminder(reminder);
}

export async function softDeleteOne(id: string, userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
  const client = tx || db;
  const result = await client.billReminder.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
