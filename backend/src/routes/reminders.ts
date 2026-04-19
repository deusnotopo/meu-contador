import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as ReminderService from '../services/ReminderService.js';

const reminderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  dueDate: z.union([z.string(), z.date()]),
  category: z.string(),
  isPaid: z.boolean(),
  recurring: z.string(),
  userId: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
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
  app.addHook('preHandler', app.authenticate);

  app.get('/reminders', {
    schema: {
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(reminderResponseSchema),
      },
    },
  }, async (request) => {
    return ReminderService.listReminders(request.user.id);
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
    const data = request.body as z.infer<typeof reminderSchema>;
    const reminder = await ReminderService.createReminder(request.user.id, data);
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
    const { id } = request.params as { id: string };
    const data = request.body as z.infer<typeof reminderUpdateSchema>;

    const reminder = await ReminderService.updateReminder(id, request.user.id, data);
    if (!reminder) {
      return reply.status(404).send({ message: 'Reminder not found' });
    }
    return reminder;
  });

  app.delete('/reminders/:id', {
    schema: {
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = await ReminderService.deleteReminder(id, request.user.id);
    if (!success) {
      return reply.status(404).send({ message: 'Reminder not found' });
    }
    return reply.status(204).send();
  });
}
