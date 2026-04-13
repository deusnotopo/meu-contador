import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

const provisionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  month: z.number().int().min(1).max(12),
  yearlyAmount: z.number().nonnegative().max(100000000),
  accumulated: z.number().nonnegative().max(100000000).optional(),
});

export async function provisionRoutes(app: FastifyInstance) {
  // GET /provisions - Get all provisions for logged user
  app.get('/provisions', {
    schema: {
      tags: ['Provisions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ items: z.array(provisionSchema.extend({ id: z.string(), accumulated: z.number(), createdAt: z.date(), updatedAt: z.date() })) }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const provisions = await db.provision.findMany({
      where: { userId: request.user.id, deletedAt: null },
      orderBy: { month: 'asc' },
    });

    return { items: provisions };
  });

  // POST /provisions - Create new provision
  app.post('/provisions', {
    schema: {
      tags: ['Provisions'],
      security: [{ bearerAuth: [] }],
      body: provisionSchema,
      response: {
        201: provisionSchema.extend({ id: z.string(), accumulated: z.number() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const data = request.body as z.infer<typeof provisionSchema>;

    const provision = await db.provision.create({
      data: {
        userId: request.user.id,
        name: data.name,
        month: data.month,
        yearlyAmount: data.yearlyAmount,
        accumulated: data.accumulated || 0,
      },
    });

    return reply.status(201).send(provision);
  });

  // PUT /provisions/:id - Update provision
  app.put('/provisions/:id', {
    schema: {
      tags: ['Provisions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: provisionSchema.partial(),
      response: {
        200: provisionSchema.extend({ id: z.string(), accumulated: z.number() }),
        404: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as Partial<z.infer<typeof provisionSchema>>;

    const existing = await db.provision.findFirst({
      where: { id, userId: request.user.id, deletedAt: null },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Provision not found' });
    }

    const provision = await db.provision.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        month: data.month !== undefined ? data.month : undefined,
        yearlyAmount: data.yearlyAmount !== undefined ? data.yearlyAmount : undefined,
        accumulated: data.accumulated !== undefined ? data.accumulated : undefined,
      },
    });

    return provision;
  });

  // DELETE /provisions/:id - Soft delete provision
  app.delete('/provisions/:id', {
    schema: {
      tags: ['Provisions'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await db.provision.findFirst({
      where: { id, userId: request.user.id, deletedAt: null },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Provision not found' });
    }

    await db.provision.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return reply.status(204).send();
  });
}
