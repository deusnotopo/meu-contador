import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getCacheValue, setCacheValue } from '../lib/cache';

const BCB_CCR_URL = 'https://olinda.bcb.gov.br/olinda/servico/CCR/versao/v1/odata/InstituicoesFinanceirasAutorizadas';

interface BcbBank {
  Cnpj: string;
  Nome: string;
  CodCompe: string;
}

interface BcbBankResponse {
  value: BcbBank[];
}

export async function bankRoutes(app: FastifyInstance) {
  app.get('/market/banks', {
    schema: {
      tags: ['Market'],
      summary: 'Lista de instituições financeiras autorizadas pelo Banco Central',
      response: {
        200: z.array(z.object({
          code: z.string(),
          name: z.string(),
          cnpj: z.string(),
        })),
        502: z.object({ message: z.string() }),
      },
    },
  }, async (_req, reply) => {
    const cacheKey = 'market:banks';
    
    // Cache de longa duração (24 horas)
    const cached = await getCacheValue<any[]>(cacheKey);
    if (cached) return reply.send(cached);

    try {
      // 1. Tentar BCB (Primário)
      const res = await fetch(`${BCB_CCR_URL}?$format=json`, {
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = (await res.json()) as BcbBankResponse;
        const banks = (data.value || [])
          .filter(b => b.CodCompe && b.CodCompe.trim() !== '')
          .map(b => ({
            code: b.CodCompe.trim().padStart(3, '0'),
            name: b.Nome.trim(),
            cnpj: b.Cnpj.trim(),
          }))
          .sort((a, b) => a.code.localeCompare(b.code));

        if (banks.length > 0) {
          await setCacheValue(cacheKey, banks, 24 * 60 * 60 * 1000);
          return reply.send(banks);
        }
      }
      throw new Error('BCB returned no data or errored');
    } catch (err) {
      console.warn('[Banks] BCB failed, trying BrasilAPI fallback...', (err as Error).message);
      
      try {
        // 2. Fallback BrasilAPI
        const bRes = await fetch('https://brasilapi.com.br/api/banks/v1', {
          signal: AbortSignal.timeout(5000),
        });
        
        if (!bRes.ok) throw new Error('BrasilAPI also failed');
        
        const bData = await bRes.json() as any[];
        const banks = bData
          .filter(b => b.code !== null)
          .map(b => ({
            code: String(b.code).padStart(3, '0'),
            name: b.name,
            cnpj: 'N/A', // BrasilAPI banks/v1 doesn't have CNPJ for all
          }))
          .sort((a, b) => a.code.localeCompare(b.code));

        await setCacheValue(cacheKey, banks, 24 * 60 * 60 * 1000);
        return reply.send(banks);
      } catch (fbErr) {
        console.error('[Banks] Total failure:', (fbErr as Error).message);
        return reply.status(502).send({ message: 'Erro ao buscar dados das instituições financeiras' });
      }
    }
  });
}
