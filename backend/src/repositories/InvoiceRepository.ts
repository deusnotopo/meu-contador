/**
 * InvoiceRepository
 * ─────────────────
 * Single place for all Prisma queries on the Invoice model.
 */

import { db } from '../lib/db.js';
import { deleteCacheByPrefix } from '../lib/cache.js';

export interface InvoiceCreateData {
  workspaceId: string;
  number: string;
  client: string;
  amount: number;
  dueDate: Date;
  status?: string;
}

export interface InvoiceUpdateData {
  number?: string;
  client?: string;
  amount?: number;
  dueDate?: Date;
  status?: string;
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

export function invoiceListCacheKey(workspaceId: string) {
  return `invoices:list:${workspaceId}`;
}

export async function invalidateInvoiceCache(workspaceId: string) {
  await deleteCacheByPrefix(`invoices:list:${workspaceId}`);
}

// ── Mapping Helper ────────────────────────────────────────────────────────────

function formatInvoice<T extends { amount: number }>(invoice: T): T {
  return {
    ...invoice,
    amount: invoice.amount / 100,
  } as T;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findAll(workspaceId: string) {
  const invoices = await db.invoice.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { dueDate: 'desc' },
  });
  return invoices.map(formatInvoice);
}

export async function findOne(id: string, workspaceId: string) {
  const invoice = await db.invoice.findFirst({
    where: { id, workspaceId, deletedAt: null },
  });
  return invoice ? formatInvoice(invoice) : null;
}

export async function createOne(data: InvoiceCreateData) {
  const invoice = await db.invoice.create({ data });
  return formatInvoice(invoice);
}

export async function updateOne(id: string, workspaceId: string, data: InvoiceUpdateData) {
  const invoice = await db.invoice.update({
    where: { id },
    data,
  });
  return formatInvoice(invoice);
}

export async function softDeleteOne(id: string, workspaceId: string): Promise<boolean> {
  const result = await db.invoice.updateMany({
    where: { id, workspaceId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
