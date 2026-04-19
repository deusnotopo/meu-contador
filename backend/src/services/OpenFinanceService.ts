/**
 * OpenFinanceService
 * ──────────────────
 * Application layer for bank integration and lifecycle.
 */

import { db } from "../lib/db.js";
import { getCacheValue, setCacheValue } from "../lib/cache.js";
import { writeAuditLog } from "../lib/audit.js";
import * as OpenFinanceGateway from "../gateways/OpenFinanceGateway.js";

const CONNECT_TOKEN_TTL = 60 * 1000;
const TOKEN_CACHE_PREFIX = 'open-finance:token:';

export async function getConnectToken(userId: string): Promise<string> {
  const cacheKey = `${TOKEN_CACHE_PREFIX}${userId}`;
  const cached = await getCacheValue<string>(cacheKey);
  
  if (cached) return cached;

  const token = await OpenFinanceGateway.fetchConnectToken();
  await setCacheValue(cacheKey, token, CONNECT_TOKEN_TTL);
  
  await writeAuditLog({
    userId,
    action: 'OPEN_FINANCE_TOKEN_ISSUED',
    resource: 'open_finance_token'
  });

  return token;
}

export async function listUserConnections(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = { userId };

  const [items, total] = await Promise.all([
    db.bankConnection.findMany({
      where,
      include: { accounts: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.bankConnection.count({ where }),
  ]);

  const formattedItems = items.map(conn => ({
    ...conn,
    accounts: conn.accounts.map(acc => ({
      ...acc,
      balance: OpenFinanceGateway.normalizeAmount(acc.balance),
      calculatedBalance: acc.calculatedBalance ? OpenFinanceGateway.normalizeAmount(acc.calculatedBalance) : null,
      discrepancyAmount: acc.discrepancyAmount ? OpenFinanceGateway.normalizeAmount(acc.discrepancyAmount) : null,
    })),
  }));

  return {
    items: formattedItems,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export async function syncConnection(userId: string, itemId: string) {
  const connection = await db.bankConnection.findFirst({
    where: { pluggyItemId: itemId }
  });

  if (connection && connection.userId !== userId) {
    throw new Error('FORBIDDEN_WORKSPACE_CONNECTION');
  }

  const result = await OpenFinanceGateway.executeSync(itemId, userId);
  
  await writeAuditLog({
    userId,
    action: 'OPEN_FINANCE_SYNC_REQUESTED',
    resource: 'bank_connection',
    resourceId: connection?.id,
    metadata: { itemId }
  });

  return result;
}

export async function handleWebhookEvent(itemId: string, event: string) {
  const connection = await db.bankConnection.findUnique({
    where: { pluggyItemId: itemId }
  });

  if (!connection) {
    throw new Error('CONNECTION_NOT_FOUND');
  }

  // item/updated logic
  return OpenFinanceGateway.executeSync(itemId, connection.userId);
}
