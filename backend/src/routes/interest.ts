import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getCacheValue, setCacheValue } from '../lib/cache';
import { logger } from '../lib/logger.js';

const BCB_INTEREST_URL = 'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo';

export async function interestRoutes(app: FastifyInstance) {
  app.get('/market/interest-rates', {
    schema: {
      tags: ['Market'],
      summary: 'Compara taxas de juros por instituição financeira (BCB Olinda)',
      querystring: z.object({
        type: z.string().optional(), // ex: 'Empréstimo pessoal'
      }),
    },
  }, async (req, reply) => {
    const { type } = req.query as { type?: string };
    const modalidade = type || 'Pessoa Física - Empréstimo pessoal não consignado';
    
    const cacheKey = `interest:rates:${modalidade}`;
    const cached = await getCacheValue<unknown[]>(cacheKey);
    if (cached) return reply.send(cached);

    try {
      // Filtramos por modalidade e pegamos as taxas mais recentes
      const filter = `Modalidade eq '${modalidade}'`;
      const url = `${BCB_INTEREST_URL}?$filter=${encodeURIComponent(filter)}&$orderby=TaxaJurosAoMes asc&$format=json&$top=100`;
      
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error('BCB Olinda Interest API Down');

      const data = await res.json() as { value: Record<string, unknown>[] };
      const rates = (data.value || []).map((r: Record<string, unknown>) => ({
        institution: r.InstituicaoFinanceira,
        monthly_rate: r.TaxaJurosAoMes,
        annual_rate: r.TaxaJurosAoAno,
        period_start: r.InicioPeriodo,
        period_end: r.FimPeriodo,
      }));

      // Cache de 12 horas
      await setCacheValue(cacheKey, rates, 12 * 60 * 60 * 1000);
      return reply.send(rates);
    } catch (err) {
      logger.error('[Interest] Error fetching rates', err);
      return reply.status(502).send({ message: 'Erro ao buscar taxas de juros no Banco Central' });
    }
  });

  // Helper para listar modalidades disponíveis (estático ou dinâmico)
  app.get('/market/interest-modalidades', async () => {
    return [
      'Pessoa Física - Empréstimo pessoal não consignado',
      'Pessoa Física - Empréstimo pessoal consignado público',
      'Pessoa Física - Cheque especial',
      'Pessoa Física - Aquisição de veículos',
      'Pessoa Jurídica - Capital de giro girado no exterior',
      'Pessoa Jurídica - Desconto de duplicatas',
    ];
  });
}
