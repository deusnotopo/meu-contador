import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Readable } from 'stream';
import * as AiService from '../services/AiService.js';

const aiConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

const aiProxyBodySchema = z.object({
  conversation: z.array(aiConversationMessageSchema).optional(),
  userMessage: z.string().trim().min(1).max(2000).optional(),
  financialSnapshot: z.any().optional(), // Snapshot opaco passado para a LLM
  systemContext: z.string().max(4000).optional(), // Contexto pedagógico/financeiro injetado pelo frontend
});

const predictCategoryBodySchema = z.object({
  description: z.string().min(1),
  amount: z.number().optional().default(0),
});

export async function aiRoutes(app: FastifyInstance) {
  // POST /ai-proxy — Full conversation with Gemini (financial advisor mode)
  app.post('/ai-proxy', {
    config: {
      rateLimit: { max: 12, timeWindow: '1 minute' },
    },
    schema: {
      tags: ['AI'],
      security: [{ bearerAuth: [] }],
      body: aiProxyBodySchema,
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Transfer-Encoding', 'chunked');
    reply.header('Cache-Control', 'no-cache');
    return reply.send(Readable.from(AiService.askGemini(request.user.id, request.body as AiService.AiPayload)));
  });

  app.post('/api/ai/predict', {
    schema: { 
      tags: ['AI'], 
      security: [{ bearerAuth: [] }],
      body: predictCategoryBodySchema,
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { description, amount } = request.body as z.infer<typeof predictCategoryBodySchema>;
    return AiService.predictTransaction(description, amount ?? 0);
  });

  // POST /ai/predict-category — Used by TransactionsView "Sugerir Categoria"
  // Returns suggestedCategory (string) + confidence (0-1)
  app.post('/ai/predict-category', {
    schema: {
      tags: ['AI'],
      security: [{ bearerAuth: [] }],
      body: predictCategoryBodySchema,
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { description, amount } = request.body as z.infer<typeof predictCategoryBodySchema>;
    return AiService.predictTransaction(description, amount ?? 0);
  });
}
