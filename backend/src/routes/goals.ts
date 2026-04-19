import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as GoalService from '../services/GoalService.js';

const goalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const goalParamsSchema = z.object({ id: z.string().min(1).max(191) });

const goalBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  targetAmount: z.number().positive().max(1_000_000_000),
  currentAmount: z.number().nonnegative().max(1_000_000_000).default(0),
  deadline: z.string().datetime(),
  icon: z.string().trim().max(40).optional(),
  color: z.string().trim().max(20).optional(),
});

const goalPatchBodySchema = goalBodySchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'Informe ao menos um campo para atualização',
});

const goalResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.union([z.date(), z.string()]),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
}).passthrough();

const goalsListResponseSchema = z.object({
  items: z.array(goalResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

const goalErrorSchema = z.object({ message: z.string() });

export async function goalRoutes(app: FastifyInstance) {
  app.get('/goals', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Goals'],
      security: [{ bearerAuth: [] }],
      querystring: goalsQuerySchema,
      response: { 200: goalsListResponseSchema },
    },
  }, async (request) => {
    const query = request.query as z.infer<typeof goalsQuerySchema>;
    return GoalService.listGoals(request.user.id, query);
  });

  app.post('/goals', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Goals'],
      security: [{ bearerAuth: [] }],
      body: goalBodySchema,
      response: { 200: goalResponseSchema },
    },
  }, async (request) => {
    const body = request.body as z.infer<typeof goalBodySchema>;
    return GoalService.createGoal(request.user.id, body);
  });

  app.patch('/goals/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Goals'],
      security: [{ bearerAuth: [] }],
      params: goalParamsSchema,
      body: goalPatchBodySchema,
      response: {
        200: goalResponseSchema,
        404: goalErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof goalParamsSchema>;
    const body = request.body as z.infer<typeof goalPatchBodySchema>;
    
    const goal = await GoalService.updateGoal(id, request.user.id, body);
    if (!goal) {
      return reply.status(404).send({ message: 'Goal not found' });
    }
    return goal;
  });

  app.delete('/goals/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Goals'],
      security: [{ bearerAuth: [] }],
      params: goalParamsSchema,
      response: {
        204: z.null(),
        404: goalErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as z.infer<typeof goalParamsSchema>;
    
    const success = await GoalService.deleteGoal(id, request.user.id);
    if (!success) {
      return reply.status(404).send({ message: 'Goal not found' });
    }
    return reply.status(204).send();
  });
}
