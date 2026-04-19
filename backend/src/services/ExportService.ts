/**
 * ExportService
 * ─────────────
 * Application layer for data reporting and LGPD compliance.
 */

import { db } from "../lib/db.js";
import { writeAuditLog } from "../lib/audit.js";

export async function getUserFullData(userId: string) {
  const userData = await db.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: { deletedAt: null },
        orderBy: { date: 'desc' },
      },
      budgets: {
        where: { deletedAt: null },
      },
      goals: {
        where: { deletedAt: null },
      },
      investments: {
        where: { deletedAt: null },
        include: {
          dividends: true,
          sales: true,
        },
      },
      debts: {
        where: { deletedAt: null },
      },
      reminders: {
        where: { deletedAt: null },
      },
      bankAccounts: {
        where: { deletedAt: null },
      },
    },
  });

  if (!userData) return null;

  // Mask sensitive hash
  const { passwordHash, ...exportData } = userData;

  // Professional Audit Logging
  await writeAuditLog({
    userId,
    action: 'DATA_EXPORT_LGPD',
    resource: 'user',
    resourceId: userId,
    metadata: { timestamp: new Date().toISOString() }
  });

  return exportData;
}
