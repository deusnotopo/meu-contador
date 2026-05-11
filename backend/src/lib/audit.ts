import { Prisma } from '@prisma/client';
import { db } from './db';
import { logger } from './logger.js';

const DEFAULT_AUDIT_RETENTION_DAYS = Number(process.env.AUDIT_LOG_RETENTION_DAYS || 90);
const MAX_METADATA_BYTES = 8 * 1024;

export interface AuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  retentionDays?: number;
}

function safeSerializeMetadata(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;

  const serialized = JSON.stringify(metadata);
  const size = Buffer.byteLength(serialized, 'utf8');

  if (size > MAX_METADATA_BYTES) {
    throw new Error('AUDIT_METADATA_TOO_LARGE');
  }

  return serialized;
}

export async function writeAuditLog(input: AuditLogInput) {
  try {
    const retentionDays = input.retentionDays ?? DEFAULT_AUDIT_RETENTION_DAYS;
    const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    const metadata = safeSerializeMetadata(input.metadata);

    const created = await db.auditLog.create({
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

    logger.info('[Audit] Log escrito', {
      auditLogId: created.id,
      userId: input.userId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
    });

    return created;
  } catch (error) {
    logger.error('[Audit] Falha ao escrever log de auditoria', {
      userId: input.userId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ? '[REDACTED]' : null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
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