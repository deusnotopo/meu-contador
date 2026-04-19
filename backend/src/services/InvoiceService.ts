/**
 * InvoiceService
 * ──────────────
 * All business rules for invoices live here.
 */

import { getCacheValue, setCacheValue } from '../lib/cache.js';
import * as InvoiceRepository from '../repositories/InvoiceRepository.js';
import { db } from '../lib/db.js';

const CACHE_TTL = 300_000; // 5 minutes

export interface InvoiceInput {
  number: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
}

/**
 * Resolves the effective workspace ID for a user.
 * If the user has a currentWorkspaceId, use it; otherwise fallback to userId (Legacy behavior).
 */
async function getWorkspaceId(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currentWorkspaceId: true }
  });
  return user?.currentWorkspaceId || userId;
}

export async function listInvoices(userId: string) {
  const workspaceId = await getWorkspaceId(userId);
  const cacheKey = InvoiceRepository.invoiceListCacheKey(workspaceId);

  const cached = await getCacheValue(cacheKey);
  if (cached) return cached;

  const result = await InvoiceRepository.findAll(workspaceId);
  await setCacheValue(cacheKey, result, CACHE_TTL);

  return result;
}

export async function createInvoice(userId: string, input: InvoiceInput) {
  const workspaceId = await getWorkspaceId(userId);
  
  const data: InvoiceRepository.InvoiceCreateData = {
    workspaceId,
    number: input.number,
    client: input.client,
    amount: Math.round(input.amount * 100),
    dueDate: new Date(input.dueDate),
    status: input.status,
  };

  const invoice = await InvoiceRepository.createOne(data);
  await InvoiceRepository.invalidateInvoiceCache(workspaceId);
  return invoice;
}

export async function updateInvoice(id: string, userId: string, input: Partial<InvoiceInput>) {
  const workspaceId = await getWorkspaceId(userId);
  const existing = await InvoiceRepository.findOne(id, workspaceId);
  if (!existing) return null;

  const data: InvoiceRepository.InvoiceUpdateData = {
    number: input.number,
    client: input.client,
    status: input.status,
    ...(input.amount !== undefined ? { amount: Math.round(input.amount * 100) } : {}),
    ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
  };

  const invoice = await InvoiceRepository.updateOne(id, workspaceId, data);
  await InvoiceRepository.invalidateInvoiceCache(workspaceId);
  return invoice;
}

export async function deleteInvoice(id: string, userId: string) {
  const workspaceId = await getWorkspaceId(userId);
  const success = await InvoiceRepository.softDeleteOne(id, workspaceId);
  if (success) {
    await InvoiceRepository.invalidateInvoiceCache(workspaceId);
  }
  return success;
}
