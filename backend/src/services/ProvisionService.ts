/**
 * ProvisionService
 * ────────────────
 * All business rules for provisions live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as ProvisionRepository from '../repositories/ProvisionRepository.js';

const CACHE_TTL = 300_000; // 5 minutes

export interface ProvisionInput {
  name: string;
  month: number;
  yearlyAmount: number;
  accumulated: number;
}

export async function listProvisions(userId: string) {
  const cacheKey = ProvisionRepository.provisionListCacheKey(userId);

  const cached = await getCacheValue(cacheKey);
  if (cached) return cached;

  const result = await ProvisionRepository.findAll(userId);
  await setCacheValue(cacheKey, { items: result }, CACHE_TTL);

  return { items: result };
}

export async function createProvision(userId: string, input: ProvisionInput) {
  const data: ProvisionRepository.ProvisionCreateData = {
    userId,
    name: input.name,
    month: input.month,
    yearlyAmount: Math.round(input.yearlyAmount * 100),
    accumulated: Math.round((input.accumulated || 0) * 100),
  };

  const provision = await ProvisionRepository.createOne(data);
  await ProvisionRepository.invalidateProvisionCache(userId);
  return provision;
}

export async function updateProvision(id: string, userId: string, input: Partial<ProvisionInput>) {
  const existing = await ProvisionRepository.findOne(id, userId);
  if (!existing) return null;

  const data: ProvisionRepository.ProvisionUpdateData = {
    name: input.name,
    month: input.month,
    ...(input.yearlyAmount !== undefined ? { yearlyAmount: Math.round(input.yearlyAmount * 100) } : {}),
    ...(input.accumulated !== undefined ? { accumulated: Math.round(input.accumulated * 100) } : {}),
  };

  const provision = await ProvisionRepository.updateOne(id, userId, data);
  await ProvisionRepository.invalidateProvisionCache(userId);
  return provision;
}

export async function deleteProvision(id: string, userId: string) {
  const success = await ProvisionRepository.softDeleteOne(id, userId);
  if (success) {
    await ProvisionRepository.invalidateProvisionCache(userId);
  }
  return success;
}
