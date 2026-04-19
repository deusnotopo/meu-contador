import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as ReconciliationService from '../services/ReconciliationService.js';
import * as WorkspaceService from '../services/WorkspaceService.js';

const reconciliationQuerySchema = z.object({
  bankAccountId: z.string().optional(),
});

const reconciliationParamsSchema = z.object({
  workspaceId: z.string(),
});

const acknowledgeParamsSchema = z.object({
  workspaceId: z.string(),
  bankAccountId: z.string(),
});

export async function reconciliationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/:workspaceId/reconciliation', {
    schema: {
      tags: ['Reconciliation'],
      security: [{ bearerAuth: [] }],
      params: reconciliationParamsSchema,
      querystring: reconciliationQuerySchema,
    }
  }, async (request, reply) => {
    const { workspaceId } = request.params as z.infer<typeof reconciliationParamsSchema>;
    const { bankAccountId } = request.query as z.infer<typeof reconciliationQuerySchema>;
    
    // Auth Guard
    try {
      await WorkspaceService.getWorkspace(workspaceId, request.user.id);
    } catch (err: any) {
      return reply.code(403).send({ error: err.message });
    }

    return ReconciliationService.getReconciliationReport(request.user.id, workspaceId, bankAccountId);
  });

  app.post('/:workspaceId/reconciliation/:bankAccountId/acknowledge', {
    schema: {
      tags: ['Reconciliation'],
      security: [{ bearerAuth: [] }],
      params: acknowledgeParamsSchema,
    }
  }, async (request, reply) => {
    const { workspaceId } = request.params as z.infer<typeof acknowledgeParamsSchema>;

    // Authorization Check
    try {
      await WorkspaceService.getWorkspace(workspaceId, request.user.id);
    } catch (err: any) {
      return reply.code(403).send({ error: 'Only owner can acknowledge discrepancies' });
    }

    return { success: true, acknowledgedAt: new Date().toISOString() };
  });
}