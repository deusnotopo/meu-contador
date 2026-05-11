import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as MarketService from '../services/MarketService.js';
import * as CentralBankGateway from '../gateways/CentralBankGateway.js';
import { db } from '../lib/db.js';
import { logger } from '../lib/logger.js';

export async function marketRoutes(app: FastifyInstance) {
  // GET /market/data
  app.get('/market/data', {
    schema: {
      tags: ['Market'],
      response: {
        200: z.object({
          updatedAt: z.string(),
          btc: z.number(),
          eth: z.number(),
          usd: z.number(),
          eur: z.number(),
          gbp: z.number(),
          selic: z.number().nullable(),
          cdi: z.number().nullable(),
          ipca: z.number().nullable(),
          poupanca: z.number().nullable(),
          btc_change: z.number().optional(),
          eth_change: z.number().optional(),
          usd_change: z.number().optional(),
          eur_change: z.number().optional(),
          gbp_change: z.number().optional(),
          ptax: z.any().optional(),
          cached: z.boolean(),
          dataAvailability: z.object({
            selic: z.boolean(),
            cdi: z.boolean(),
            ipca: z.boolean(),
            crypto: z.boolean(),
            forex: z.boolean(),
          }).optional(),
        }),
      },
    },
  }, async () => {
    return MarketService.getMarketOverview();
  });

  // GET /market/quotes?tickers=BOVA11,PETR4
  app.get('/market/quotes', {
    schema: {
      tags: ['Market'],
      querystring: z.object({ tickers: z.string() }),
    },
  }, async (request) => {
    const tickers = (request.query as { tickers: string }).tickers
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);
    
    return MarketService.getQuotes(tickers);
  });

  // GET /market/tesouro
  app.get('/market/tesouro', {
    schema: {
      tags: ['Market'],
    },
  }, async () => {
    return MarketService.getTesouro();
  });

  // GET /market/interest-rates?modality=CREDITO+PESSOAL+NAO+CONSIGNADO
  // Fonte: API pública BCB (IF.data) — sem autenticação, cache 1h
  app.get('/market/interest-rates', {
    schema: {
      tags: ['Market'],
      querystring: z.object({
        modality: z.string().min(1),
        $top: z.coerce.number().int().min(1).max(100).optional().default(20),
      }),
    },
  }, async (request) => {
    const { modality, $top } = request.query as { modality: string; $top?: number };
    const startTime = Date.now();
    
    try {
      // Akita Mode: Database-First lookup using optimized composite index
      const records = await db.marketInterestRate.findMany({
        where: { modality },
        orderBy: { monthlyRate: 'asc' },
        take: $top ?? 20,
      });

      const duration = Date.now() - startTime;
      logger.info(`[InterestRates] Lookup concluído em ${duration}ms (DB-First)`, { modality, count: records.length });

      if (records.length > 0) {
        return { records, cached: true, duration: `${duration}ms` };
      }

      // Fallback Cold-Start: Se o banco estiver vazio, busca na API (lento) e sinaliza necessidade de sync
      logger.warn(`[InterestRates] Banco vazio para ${modality}. Iniciando fallback lento para API externa...`);
      const externalRecords = await CentralBankGateway.fetchInterestRates(modality, $top ?? 20);
      
      // Retorna o resultado externo mas avisa que o performance-mode está desativado
      return { 
        records: externalRecords, 
        cached: false, 
        warning: 'Cold start: dados populados via API externa (lento). Sync automático agendado.',
        duration: `${Date.now() - startTime}ms`
      };
    } catch (error) {
      logger.error('[InterestRates] Falha na consulta de taxas', error);
      return { records: [], error: 'Erro ao recuperar taxas de juros' };
    }
  });
}
