import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { getCacheValue, setCacheValue } from '../lib/cache';

const invoiceResponseSchema = z.object({
  id: z.string(),
  number: z.string(),
  client: z.string(),
  amount: z.number(),
  dueDate: z.union([z.string(), z.date()]),
  status: z.string(),
  workspaceId: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

const invoiceSchema = z.object({
  number: z.string(),
  client: z.string(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  status: z.enum(['pending', 'paid', 'overdue']).default('pending'),
});

const invoiceUpdateSchema = invoiceSchema.partial();

function serializeInvoice(invoice: {
  id: string;
  number: string;
  client: string;
  amount: number;
  dueDate: Date;
  status: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...invoice,
    dueDate: invoice.dueDate.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

export async function invoiceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    await (app as any).authenticate(request, reply);
    await (app as any).proGuard(request, reply);
  });

  // Helper para pegar Workspace ID (já que Invoices pertencem a Workspaces)
  async function getWorkspaceId(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { currentWorkspaceId: true }
    });
    return user?.currentWorkspaceId || userId;
  }

  // Listar todas as invoices
  app.get('/invoices', {
    schema: {
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(invoiceResponseSchema),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const workspaceId = await getWorkspaceId(userId);

    const cacheKey = `invoices:list:${workspaceId}`;
    const cachedResult = await getCacheValue(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const invoices = await db.invoice.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { dueDate: 'desc' },
    });

    const result = invoices.map(serializeInvoice);
    await setCacheValue(cacheKey, result, 300000); // 5 minutes for volatile data
    return result;
  });

  // Criar uma nova invoice
  app.post('/invoices', {
    schema: {
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      body: invoiceSchema,
      response: {
        201: invoiceResponseSchema,
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const workspaceId = await getWorkspaceId(userId);
    const data = request.body as z.infer<typeof invoiceSchema>;

    const invoice = await db.invoice.create({
      data: {
        ...data,
        workspaceId,
      },
    });

    return reply.status(201).send(serializeInvoice(invoice));
  });

  // Atualizar uma invoice
  app.put('/invoices/:id', {
    schema: {
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: invoiceUpdateSchema,
      response: {
        200: invoiceResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = request.params as { id: string };
    const data = request.body as z.infer<typeof invoiceUpdateSchema>;

    // Verificar posse
    const existing = await db.invoice.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Invoice not found' });
    }

    const updated = await db.invoice.update({
      where: { id },
      data,
    });

    return serializeInvoice(updated);
  });

  // Excluir uma invoice
  app.delete('/invoices/:id', {
    schema: {
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = request.params as { id: string };

    const existing = await db.invoice.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });

    if (!existing) {
      return reply.status(404).send({ message: 'Invoice not found' });
    }

    await db.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return reply.status(204).send();
  });
}
