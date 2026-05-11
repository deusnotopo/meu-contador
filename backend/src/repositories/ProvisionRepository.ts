/**
 * ProvisionRepository
 * ───────────────────
 * Single place for all Prisma queries on the Provision model.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix } from '../lib/cache.js';

export interface ProvisionCreateData {
  userId: string;
  name: string;
  month: number;
  yearlyAmount: number;
  accumulated: number;
}

export interface ProvisionUpdateData {
  name?: string;
  month?: number;
  yearlyAmount?: number;
  accumulated?: number;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function provisionListCacheKey(userId: string) {
  return `provisions:list:${userId}`;
}

export async function invalidateProvisionCache(userId: string) {
  await deleteCacheByPrefix(`provisions:list:${userId}`);
}

// ── Mapping Helper ────────────────────────────────────────────────────────────

function formatProvision<T extends { yearlyAmount: number; accumulated: number }>(provision: T): T {
  return {
    ...provision,
    yearlyAmount: provision.yearlyAmount / 100,
    accumulated: provision.accumulated / 100,
  } as T;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findAll(userId: string) {
  const provisions = await db.provision.findMany({
    where: { userId, deletedAt: null },
    orderBy: { month: 'asc' },
  });
  return provisions.map(formatProvision);
}

export async function findOne(id: string, userId: string) {
  const provision = await db.provision.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return provision ? formatProvision(provision) : null;
}

export async function createOne(data: ProvisionCreateData) {
  const provision = await db.provision.create({ data });
  return formatProvision(provision);
}

export async function updateOne(id: string, userId: string, data: ProvisionUpdateData) {
  const provision = await db.provision.update({
    where: { id },
    data,
  });
  return formatProvision(provision);
}

export async function softDeleteOne(id: string, userId: string): Promise<boolean> {
  const result = await db.provision.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
