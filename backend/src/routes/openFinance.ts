import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { writeAuditLog } from '../lib/audit';
import { getCacheValue, setCacheValue } from '../lib/cache';
import { getConnectToken, syncBankConnection } from '../services/pluggy';

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const syncParamsSchema = z.object({ itemId: z.string().trim().min(1).max(191) });
const accountSchema = z.object({
  id: z.string(),
}).passthrough();
const connectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pluggyItemId: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  accounts: z.array(accountSchema).optional(),
}).passthrough();
const paginatedConnectionsSchema = z.object({
  items: z.array(connectionSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
const accessTokenResponseSchema = z.object({ accessToken: z.string() });
const webhookAcceptedSchema = z.object({ ok: z.boolean() });
const openFinanceErrorSchema = z.object({ error: z.string() });
const OPEN_FINANCE_MAX_WEBHOOK_BYTES = 100_000;
const OPEN_FINANCE_MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
const allowedWebhookEvents = new Set(['item/created', 'item/updated']);
const CONNECT_TOKEN_CACHE_TTL_MS = 60 * 1000;

const openFinanceWebhookEventSchema = z.object({
  event: z.string().min(1),
  itemId: z.string().min(1).optional(),
}).passthrough();

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashForAudit(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function getHeaderValue(headers: Record<string, unknown>, ...headerNames: string[]): string | undefined {
  for (const headerName of headerNames) {
    const headerValue = headers[headerName];
    if (typeof headerValue === 'string' && headerValue.trim()) {
      return headerValue.trim();
    }
  }

  return undefined;
}

function safeCompare(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

type WebhookVerificationResult =
  | { ok: true; mode: 'insecure-dev-override' | 'shared-secret' | 'hmac-signature' }
  | { ok: false; statusCode: number; error: string };

function verifyWebhookRequest(payload: unknown, headers: Record<string, unknown>): WebhookVerificationResult {
  const sharedSecret = process.env.OPEN_FINANCE_WEBHOOK_SECRET?.trim();
  const signingSecret = process.env.OPEN_FINANCE_WEBHOOK_SIGNING_SECRET?.trim();
  const insecureWebhookAllowed = process.env.OPEN_FINANCE_ALLOW_INSECURE_WEBHOOKS === 'true';

  if (!sharedSecret && !signingSecret) {
    if (insecureWebhookAllowed && process.env.NODE_ENV !== 'production') {
      return { ok: true, mode: 'insecure-dev-override' as const };
    }

    return {
      ok: false,
      statusCode: 503,
      error: 'Webhook Open Finance desabilitado: configure OPEN_FINANCE_WEBHOOK_SECRET ou OPEN_FINANCE_WEBHOOK_SIGNING_SECRET.',
    };
  }

  const authorizationHeader = getHeaderValue(headers, 'authorization');
  const providedSharedSecret = getHeaderValue(
    headers,
    'x-open-finance-webhook-secret',
    'x-webhook-secret',
    'x-pluggy-webhook-secret',
  ) ?? (authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7).trim() : undefined);

  if (sharedSecret && providedSharedSecret && safeCompare(sharedSecret, providedSharedSecret)) {
    return { ok: true, mode: 'shared-secret' as const };
  }

  const providedSignature = getHeaderValue(
    headers,
    'x-open-finance-signature',
    'x-pluggy-signature',
    'x-webhook-signature',
  );
  const timestamp = getHeaderValue(
    headers,
    'x-open-finance-timestamp',
    'x-pluggy-timestamp',
    'x-webhook-timestamp',
  );

  if (signingSecret && providedSignature && timestamp) {
    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp) || Math.abs(Date.now() - parsedTimestamp) > OPEN_FINANCE_MAX_TIMESTAMP_SKEW_MS) {
      return {
        ok: false,
        statusCode: 401,
        error: 'Webhook Open Finance com timestamp inválido.',
      };
    }

    const normalizedSignature = providedSignature.replace(/^sha256=/i, '');
    const payloadToSign = `${timestamp}.${stableStringify(payload)}`;
    const expectedSignature = crypto.createHmac('sha256', signingSecret).update(payloadToSign).digest('hex');

    if (safeCompare(expectedSignature, normalizedSignature)) {
      return { ok: true, mode: 'hmac-signature' as const };
    }
  }

  return {
    ok: false,
    statusCode: 401,
    error: 'Webhook Open Finance não autenticado.',
  };
}

export async function openFinanceRoutes(app: FastifyInstance) {
  // Configs
  app.addHook('preHandler', async (request, reply) => {
    // Se for rota de webhook, ignora a autenticação normal
    if (request.url.includes('/webhook')) return;

    try {
      await app.authenticate(request, reply);
    } catch (err) {
      if (reply.sent) return;
      return reply.status(401).send({ error: 'Não autorizado ou assinatura necessária' });
    }
  });

  // GET Token para iniciar ou editar conexão
  // Retorna um accessToken do Pluggy
  app.get('/open-finance/token', {
    schema: {
      tags: ['Open Finance'],
      security: [{ bearerAuth: [] }],
      response: {
        200: accessTokenResponseSchema,
        500: openFinanceErrorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      request.log.info({ event: 'open-finance-token-request', userId: request.user.id });
      const cacheKey = `open-finance:connect-token:${request.user.id}`;
      const cachedToken = await getCacheValue<string>(cacheKey);
      if (cachedToken) {
        return { accessToken: cachedToken };
      }

      const token = await getConnectToken();
      await setCacheValue(cacheKey, token, CONNECT_TOKEN_CACHE_TTL_MS);
      await writeAuditLog({
        userId: request.user.id,
        action: 'OPEN_FINANCE_CONNECT_TOKEN_ISSUED',
        resource: 'open_finance_token',
      });
      return { accessToken: token };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // GET Bancos já conectados do usuário atual
  app.get('/open-finance/connections', {
    schema: {
      tags: ['Open Finance'],
      security: [{ bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: {
        200: paginatedConnectionsSchema,
        500: openFinanceErrorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { page, limit } = request.query as z.infer<typeof paginationQuerySchema>;
      const where = { userId: request.user.id };
      request.log.info({ event: 'open-finance-connections-list', userId: request.user.id, page, limit });
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        db.bankConnection.findMany({
          where,
          include: { accounts: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.bankConnection.count({ where }),
      ]);

      return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao buscar conexões' });
    }
  });

  // POST Sync Manual / Force Sync
  app.post('/open-finance/sync/:itemId', {
    schema: {
      tags: ['Open Finance'],
      security: [{ bearerAuth: [] }],
      params: syncParamsSchema,
      response: {
        200: z.unknown(),
        403: openFinanceErrorSchema,
        500: openFinanceErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { itemId } = request.params as z.infer<typeof syncParamsSchema>;
    try {
      request.log.info({ event: 'open-finance-sync-request', userId: request.user.id, itemIdHash: hashForAudit(itemId) });
      const existingConnection = await db.bankConnection.findUnique({
        where: { pluggyItemId: itemId },
      });

      if (existingConnection && existingConnection.userId !== request.user.id) {
        return reply.status(403).send({ error: 'Acesso negado a esta conexão bancária' });
      }

      const result = await syncBankConnection(itemId, request.user.id);
      await writeAuditLog({
        userId: request.user.id,
        action: 'OPEN_FINANCE_SYNC_REQUESTED',
        resource: 'bank_connection',
        resourceId: existingConnection?.id,
        metadata: { itemIdHash: hashForAudit(itemId) },
      });
      return result;
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao sincronizar' });
    }
  });

  // POST Webhook (Público, Pluggy vai enviar POSTs aqui)
  app.post('/open-finance/webhook', {
    schema: {
      tags: ['Open Finance'],
      body: openFinanceWebhookEventSchema,
      response: {
        202: webhookAcceptedSchema,
        400: openFinanceErrorSchema,
        401: openFinanceErrorSchema,
        500: openFinanceErrorSchema,
        503: openFinanceErrorSchema,
      },
    },
  }, async (request, reply) => {
    const payloadSize = Buffer.byteLength(stableStringify(request.body), 'utf8');
    if (payloadSize > OPEN_FINANCE_MAX_WEBHOOK_BYTES) {
      return reply.status(400).send({ error: 'Payload de webhook excede limite permitido.' });
    }

    const authResult = verifyWebhookRequest(request.body, request.headers as Record<string, unknown>);

    if (!authResult.ok) {
      request.log.warn({
        event: 'open-finance-webhook-rejected',
        statusCode: authResult.statusCode,
        reason: authResult.error,
      });
      if (authResult.statusCode === 503) {
        return reply.status(503).send({ error: authResult.error });
      }

      return reply.status(401).send({ error: authResult.error });
    }

    const parseResult = openFinanceWebhookEventSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Payload de webhook inválido' });
    }

    const event = parseResult.data;
    if (!allowedWebhookEvents.has(event.event)) {
      return reply.status(400).send({ error: 'Evento de webhook não suportado.' });
    }

    request.log.info({
      event: 'open-finance-webhook-received',
      type: event.event,
      authMode: authResult.mode,
      payloadSize,
      itemIdHash: event.itemId ? hashForAudit(event.itemId) : undefined,
    });
    
    try {
      await writeAuditLog({
        action: 'OPEN_FINANCE_WEBHOOK_RECEIVED',
        resource: 'open_finance_webhook',
        resourceId: event.itemId,
        metadata: {
          event: event.event,
          authMode: authResult.mode,
          itemIdHash: event.itemId ? hashForAudit(event.itemId) : undefined,
        },
      });

      if (event.event === 'item/created') {
        // Encontrar quem é o dono desse webhook
        // (Na prática precisamos amarrar o evento ao usuário, aqui usamos um mock ou o `clientUserId` mapeado pela API)
      }

      if (event.event === 'item/updated' && event.itemId) {
        request.log.info({ event: 'open-finance-item-updated', itemIdHash: hashForAudit(event.itemId) });
        const connection = await db.bankConnection.findUnique({ where: { pluggyItemId: event.itemId } });
        if (connection) {
          await syncBankConnection(event.itemId, connection.userId);
        } else {
          request.log.warn({ event: 'open-finance-item-not-found', itemIdHash: hashForAudit(event.itemId) });
        }
      }

      return reply.status(202).send({ ok: true });
    } catch (error) {
      request.log.error({ event: 'open-finance-webhook-error', error });
      return reply.status(500).send({ error: 'Erro ao processar evento' });
    }
  });
}
