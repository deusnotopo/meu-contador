import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as StatementService from '../services/StatementService.js';

export async function statementsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.post('/statements/upload', {
    schema: {
      tags: ['Statements'],
      security: [{ bearerAuth: [] }],
      description: 'Upload de extrato bancário para extração via IA',
    }
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ message: 'Arquivo não enviado.' });
    }

    // Resilience: abort if connection closes
    const abortController = new AbortController();
    request.raw.on('close', () => {
      if (!reply.sent) abortController.abort();
    });

    try {
      const buffer = await data.toBuffer();
      const transactions = await StatementService.parseStatement(
        buffer, 
        data.mimetype, 
        abortController.signal
      );

      return { transactions };
    } catch (err: unknown) {
      app.log.error({ err }, 'Error processing statement upload');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(500).send({ message: 'Falha interna ao processar documento', error: msg });
    }
  });
}
