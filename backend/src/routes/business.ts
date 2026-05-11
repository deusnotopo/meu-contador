import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as BusinessService from '../services/BusinessService.js';

export async function businessRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /business/cnpj/:cnpj — Public Data Lookup
  app.get('/business/cnpj/:cnpj', {
    schema: {
      tags: ['Business'],
      summary: 'Consulta dados cadastrais de um CNPJ via BrasilAPI (Receita Federal)',
      security: [{ bearerAuth: [] }],
      params: z.object({
        cnpj: z.string().min(14).max(18),
      }),
      response: {
        200: z.object({
          cnpj: z.string(),
          razao_social: z.string(),
          nome_fantasia: z.string().optional(),
          situacao_cadastral: z.string(),
          data_inicio_atividade: z.string().optional(),
          cnae_fiscal_descricao: z.string().optional(),
          endereco: z.object({
            logradouro: z.string(),
            numero: z.string(),
            bairro: z.string(),
            municipio: z.string(),
            uf: z.string(),
            cep: z.string(),
          }).optional(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        502: z.object({ message: z.string() }),
      },
    },
  }, async (req, reply) => {
    const { cnpj } = req.params as { cnpj: string };
    
    try {
      const data = await BusinessService.getCompanyByCnpj(cnpj);
      return data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg === 'CNPJ_NOT_FOUND') {
        return reply.status(404).send({ message: 'CNPJ não encontrado' });
      }
      if (msg === 'CNPJ inválido') {
        return reply.status(400).send({ message: 'CNPJ inválido' });
      }
      
      req.log.error(error);
      return reply.status(502).send({ message: 'Erro ao consultar Receita Federal via BrasilAPI' });
    }
  });
}
