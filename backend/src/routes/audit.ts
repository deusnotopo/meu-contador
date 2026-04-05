import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { writeAuditLog } from '../lib/audit';

const auditEntrySchema = z.object({
  action: z.string().min(1).max(100),
  resource: z.string().min(1).max(100),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function auditRoutes(app: FastifyInstance) {
  app.post('/audit', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      body: auditEntrySchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const user = request.user as { id: string };
    const { action, resource, resourceId, metadata } = request.body as z.infer<typeof auditEntrySchema>;

    try {
      await writeAuditLog({
        userId: user.id,
        action,
        resource,
        resourceId,
        metadata,
      });

      return { success: true };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /audit/me - Permite que o usuário veja seu próprio rastro de auditoria (Transparência LGPD)
  app.get('/audit/me', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
      }),
    },
  }, async (request) => {
    const user = request.user as { id: string };
    const { limit } = request.query as { limit: number };

    // Import the DB directly here to avoid circular dependencies if needed, 
    // though audit.ts already uses it.
    const { db } = await import('../lib/db.js');
    
    const logs = await db.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  });
}
