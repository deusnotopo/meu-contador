/**
 * Transaction Routes — HTTP layer only.
 * ──────────────────────────────────────
 * Responsibility: parse HTTP request → call Service → send HTTP response.
 * No business logic. No Prisma. No cache. No notifications.
 * All of that lives in TransactionService / TransactionRepository.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as TransactionService from '../services/TransactionService.js';

// ── Schemas (HTTP contract) ────────────────────────────────────────────────────

const scopeSchema = z.enum(['personal', 'business']);

const paginationQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  scope: scopeSchema.optional(),
});

const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  scope:  scopeSchema.optional(),
});

const paramsSchema = z.object({ id: z.string().min(1).max(191) });

const bodySchema = z.object({
  description:        z.string().trim().min(1).max(200),
  amount:             z.union([z.number().finite().positive(), z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0)]),
  type:               z.enum(['income', 'expense']),
  category:           z.string().trim().min(1).max(80),
  date:               z.string().min(10),
  scope:              scopeSchema,
  paymentMethod:      z.string().trim().min(1).max(80).optional(),
  notes:              z.string().max(2000).optional(),
  recurring:          z.boolean().optional(),
  recurrenceInterval: z.enum(['monthly', 'weekly', 'bi-weekly', 'yearly']).optional(),
  classification:     z.enum(['necessity', 'want', 'investment', 'debt']).optional(),
  currency:           z.enum(['BRL', 'USD', 'EUR', 'GBP']).optional(),
  originalAmount:     z.number().finite().positive().optional(),
  exchangeRate:       z.union([z.number().finite().positive(), z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0)]).optional(),
  receiptUrl:         z.string().trim().url().max(2048).optional(),
  mood:               z.string().optional(),
  motivation:         z.string().optional(),
});

const patchBodySchema = bodySchema.partial().refine(
  b => Object.keys(b).length > 0,
  'Informe ao menos um campo para atualização',
);

// ── Routes ────────────────────────────────────────────────────────────────────

export async function transactionRoutes(app: FastifyInstance) {

  // GET /transactions — paginated list
  app.get('/transactions', {
    preHandler: [(app as any).authenticate],
    schema: { tags: ['Transactions'], security: [{ bearerAuth: [] }], querystring: paginationQuerySchema },
  }, async (request) => {
    const { page, limit, scope } = request.query as z.infer<typeof paginationQuerySchema>;
    const { id: userId } = request.user as { id: string };
    return TransactionService.listTransactions({ userId, page, limit, scope });
  });

  // GET /transactions/cursor — cursor-based pagination
  app.get('/transactions/cursor', {
    preHandler: [(app as any).authenticate],
    schema: { tags: ['Transactions'], security: [{ bearerAuth: [] }], querystring: cursorQuerySchema },
  }, async (request) => {
    const { cursor, limit, scope } = request.query as z.infer<typeof cursorQuerySchema>;
    const { id: userId } = request.user as { id: string };
    return TransactionService.listTransactionsCursor({ userId, cursor, limit, scope });
  });

  // POST /transactions — create
  app.post('/transactions', {
    preHandler: [(app as any).authenticate],
    schema: { tags: ['Transactions'], security: [{ bearerAuth: [] }], body: bodySchema },
  }, async (request) => {
    const body = request.body as z.infer<typeof bodySchema>;
    const { id: userId } = request.user as { id: string };
    return TransactionService.createTransaction(userId, body, app);
  });

  // PUT /transactions/:id — update
  app.put('/transactions/:id', {
    preHandler: [(app as any).authenticate],
    schema: { tags: ['Transactions'], security: [{ bearerAuth: [] }], params: paramsSchema, body: patchBodySchema },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof paramsSchema>;
    const body = request.body as z.infer<typeof patchBodySchema>;
    const { id: userId } = request.user as { id: string };
    const result = await TransactionService.updateTransaction(id, userId, body);
    if (!result) return reply.status(404).send({ message: 'Transaction not found' });
    return result;
  });

  // DELETE /transactions/:id — soft delete
  app.delete('/transactions/:id', {
    preHandler: [(app as any).authenticate],
    schema: { tags: ['Transactions'], security: [{ bearerAuth: [] }], params: paramsSchema },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof paramsSchema>;
    const { id: userId } = request.user as { id: string };
    const deleted = await TransactionService.deleteTransaction(id, userId);
    if (!deleted) return reply.status(404).send({ message: 'Transaction not found' });
    return reply.status(204).send();
  });
}
