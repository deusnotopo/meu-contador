import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import * as BudgetService from '../services/BudgetService.js';

const budgetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const budgetParamsSchema = z.object({ id: z.string().min(1).max(191) });

const budgetBodySchema = z.object({
  category: z.string().trim().min(1).max(80),
  limit: z.number().nonnegative().max(1_000_000_000),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

const budgetUpdateBodySchema = z.object({
  limit: z.number().nonnegative().max(1_000_000_000),
});

const budgetResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.string(),
  limit: z.number(),
  spent: z.number(),
  month: z.string(),
});

const budgetListResponseSchema = z.object({
  items: z.array(budgetResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

const budgetErrorSchema = z.object({ message: z.string() });

export async function budgetRoutes(app: FastifyInstance) {
  app.get('/budgets', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      querystring: budgetQuerySchema,
      response: { 200: budgetListResponseSchema },
    },
  }, async (request) => {
    const user = request.user as { id: string };
    const query = request.query as z.infer<typeof budgetQuerySchema>;
    return BudgetService.listBudgets(user.id, query);
  });

  app.post('/budgets', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      body: budgetBodySchema,
      response: {
        200: budgetResponseSchema,
        409: budgetErrorSchema,
      },
    },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof budgetBodySchema>;
    const user = request.user as { id: string };

    try {
      return await BudgetService.createBudget(user.id, body);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return reply.status(409).send({
          message: 'Já existe um orçamento para esta categoria neste mês',
        });
      }
      throw error;
    }
  });

  app.put('/budgets/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      params: budgetParamsSchema,
      body: budgetUpdateBodySchema,
      response: {
        200: budgetResponseSchema,
        404: budgetErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof budgetParamsSchema>;
    const body = request.body as z.infer<typeof budgetUpdateBodySchema>;
    const user = request.user as { id: string };

    const budget = await BudgetService.updateBudget(id, user.id, body);
    if (!budget) {
      return reply.status(404).send({ message: 'Budget not found' });
    }
    return budget;
  });

  app.delete('/budgets/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Budgets'],
      security: [{ bearerAuth: [] }],
      params: budgetParamsSchema,
      response: {
        204: z.null(),
        404: budgetErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof budgetParamsSchema>;
    const user = request.user as { id: string };

    const deleted = await BudgetService.deleteBudget(id, user.id);
    if (!deleted) {
      return reply.status(404).send({ message: 'Budget not found' });
    }
    return reply.status(204).send();
  });
}
