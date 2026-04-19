/**
 * ReconciliationService
 * ───────────────────────
 * Application layer for bank reconciliation and data integrity.
 */

import { db } from "../lib/db.js";

export async function getReconciliationReport(userId: string, workspaceId: string, bankAccountId?: string) {
  const accounts = await db.bankAccount.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(bankAccountId ? { id: bankAccountId } : {})
    },
    include: {
      connection: true
    }
  });

  const results = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await db.transaction.findMany({
        where: {
          bankAccountId: account.id,
          deletedAt: null
        },
        select: { amount: true, type: true }
      });

      // Calcule balance based on transaction ledger
      const calculatedBalance = transactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
      }, 0);

      // Discrepancy check (Base-100 logic)
      const discrepancy = Math.abs(account.balance - calculatedBalance);
      const isDiscrepancy = discrepancy > 1; // Tolerance 1 cent

      return {
        bankAccountId: account.id,
        accountName: account.name,
        bankName: account.bankName,
        actualBalance: account.balance,
        calculatedBalance: Math.round(calculatedBalance * 100) / 100,
        discrepancy: Math.round(discrepancy * 100) / 100,
        status: isDiscrepancy ? 'discrepancy' : 'matched',
        lastSyncAt: (account as any).connection?.lastSyncAt?.toISOString() || null,
        transactionCount: transactions.length
      };
    })
  );

  const summary = {
    totalAccounts: results.length,
    matched: results.filter(r => r.status === 'matched').length,
    discrepancies: results.filter(r => r.status === 'discrepancy').length,
    totalDiscrepancy: results.reduce((sum, r) => sum + r.discrepancy, 0)
  };

  return { reconciliations: results, summary };
}

// ── User-level reconciliation (no workspace needed) ───────────────────────────
// Aggregates health across ALL bank accounts for the personal finance dashboard.

export async function getUserReconciliationSummary(userId: string) {
  const accounts = await db.bankAccount.findMany({
    where: { userId, deletedAt: null },
    include: { connection: { select: { lastSyncAt: true, status: true } } },
  });

  const results = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await db.transaction.findMany({
        where: { bankAccountId: account.id, deletedAt: null },
        select: { amount: true, type: true },
      });

      const calculatedBalance = transactions.reduce((sum, t) =>
        t.type === 'income' ? sum + t.amount : sum - t.amount, 0
      );

      const discrepancy = Math.abs(account.balance - calculatedBalance);
      const isDiscrepancy = discrepancy > 100; // Tolerance: 1 cent (stored × 100)

      let reconciliationStatus: 'matched' | 'discrepancy' | 'no_data' = 'no_data';
      if (transactions.length > 0) {
        reconciliationStatus = isDiscrepancy ? 'discrepancy' : 'matched';
      }

      return {
        bankAccountId: account.id,
        accountName: account.name,
        bankName: account.bankName ?? 'Banco',
        bankImageUrl: account.bankImageUrl,
        actualBalance: account.balance,           // cents × 100
        calculatedBalance: Math.round(calculatedBalance),
        discrepancy: Math.round(discrepancy),
        reconciliationStatus,
        connectionStatus: account.connection?.status ?? 'unknown',
        lastSyncAt: account.connection?.lastSyncAt?.toISOString() ?? null,
        transactionCount: transactions.length,
      };
    })
  );

  const matched     = results.filter(r => r.reconciliationStatus === 'matched').length;
  const discrepant  = results.filter(r => r.reconciliationStatus === 'discrepancy').length;
  const noData      = results.filter(r => r.reconciliationStatus === 'no_data').length;
  const healthScore = results.length > 0
    ? Math.round((matched / results.length) * 100)
    : 100;

  return {
    accounts: results,
    summary: {
      totalAccounts: results.length,
      matched,
      discrepant,
      noData,
      healthScore,
      totalDiscrepancyCents: results.reduce((s, r) => s + r.discrepancy, 0),
    },
  };
}
