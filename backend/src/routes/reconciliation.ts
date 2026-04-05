import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../lib/db.js';

interface ReconciliationParams {
  workspaceId: string;
  bankAccountId: string;
}

export async function reconciliationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  fastify.get<{ Params: ReconciliationParams }>(
    '/:workspaceId/reconciliation',
    async (request: FastifyRequest<{ Params: ReconciliationParams }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { workspaceId, bankAccountId } = request.params;

      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId }
      });

      if (!workspace) {
        return reply.code(404).send({ error: 'Workspace not found' });
      }

      const isOwner = workspace.ownerId === userId;
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { workspaces: true }
      });
      const isMember = user?.workspaces.some(w => w.id === workspaceId);
      
      if (!isOwner && !isMember) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

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

          const calculatedBalance = transactions.reduce((sum, t) => {
            return t.type === 'income' ? sum + t.amount : sum - t.amount;
          }, 0);

          const discrepancy = Math.abs(account.balance - calculatedBalance);
          const isDiscrepancy = discrepancy > 1;

          return {
            bankAccountId: account.id,
            accountName: account.name,
            bankName: account.bankName,
            actualBalance: account.balance,
            calculatedBalance: Math.round(calculatedBalance * 100) / 100,
            discrepancy: Math.round(discrepancy * 100) / 100,
            status: isDiscrepancy ? 'discrepancy' : 'matched',
            lastSyncAt: account.connection.lastSyncAt?.toISOString() || null,
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
  );

  fastify.post<{ Params: ReconciliationParams }>(
    '/:workspaceId/reconciliation/:bankAccountId/acknowledge',
    async (request: FastifyRequest<{ Params: { workspaceId: string; bankAccountId: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { workspaceId, bankAccountId } = request.params;

      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId }
      });

      if (!workspace || workspace.ownerId !== userId) {
        return reply.code(403).send({ error: 'Only owner can acknowledge discrepancies' });
      }

      return { success: true, acknowledgedAt: new Date().toISOString() };
    }
  );
}