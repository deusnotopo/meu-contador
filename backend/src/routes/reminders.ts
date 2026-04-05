import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

const reminderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  category: z.string(),
  isPaid: z.boolean(),
  recurring: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const reminderSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  category: z.string(),
  isPaid: z.boolean().default(false),
  recurring: z.string().default('once'),
});

const reminderUpdateSchema = reminderSchema.partial();

export async function reminderRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    await (app as any).authenticate(request, reply);
  });

  app.get('/reminders', {
    schema: {
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(reminderResponseSchema),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;

    const reminders = await db.billReminder.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' },
    });
    
    return reminders;
  });

  app.post('/reminders', {
    schema: {
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      body: reminderSchema,
      response: {
        201: reminderResponseSchema,
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const data = request.body as z.infer<typeof reminderSchema>;

    const reminder = await db.billReminder.create({
      data: {
        ...data,
        userId,
      },
    });

    return reply.status(201).send(reminder);
  });

  app.put('/reminders/:id', {
    schema: {
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: reminderUpdateSchema,
      response: {
        200: reminderResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };
    const data = request.body as z.infer<typeof reminderUpdateSchema>;

    const existing = await db.billReminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Reminder not found' });
    }

    const updated = await db.billReminder.update({
      where: { id },
      data,
    });

    return updated;
  });

  app.delete('/reminders/:id', {
    schema: {
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const existing = await db.billReminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Reminder not found' });
    }

    await db.billReminder.delete({
      where: { id },
    });

    return reply.status(204).send();
  });
}
