import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { writeAuditLog } from '../lib/audit.js';
import * as WebhookSecurity from '../lib/WebhookSecurity.js';
import * as OpenFinanceService from '../services/OpenFinanceService.js';

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const syncParamsSchema = z.object({ itemId: z.string().trim().min(1).max(191) });

const openFinanceWebhookEventSchema = z.object({
  event: z.string().min(1),
  itemId: z.string().min(1).optional(),
}).passthrough();

export async function openFinanceRoutes(app: FastifyInstance) {
  const allowInsecureWebhook = process.env.NODE_ENV !== 'production'
    && process.env.OPEN_FINANCE_ALLOW_INSECURE_WEBHOOKS === 'true';
  
  // GET /open-finance/token
  app.get('/open-finance/token', {
    schema: {
      tags: ['Open Finance'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ accessToken: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const token = await OpenFinanceService.getConnectToken(request.user.id);
    return { accessToken: token };
  });

  // GET /open-finance/connections
  app.get('/open-finance/connections', {
    schema: {
      tags: ['Open Finance'],
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { page, limit } = request.query as z.infer<typeof paginationQuerySchema>;
    return OpenFinanceService.listUserConnections(request.user.id, page, limit);
  });

  // POST /open-finance/sync/:itemId
  app.post('/open-finance/sync/:itemId', {
    schema: {
      tags: ['Open Finance'],
      security: [{ bearerAuth: [] }],
      params: syncParamsSchema,
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { itemId } = request.params as z.infer<typeof syncParamsSchema>;
    try {
      return await OpenFinanceService.syncConnection(request.user.id, itemId);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'FORBIDDEN_WORKSPACE_CONNECTION') {
        return reply.code(403).send({ error: 'Access denied to this connection' });
      }
      throw error;
    }
  });

  // POST /open-finance/webhook (PUBLIC)
  app.post('/open-finance/webhook', {
    schema: {
      tags: ['Open Finance'],
      body: openFinanceWebhookEventSchema,
    },
  }, async (request, reply) => {
    const authResult = WebhookSecurity.verify(request.body, {
      signature: request.headers['x-pluggy-signature'] as string,
      timestamp: request.headers['x-pluggy-timestamp'] as string,
      secret: request.headers['x-pluggy-webhook-secret'] as string
    }, {
      sharedSecret: process.env.OPEN_FINANCE_WEBHOOK_SECRET,
      signingSecret: process.env.OPEN_FINANCE_WEBHOOK_SIGNING_SECRET,
      allowInsecure: allowInsecureWebhook,
    });

    if (!authResult.ok) {
      request.log.warn({ event: 'webhook-rejected', ...authResult });
      return reply.code(authResult.statusCode).send({ error: authResult.error });
    }

    const { itemId, event } = request.body as z.infer<typeof openFinanceWebhookEventSchema>;

    if (event === 'item/updated' && itemId) {
      try {
        await OpenFinanceService.handleWebhookEvent(itemId, event);
        await writeAuditLog({
          action: 'OPEN_FINANCE_WEBHOOK_PROCESSED',
          resource: 'bank_connection',
          resourceId: itemId,
          metadata: { event }
        });
      } catch (error) {
        request.log.error(error);
      }
    }

    return reply.code(202).send({ ok: true });
  });
}
