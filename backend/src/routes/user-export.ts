import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as ExportService from '../services/ExportService.js';

export async function userExportRoutes(app: FastifyInstance) {
  // GET /users/export - LGPD Data Export
  app.get('/users/export', {
    schema: {
      description: 'Exporta todos os dados do usuário (LGPD compliance)',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.any(),
        404: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate, app.proGuard],
  }, async (request, reply) => {
    const data = await ExportService.getUserFullData(request.user.id);

    if (!data) {
      return reply.status(404).send({ message: 'User not found' });
    }

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="user-data-${request.user.id}.json"`);
    
    return data;
  });
}
