import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as DebtService from '../services/DebtService.js';

const debtsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const debtParamsSchema = z.object({ id: z.string().uuid() });

const debtBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  balance: z.number().positive().max(1_000_000_000),
  interestRate: z.number().min(0).max(10_000),
  minPayment: z.number().positive().max(1_000_000_000),
  dueDate: z.string().datetime().optional().nullable(),
  category: z.string().trim().min(1).max(40).default('credit_card'),
});

const debtUpdateBodySchema = debtBodySchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'Informe ao menos um campo para atualização',
});

const debtResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  balance: z.number(),
  interestRate: z.number(),
  minPayment: z.number(),
  dueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  category: z.string(),
}).passthrough();

const debtsListResponseSchema = z.object({
  items: z.array(debtResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

const debtDeleteResponseSchema = z.object({ success: z.boolean() });
const debtErrorSchema = z.object({ message: z.string() });

export async function debtRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/debts', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      querystring: debtsQuerySchema,
      response: { 200: debtsListResponseSchema },
    },
  }, async (request) => {
    const query = request.query as z.infer<typeof debtsQuerySchema>;
    return DebtService.listDebts(request.user.id, query);
  });

  app.post('/debts', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      body: debtBodySchema,
      response: { 200: debtResponseSchema },
    },
  }, async (request) => {
    const body = request.body as z.infer<typeof debtBodySchema>;
    return DebtService.createDebt(request.user.id, body);
  });

  app.put('/debts/:id', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      params: debtParamsSchema,
      body: debtUpdateBodySchema,
      response: {
        200: debtResponseSchema,
        404: debtErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof debtParamsSchema>;
    const body = request.body as z.infer<typeof debtUpdateBodySchema>;

    const debt = await DebtService.updateDebt(id, request.user.id, body);
    if (!debt) {
      return reply.status(404).send({ message: 'Debt not found' });
    }
    return debt;
  });

  app.delete('/debts/:id', {
    schema: {
      tags: ['Debts'],
      security: [{ bearerAuth: [] }],
      params: debtParamsSchema,
      response: {
        200: debtDeleteResponseSchema,
        404: debtErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof debtParamsSchema>;
    
    const success = await DebtService.deleteDebt(id, request.user.id);
    if (!success) {
      return reply.status(404).send({ message: 'Debt not found' });
    }
    return { success: true };
  });
}
