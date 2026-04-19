import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as EmotionalService from '../services/EmotionalService.js';
import type { EmotionalFilters } from '../services/EmotionalService.js';
import type { EmotionalEntry } from '../repositories/EmotionalRepository.js';

const emotionalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  emotion: z.enum(['happy', 'sad', 'anxious', 'stressed', 'excited', 'guilty', 'proud', 'neutral', 'angry', 'frustrated']),
  amount: z.number().optional(),
  category: z.string().optional(),
  motivation: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  regretLevel: z.number().min(1).max(5).optional(),
  satisfactionLevel: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export async function emotionalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /emotional - Retrieve emotional entries
  app.get('/emotional', {
    schema: {
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        emotion: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50).optional(),
      }),
    },
  }, async (request) => {
    return EmotionalService.listEntries(request.user.id, request.query as unknown as EmotionalFilters);
  });

  // POST /emotional - Add new emotional entry
  app.post('/emotional', {
    schema: {
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      body: emotionalEntrySchema.omit({ id: true, date: true }),
    },
  }, async (request, reply) => {
    const entry = await EmotionalService.addEntry(request.user.id, request.body as unknown as Omit<EmotionalEntry, 'id' | 'date'>);
    return reply.code(201).send(entry);
  });

  // PUT /emotional/:id - Update emotional entry
  app.put('/emotional/:id', {
    schema: {
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      body: emotionalEntrySchema.partial().omit({ id: true, date: true }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updated = await EmotionalService.updateEntry(request.user.id, id, request.body as unknown as Partial<Omit<EmotionalEntry, 'id' | 'date'>>);
    if (!updated) return reply.status(404).send({ message: 'Journal entry not found' });
    return updated;
  });

  // DELETE /emotional/:id - Delete emotional entry
  app.delete('/emotional/:id', {
    schema: {
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = await EmotionalService.deleteEntry(request.user.id, id);
    if (!success) return reply.status(404).send({ message: 'Journal entry not found' });
    return { success: true };
  });

  // GET /emotional/patterns - Get emotional patterns and insights
  app.get('/emotional/patterns', {
    schema: {
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    return EmotionalService.getPatternsAndInsights(request.user.id);
  });
}