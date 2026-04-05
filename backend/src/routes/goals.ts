import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { getCacheValue, setCacheValue } from '../lib/cache';

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
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Goals'],
      security: [{ bearerAuth: [] }],
      querystring: goalsQuerySchema,
      response: { 200: goalsListResponseSchema },
    },
  }, async (request, reply) => {
    const user = request.user as { id: string };
    const { page, limit } = request.query as z.infer<typeof goalsQuerySchema>;

    const cacheKey = `goals:list:${user.id}:${page}:${limit}`;
    const cachedResult = await getCacheValue(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const skip = (page - 1) * limit;

    const where = { userId: user.id };
    const [items, total] = await Promise.all([
      db.savingsGoal.findMany({ where, skip, take: limit, orderBy: { deadline: 'asc' } }),
      db.savingsGoal.count({ where }),
    ]);

    const result = { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
    await setCacheValue(cacheKey, result, 1800000); // 30 minutes for stable data
    return result;
  });

  app.post('/goals', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['Goals'],
      security: [{ bearerAuth: [] }],
      body: goalBodySchema,
      response: { 200: goalResponseSchema },
    },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof goalBodySchema>;
    const user = request.user as { id: string };

    return db.savingsGoal.create({
      data: {
        ...body,
        deadline: new Date(body.deadline),
        userId: user.id,
      },
    });
  });

  app.patch('/goals/:id', {
    preHandler: [(app as any).authenticate],
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
    const user = request.user as { id: string };
    
    // Convert deadline string to Date if provided
    const updateData = { ...body };
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline) as any;
    }

    const updated = await db.savingsGoal.updateMany({ where: { id, userId: user.id }, data: updateData });
    if (updated.count === 0) {
      return reply.status(404).send({ message: 'Goal not found' });
    }

    return db.savingsGoal.findFirst({ where: { id, userId: user.id } });
  });

  app.delete('/goals/:id', {
    preHandler: [(app as any).authenticate],
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
    const user = request.user as { id: string };
    const deleted = await db.savingsGoal.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) {
      return reply.status(404).send({ message: 'Goal not found' });
    }
    return reply.status(204).send();
  });
}
