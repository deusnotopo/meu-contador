/**
 * OpenFinanceGateway
 * ──────────────────
 * Infrastructure layer for bank data synchronization.
 */

import { getConnectToken, syncBankConnection } from "../services/pluggy.js";

export interface BankSyncResult {
  success: boolean;
  itemId: string;
}

/**
 * Normalization Logic
 */

export function normalizeAmount(amountCents: number): number {
  return amountCents / 100;
}

export function denormalizeAmount(amountDecimal: number): number {
  return Math.round(amountDecimal * 100);
}

/**
 * External Calls
 */

export async function fetchConnectToken(): Promise<string> {
  // Wraps pluggy service
  return getConnectToken();
}

export async function executeSync(itemId: string, userId: string): Promise<BankSyncResult> {
  // Orchestrates the heavy lifting in pluggy.ts
  const result = await syncBankConnection(itemId, userId);
  
  return {
    success: !!result,
    itemId
  };
}
