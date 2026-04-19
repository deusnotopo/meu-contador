import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as ProvisionService from '../services/ProvisionService.js';
import type { ProvisionInput } from '../services/ProvisionService.js';

const provisionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  month: z.number().int().min(1).max(12),
  yearlyAmount: z.number().nonnegative().max(100000000),
  accumulated: z.number().nonnegative().max(100000000).optional(),
});

const provisionResponseSchema = provisionSchema.extend({
  id: z.string(),
  accumulated: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export async function provisionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /provisions - Get all provisions for logged user
  app.get('/provisions', {
    schema: {
      tags: ['Provisions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ items: z.array(provisionResponseSchema) }),
      },
    },
  }, async (request) => {
    return ProvisionService.listProvisions(request.user.id);
  });

  // POST /provisions - Create new provision
  app.post('/provisions', {
    schema: {
      tags: ['Provisions'],
      security: [{ bearerAuth: [] }],
      body: provisionSchema,
      response: {
        201: provisionResponseSchema,
      },
    },
  }, async (request, reply) => {
    const data = request.body as z.infer<typeof provisionSchema>;
    const input: ProvisionInput = {
      name: data.name,
      month: data.month,
      yearlyAmount: data.yearlyAmount,
      accumulated: data.accumulated ?? 0,
    };
    const provision = await ProvisionService.createProvision(request.user.id, input);
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
        200: provisionResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as Partial<z.infer<typeof provisionSchema>>;
    const input: Partial<ProvisionInput> = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.month !== undefined && { month: data.month }),
      ...(data.yearlyAmount !== undefined && { yearlyAmount: data.yearlyAmount }),
      ...(data.accumulated !== undefined && { accumulated: data.accumulated }),
    };

    const provision = await ProvisionService.updateProvision(id, request.user.id, input);
    if (!provision) {
      return reply.status(404).send({ message: 'Provision not found' });
    }
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
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = await ProvisionService.deleteProvision(id, request.user.id);
    if (!success) {
      return reply.status(404).send({ message: 'Provision not found' });
    }
    return reply.status(204).send();
  });
}
