import { Prisma } from '@prisma/client';
import { db } from './db';

const DEFAULT_AUDIT_RETENTION_DAYS = Number(process.env.AUDIT_LOG_RETENTION_DAYS || 90);

export interface AuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  retentionDays?: number;
}

export async function writeAuditLog(input: AuditLogInput) {
  const retentionDays = input.retentionDays ?? DEFAULT_AUDIT_RETENTION_DAYS;
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  const metadata = input.metadata ? JSON.stringify(input.metadata) : undefined;

  return db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata,
      piiRedacted: true,
      expiresAt,
    },
  });
}

export async function purgeExpiredSensitiveData(referenceDate = new Date()) {
  const sessionCutoff = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [expiredAuditLogs, expiredSessions] = await db.$transaction([
    db.auditLog.deleteMany({
      where: {
        expiresAt: { not: null, lt: referenceDate },
      },
    }),
    db.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: referenceDate } },
          { revokedAt: { not: null, lt: sessionCutoff } },
        ],
      },
    }),
  ]);

  return {
    expiredAuditLogs: expiredAuditLogs.count,
    expiredSessions: expiredSessions.count,
  };
}