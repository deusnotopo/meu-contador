import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as InvoiceService from '../services/InvoiceService.js';

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

export async function invoiceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    await app.authenticate(request, reply);
    await app.proGuard(request, reply);
  });

  // List all invoices
  app.get('/invoices', {
    schema: {
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(invoiceResponseSchema),
      },
    },
  }, async (request) => {
    return InvoiceService.listInvoices(request.user.id);
  });

  // Create a new invoice
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
    const data = request.body as z.infer<typeof invoiceSchema>;
    const invoice = await InvoiceService.createInvoice(request.user.id, data);
    return reply.status(201).send(invoice);
  });

  // Update an invoice
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
    const { id } = request.params as { id: string };
    const data = request.body as z.infer<typeof invoiceUpdateSchema>;

    const invoice = await InvoiceService.updateInvoice(id, request.user.id, data);
    if (!invoice) {
      return reply.status(404).send({ message: 'Invoice not found' });
    }
    return invoice;
  });

  // Delete an invoice
  app.delete('/invoices/:id', {
    schema: {
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = await InvoiceService.deleteInvoice(id, request.user.id);
    if (!success) {
      return reply.status(404).send({ message: 'Invoice not found' });
    }
    return reply.status(204).send();
  });
}
