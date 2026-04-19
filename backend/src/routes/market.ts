import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as MarketService from '../services/MarketService.js';

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
          selic: z.number(),
          cdi: z.number(),
          ipca: z.number(),
          poupanca: z.number(),
          btc_change: z.number().optional(),
          eth_change: z.number().optional(),
          usd_change: z.number().optional(),
          eur_change: z.number().optional(),
          gbp_change: z.number().optional(),
          ptax: z.any().optional(),
          cached: z.boolean(),
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
}
