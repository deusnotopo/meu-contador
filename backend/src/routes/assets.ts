import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getCacheValue, setCacheValue } from '../lib/cache';

const FIPE_API = 'https://parallelum.com.br/fipe/api/v1';

export async function assetRoutes(app: FastifyInstance) {
  // 1. Marcas
  app.get('/assets/fipe/brands/:type', {
    schema: {
      tags: ['Assets'],
      summary: 'Lista marcas de veículos da Tabela FIPE',
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
      }),
    },
  }, async (req, reply) => {
    const { type } = req.params as { type: string };
    const cacheKey = `fipe:brands:${type}`;
    const cached = await getCacheValue<any>(cacheKey);
    if (cached) return reply.send({ records: cached });

    try {
      const res = await fetch(`${FIPE_API}/${type}/marcas`);
      if (!res.ok) throw new Error('FIPE API Down');
      const data = await res.json();
      await setCacheValue(cacheKey, data, 7 * 24 * 60 * 60 * 1000);
      return reply.send({ records: data });
    } catch (err) {
      return reply.status(502).send({ message: 'Erro ao conectar com FIPE API' });
    }
  });

  // 2. Modelos
  app.get('/assets/fipe/models/:type/:brandId', {
    schema: {
      tags: ['Assets'],
      summary: 'Lista modelos de uma marca específica',
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
        brandId: z.string(),
      }),
    },
  }, async (req, reply) => {
    const { type, brandId } = req.params as { type: string, brandId: string };
    const cacheKey = `fipe:models:${type}:${brandId}`;
    const cached = await getCacheValue<any>(cacheKey);
    if (cached) return reply.send({ records: { modelos: cached.modelos || cached } });

    try {
      const res = await fetch(`${FIPE_API}/${type}/marcas/${brandId}/modelos`);
      if (!res.ok) throw new Error('FIPE API Down');
      const data = await res.json();
      await setCacheValue(cacheKey, data, 7 * 24 * 60 * 60 * 1000);
      return reply.send({ records: { modelos: data.modelos || data } });
    } catch (err) {
      return reply.status(502).send({ message: 'Erro ao buscar modelos FIPE' });
    }
  });

  // 3. Anos
  app.get('/assets/fipe/years/:type/:brandId/:modelId', {
    schema: {
      tags: ['Assets'],
      summary: 'Lista anos disponíveis para um modelo',
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
        brandId: z.string(),
        modelId: z.string(),
      }),
    },
  }, async (req, reply) => {
    const { type, brandId, modelId } = req.params as { type: string, brandId: string, modelId: string };
    const cacheKey = `fipe:years:${type}:${brandId}:${modelId}`;
    const cached = await getCacheValue<any>(cacheKey);
    if (cached) return reply.send({ records: cached });

    try {
      const res = await fetch(`${FIPE_API}/${type}/marcas/${brandId}/modelos/${modelId}/anos`);
      if (!res.ok) throw new Error('FIPE API Down');
      const data = await res.json();
      await setCacheValue(cacheKey, data, 7 * 24 * 60 * 60 * 1000);
      return reply.send({ records: data });
    } catch (err) {
      return reply.status(502).send({ message: 'Erro ao buscar anos FIPE' });
    }
  });

  // 4. Avaliação Específica
  app.get('/assets/fipe/valuation/:type/:brandId/:modelId/:yearId', {
    schema: {
      tags: ['Assets'],
      summary: 'Busca avaliação específica do veículo na FIPE',
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
        brandId: z.string(),
        modelId: z.string(),
        yearId: z.string(),
      }),
    },
  }, async (req, reply) => {
    const { type, brandId, modelId, yearId } = req.params as { type: string, brandId: string, modelId: string, yearId: string };
    const cacheKey = `fipe:val:${type}:${brandId}:${modelId}:${yearId}`;
    const cached = await getCacheValue<any>(cacheKey);
    if (cached) return reply.send({ records: cached });

    try {
      const res = await fetch(`${FIPE_API}/${type}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);
      if (!res.ok) throw new Error('FIPE API Down');
      const data = await res.json();
      await setCacheValue(cacheKey, data, 24 * 60 * 60 * 1000); // 1 dia
      return reply.send({ records: data });
    } catch (err) {
      return reply.status(502).send({ message: 'Erro ao buscar preco especifico FIPE' });
    }
  });

  // 5. Genérico (BrasilAPI default)
  app.get('/assets/fipe/price/:fipeCode', {
    schema: {
      tags: ['Assets'],
      summary: 'Busca preco Brasil API',
      params: z.object({ fipeCode: z.string() }),
    },
  }, async (req, reply) => {
    const { fipeCode } = req.params as { fipeCode: string };
    const res = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${fipeCode}`);
    const data = await res.json();
    return reply.send({ records: data });
  });
}
