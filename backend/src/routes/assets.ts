import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as AssetService from '../services/AssetService.js';

export async function assetRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // 1. Marcas
  app.get('/assets/fipe/brands/:type', {
    schema: {
      tags: ['Assets'],
      summary: 'Lista marcas de veículos da Tabela FIPE',
      security: [{ bearerAuth: [] }],
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
      }),
    },
  }, async (req) => {
    const { type } = req.params as { type: 'carros' | 'motos' | 'caminhoes' };
    const records = await AssetService.getFipeBrands(type);
    return { records };
  });

  // 2. Modelos
  app.get('/assets/fipe/models/:type/:brandId', {
    schema: {
      tags: ['Assets'],
      summary: 'Lista modelos de uma marca específica',
      security: [{ bearerAuth: [] }],
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
        brandId: z.string(),
      }),
    },
  }, async (req) => {
    const { type, brandId } = req.params as { type: 'carros' | 'motos' | 'caminhoes', brandId: string };
    const models = await AssetService.getFipeModels(type, brandId);
    return { records: { modelos: models } };
  });

  // 3. Anos
  app.get('/assets/fipe/years/:type/:brandId/:modelId', {
    schema: {
      tags: ['Assets'],
      summary: 'Lista anos disponíveis para um modelo',
      security: [{ bearerAuth: [] }],
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
        brandId: z.string(),
        modelId: z.string(),
      }),
    },
  }, async (req) => {
    const { type, brandId, modelId } = req.params as { type: 'carros' | 'motos' | 'caminhoes', brandId: string, modelId: string };
    const records = await AssetService.getFipeYears(type, brandId, modelId);
    return { records };
  });

  // 4. Avaliação Específica
  app.get('/assets/fipe/valuation/:type/:brandId/:modelId/:yearId', {
    schema: {
      tags: ['Assets'],
      summary: 'Busca avaliação específica do veículo na FIPE',
      security: [{ bearerAuth: [] }],
      params: z.object({
        type: z.enum(['carros', 'motos', 'caminhoes']),
        brandId: z.string(),
        modelId: z.string(),
        yearId: z.string(),
      }),
    },
  }, async (req) => {
    const { type, brandId, modelId, yearId } = req.params as { type: 'carros' | 'motos' | 'caminhoes', brandId: string, modelId: string, yearId: string };
    const records = await AssetService.getVehicleValuation(type, brandId, modelId, yearId);
    return { records };
  });

  // 5. Genérico
  app.get('/assets/fipe/price/:fipeCode', {
    schema: {
      tags: ['Assets'],
      summary: 'Busca preco Brasil API',
      security: [{ bearerAuth: [] }],
      params: z.object({ fipeCode: z.string() }),
    },
  }, async (req) => {
    const { fipeCode } = req.params as { fipeCode: string };
    const records = await AssetService.getPriceByFipeCode(fipeCode);
    return { records };
  });
}
