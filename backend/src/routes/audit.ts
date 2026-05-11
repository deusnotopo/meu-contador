import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { writeAuditLog } from '../lib/audit';
import { logger } from '../lib/logger.js';

const auditIdentifierSchema = z.string().trim().min(1).max(100).regex(/^[A-Z0-9_:.\/-]+$/i, 'Invalid audit identifier');

const jsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type JsonValue = z.infer<typeof jsonPrimitiveSchema> | { [key: string]: JsonValue } | JsonValue[];
const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([
  jsonPrimitiveSchema,
  z.array(jsonValueSchema).max(50),
  z.record(jsonValueSchema),
]));

const metadataSchema = z.record(jsonValueSchema).superRefine((value, ctx) => {
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, 'utf8') > 8 * 1024) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Metadata too large',
    });
  }
});

const auditEntrySchema = z.object({
  action: auditIdentifierSchema,
  resource: auditIdentifierSchema,
  resourceId: z.string().trim().min(1).max(191).optional(),
  metadata: metadataSchema.optional(),
});

const auditMeQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const auditLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().nullable(),
  metadata: z.record(jsonValueSchema).nullable(),
  piiRedacted: z.boolean(),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
});

function requireAuthenticatedUser(request: { user?: { id?: string } }, reply: { status(code: number): { send(payload: { message: string }): unknown } }) {
  if (!request.user?.id) {
    reply.status(401).send({ message: 'Unauthorized' });
    return null;
  }

  return request.user;
}

function parseAuditMetadata(metadata: string | null, piiRedacted: boolean): Record<string, JsonValue> | null {
  if (!metadata || !piiRedacted) return null;

  try {
    const parsed = JSON.parse(metadata) as unknown;
    const result = metadataSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function auditRoutes(app: FastifyInstance) {
  app.post('/audit', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      body: auditEntrySchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const user = requireAuthenticatedUser(request, reply);
    if (!user) return;

    const { action, resource, resourceId, metadata } = auditEntrySchema.parse(request.body);

    try {
      await writeAuditLog({
        userId: user.id,
        action,
        resource,
        resourceId,
        metadata,
      });

      logger.info('[AuditRoute] Evento de auditoria registrado', {
        userId: user.id,
        action,
        resource,
        resourceId: resourceId ?? null,
      });

      return { success: true };
    } catch (error) {
      request.log.error({
        event: 'audit-write-failed',
        userId: user.id,
        action,
        resource,
        resourceId: resourceId ?? null,
        error,
      });
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /audit/me - Permite que o usuário veja seu próprio rastro de auditoria (Transparência LGPD)
  app.get('/audit/me', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      querystring: auditMeQuerySchema,
      response: {
        200: z.array(auditLogResponseSchema),
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const user = requireAuthenticatedUser(request, reply);
    if (!user) return;

    const { limit } = auditMeQuerySchema.parse(request.query);

    try {
      // Import the DB directly here to avoid circular dependencies if needed,
      // though audit.ts already uses it.
      const { db } = await import('../lib/db.js');
      
      const logs = await db.auditLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      logger.info('[AuditRoute] Consulta de trilha de auditoria do usuário', {
        userId: user.id,
        limit,
        resultCount: logs.length,
      });

      return logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        metadata: parseAuditMetadata(log.metadata, log.piiRedacted),
        piiRedacted: log.piiRedacted,
        createdAt: log.createdAt,
        expiresAt: log.expiresAt,
      }));
    } catch (error) {
      request.log.error({
        event: 'audit-read-failed',
        userId: user.id,
        limit,
        error,
      });
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });
}
