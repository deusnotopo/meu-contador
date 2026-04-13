import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getCacheValue, setCacheValue } from '../lib/cache';

export async function businessRoutes(app: FastifyInstance) {
  app.get('/business/cnpj/:cnpj', {
    schema: {
      tags: ['Business'],
      summary: 'Consulta dados cadastrais de um CNPJ via BrasilAPI (Receita Federal)',
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
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      return reply.status(400).send({ message: 'CNPJ inválido' });
    }

    const cacheKey = `business:cnpj:${cleanCnpj}`;
    const cached = await getCacheValue<any>(cacheKey);
    if (cached) return reply.send(cached);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        headers: {
          'User-Agent': 'MeuContador/1.0 (Enterprise Financial App)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 404) {
        return reply.status(404).send({ message: 'CNPJ não encontrado' });
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Business] BrasilAPI Error (${res.status}):`, errText);
        throw new Error(`BrasilAPI Down: ${res.status}`);
      }

      const data = await res.json() as any;
      
      const result = {
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        situacao_cadastral: data.descricao_situacao_cadastral,
        data_inicio_atividade: data.data_inicio_atividade,
        cnae_fiscal_descricao: data.cnae_fiscal_descricao,
        endereco: {
          logradouro: data.logradouro,
          numero: data.numero,
          bairro: data.bairro,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep,
        },
      };

      // Cache de 1 hora
      await setCacheValue(cacheKey, result, 60 * 60 * 1000);
      return reply.send(result);
    } catch (err) {
      console.error('[Business] CNPJ fetch error:', err);
      return reply.status(502).send({ message: 'Erro ao consultar Receita Federal via BrasilAPI' });
    }
  });
}
