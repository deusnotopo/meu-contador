/**
 * ReminderService
 * ───────────────
 * All business rules for reminders live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as ReminderRepository from '../repositories/ReminderRepository.js';

const CACHE_TTL = 300_000; // 5 minutes

export interface ReminderInput {
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  recurring: string;
}

export async function listReminders(userId: string) {
  const cacheKey = ReminderRepository.reminderListCacheKey(userId);

  // We don't cache reminders yet as they change often (isPaid toggles),
  // but we can add it here if needed. Currently mirroring the existing route.
  return ReminderRepository.findAll(userId);
}

export async function createReminder(userId: string, input: ReminderInput, tx?: any) {
  const data: ReminderRepository.ReminderCreateData = {
    userId,
    name: input.name,
    amount: Math.round(input.amount * 100),
    dueDate: new Date(input.dueDate),
    category: input.category,
    isPaid: input.isPaid,
    recurring: input.recurring,
  };

  const reminder = await ReminderRepository.createOne(data, tx);
  if (!tx) await ReminderRepository.invalidateReminderCache(userId);
  return reminder;
}

export async function createManyReminders(userId: string, data: any[], tx?: any) {
  const result = await ReminderRepository.createMany(data, tx);
  if (!tx) await ReminderRepository.invalidateReminderCache(userId);
  return result;
}

export async function updateReminder(id: string, userId: string, input: Partial<ReminderInput>, tx?: any) {
  const existing = await ReminderRepository.findOne(id, userId);
  if (!existing) return null;

  const data: ReminderRepository.ReminderUpdateData = {
    name: input.name,
    category: input.category,
    isPaid: input.isPaid,
    recurring: input.recurring,
    ...(input.amount !== undefined ? { amount: Math.round(input.amount * 100) } : {}),
    ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
  };

  const reminder = await ReminderRepository.updateOne(id, userId, data, tx);
  if (!tx) await ReminderRepository.invalidateReminderCache(userId);
  return reminder;
}

export async function deleteReminder(id: string, userId: string, tx?: any) {
  const success = await ReminderRepository.softDeleteOne(id, userId, tx);
  if (success && !tx) {
    await ReminderRepository.invalidateReminderCache(userId);
  }
  return success;
}
