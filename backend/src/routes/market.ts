/**
 * 📈 Market Data Routes — Meu Contador
 *
 * Centraliza todas as chamadas a APIs externas de mercado:
 *  - GET /api/market/data   → BTC, ETH, USD, Selic, CDI, IPCA, Poupança
 *  - GET /api/market/quotes → cotações de ações/ETFs via BRAPI
 *  - GET /api/market/tesouro → títulos do Tesouro Direto
 *
 * Token BRAPI permanece no servidor (não exposto no frontend).
 * Cache Redis: 15 min para cotações, 60 min para Tesouro.
 */

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { FastifyInstance } from 'fastify';
import { getCacheValue, setCacheValue } from '../lib/cache';

const BRAPI_BASE = process.env.BRAPI_BASE_URL || 'https://brapi.dev/api';
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';
const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || '';
const MASSIVE_BASE = 'https://api.massive.com/v2';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// ─── tipos BRAPI ───────────────────────────────────────────────────────────
interface BrapiResult {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  logourl?: string;
}

interface BrapiResponse {
  results?: BrapiResult[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────
async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

async function getCached<T>(key: string, ttlSec: number, loader: () => Promise<T>): Promise<T> {
  const hit = await getCacheValue<T>(key);
  if (hit !== null) return hit;
  const data = await loader();
  await setCacheValue(key, data, ttlSec * 1000).catch(() => {});
  return data;
}

// ─── Massive Forex Helpers ──────────────────────────────────────────────────
interface MassivePrevResponse {
  ticker: string;
  results?: Array<{
    c: number; // close price
    t: number; // timestamp
  }>;
}

async function fetchMassiveForex(ticker: string): Promise<{ price: number } | null> {
  if (!MASSIVE_API_KEY) return null;
  try {
    // Usamos o endpoint /prev (Previous Close) pois o Snapshot é restrito ao plano pago
    const data = await fetchJson<MassivePrevResponse>(
      `${MASSIVE_BASE}/aggs/ticker/${ticker}/prev?apiKey=${MASSIVE_API_KEY}`
    );
    const price = data.results?.[0]?.c;
    return price ? { price } : null;
  } catch (err) {
    console.warn(`[Market] Massive failed for ${ticker}:`, (err as Error).message);
    return null;
  }
}

// ─── BCB SGS Helpers ───────────────────────────────────────────────────────
interface BcbSgsResult {
  data: string;
  valor: string;
}

async function fetchBCBSeries(seriesId: number): Promise<number | null> {
  try {
    const data = await fetchJson<BcbSgsResult[]>(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesId}/dados/ultimos/1?formato=json`,
      5000
    );
    const value = parseFloat(data?.[0]?.valor);
    return isNaN(value) ? null : value;
  } catch (err) {
    console.warn(`[Market] BCB SGS failed for series ${seriesId}:`, (err as Error).message);
    return null;
  }
}

// ─── PTAX ──────────────────────────────────────────────────────────────────
interface PtaxResponse {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
  }>;
}

async function fetchPTAX(): Promise<{ compra: number; venda: number } | null> {
  try {
    // Tenta hoje, se não tiver (fim de semana/manhã), tenta ontem
    const findPtax = async (date: Date) => {
      const ds = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${ds}'&$format=json`;
      return fetchJson<PtaxResponse>(url, 5000);
    };

    let ptax = await findPtax(new Date());
    if (!ptax.value?.length) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      ptax = await findPtax(yesterday);
    }

    if (ptax.value?.length) {
      const last = ptax.value[ptax.value.length - 1];
      return { compra: last.cotacaoCompra, venda: last.cotacaoVenda };
    }
    return null;
  } catch (err) {
    console.warn('[Market] PTAX failed:', (err as Error).message);
    return null;
  }
}

// ─── Loaders ───────────────────────────────────────────────────────────────
async function loadMarketData() {
  const FALLBACK = { btc: 520000, eth: 17000, usd: 5.75, selic: 13.75, cdi: 13.65, ipca: 5.06, poupanca: 7.0 };

  // 1. Crypto (CoinGecko)
  let btc = FALLBACK.btc, eth = FALLBACK.eth, btc_change = 0, eth_change = 0;
  try {
    const cg = await fetchJson<{ bitcoin?: { brl?: number, brl_24h_change?: number }; ethereum?: { brl?: number, brl_24h_change?: number } }>(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true`,
    );
    btc = cg.bitcoin?.brl || btc;
    btc_change = cg.bitcoin?.brl_24h_change || 0;
    eth = cg.ethereum?.brl || eth;
    eth_change = cg.ethereum?.brl_24h_change || 0;
  } catch { /* use fallback */ }

  // 2. Índices Oficiais (BCB SGS)
  const [bSelic, bCdi, bIpca] = await Promise.all([
    fetchBCBSeries(11),   // Selic
    fetchBCBSeries(4389), // CDI (Série 12 ou 4389 dependendo da fonte preferida)
    fetchBCBSeries(433),  // IPCA (Mensal)
  ]);
  const selic = bSelic || FALLBACK.selic;
  const cdi = bCdi || FALLBACK.cdi;
  const ipca = bIpca || FALLBACK.ipca;
  const poupanca = selic > 8.5 ? 6.17 : selic * 0.7; // Regra atualizada

  // 3. PTAX (Referência Oficial)
  const ptax = await fetchPTAX();

  // 4. Forex (Massive Primary + BRAPI Fallback)
  let usd = FALLBACK.usd, eur = 6.10, gbp = 7.30;
  let usd_change = 0, eur_change = 0, gbp_change = 0;

  const [mUsd, mEur, mGbp] = await Promise.all([
    fetchMassiveForex('C:USDBRL'),
    fetchMassiveForex('C:EURBRL'),
    fetchMassiveForex('C:GBPBRL'),
  ]);
  if (mUsd) usd = mUsd.price;
  if (mEur) eur = mEur.price;
  if (mGbp) gbp = mGbp.price;

  if (BRAPI_TOKEN) {
    try {
      const u = await fetchJson<BrapiResponse>(`${BRAPI_BASE}/quote/USDBRL=X,EURBRL=X,GBPBRL=X?token=${BRAPI_TOKEN}`);
      const results = u.results || [];
      const usdRes = results.find(r => r.symbol === 'USDBRL=X');
      const eurRes = results.find(r => r.symbol === 'EURBRL=X');
      const gbpRes = results.find(r => r.symbol === 'GBPBRL=X');

      if (usdRes) {
        if (!mUsd) usd = usdRes.regularMarketPrice || usd;
        usd_change = usdRes.regularMarketChangePercent || 0;
      }
      if (eurRes) {
        if (!mEur) eur = eurRes.regularMarketPrice || eur;
        eur_change = eurRes.regularMarketChangePercent || 0;
      }
      if (gbpRes) {
        if (!mGbp) gbp = gbpRes.regularMarketPrice || gbp;
        gbp_change = gbpRes.regularMarketChangePercent || 0;
      }
    } catch (e) {
      console.warn('[Market] BRAPI fallback/change failed:', (e as Error).message);
    }
  }

  return { 
    updatedAt: new Date().toISOString(),
    btc, btc_change,
    eth, eth_change,
    usd, usd_change,
    eur, eur_change,
    gbp, gbp_change,
    selic, cdi, ipca, poupanca,
    ptax: ptax || undefined
  };
}

async function loadQuotes(tickers: string[]) {
  if (!BRAPI_TOKEN || !tickers.length) return [];
  const joined = tickers.slice(0, 10).join(','); // max 10 por chamada no plano free
  try {
    const data = await fetchJson<BrapiResponse>(
      `${BRAPI_BASE}/quote/${joined}?token=${BRAPI_TOKEN}&fundamental=false`,
    );
    return (data.results || []).map((r) => ({
      symbol:          r.symbol || '',
      name:            r.shortName || r.symbol || '',
      price:           r.regularMarketPrice || 0,
      change:          r.regularMarketChange || 0,
      changePercent:   r.regularMarketChangePercent || 0,
      logo:            r.logourl || null,
    }));
  } catch {
    return [];
  }
}

interface TesouroItem {
  TrsrBd?: {
    nm?: string;
    mtrtyDt?: string;
    anulInvstmtRate?: string;
    untrInvstmtVal?: string;
    bd?: { cd?: string };
  };
}
interface TesouroResponse {
  response?: { TrsrBdTradgList?: TesouroItem[] };
}

const TESOURO_FALLBACK = [
  { nome: 'Tesouro IPCA+ 2035',    vencimento: '15/05/2035', taxa: 6.31, preco: 3248.12, tipo: 'IPCA+'     },
  { nome: 'Tesouro Prefixado 2029', vencimento: '01/01/2029', taxa: 12.56, preco: 878.40, tipo: 'Prefixado' },
  { nome: 'Tesouro Selic 2029',     vencimento: '01/03/2029', taxa: 0.15, preco: 13780.45, tipo: 'Selic'    },
  { nome: 'Tesouro IPCA+ 2045',     vencimento: '15/05/2045', taxa: 6.44, preco: 2920.80, tipo: 'IPCA+'     },
  { nome: 'Tesouro Prefixado 2033', vencimento: '01/01/2033', taxa: 12.78, preco: 731.20, tipo: 'Prefixado' },
];

async function loadTesouro() {
  try {
    const data = await fetchJson<TesouroResponse>(
      'https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/component/taxasTesouroDireto.json',
    );
    const list = data.response?.TrsrBdTradgList;
    if (!list?.length) throw new Error('empty');
    return list.slice(0, 6).map((item) => {
      const cd = item.TrsrBd?.bd?.cd;
      return {
        nome:       item.TrsrBd?.nm || 'Título',
        vencimento: item.TrsrBd?.mtrtyDt?.slice(0, 10) || 'N/A',
        taxa:       parseFloat(item.TrsrBd?.anulInvstmtRate ?? '0'),
        preco:      parseFloat(item.TrsrBd?.untrInvstmtVal ?? '0'),
        tipo:       cd === 'NTN-B' ? 'IPCA+' : cd === 'LTN' ? 'Prefixado' : 'Selic' as const,
      };
    });
  } catch {
    return TESOURO_FALLBACK;
  }
}

// ─── Plugin ────────────────────────────────────────────────────────────────
export async function marketRoutes(app: FastifyInstance) {
  console.log('[Market] Registering routes...');

  // GET /market/data
  app.get('/market/data', {
    schema: {
      tags: ['Market'],
      summary: 'Dados de mercado: BTC, ETH, USD, Selic, CDI, IPCA, Poupança',
      response: {
        200: z.object({
          btc:       z.number(),
          eth:       z.number(),
          usd:       z.number(),
          eur:       z.number(),
          gbp:       z.number(),
          selic:     z.number(),
          cdi:       z.number(),
          ipca:      z.number(),
          poupanca:  z.number(),
          btc_change:z.number().optional(),
          eth_change:z.number().optional(),
          usd_change:z.number().optional(),
          eur_change:z.number().optional(),
          gbp_change:z.number().optional(),
          ptax:      z.object({ compra: z.number(), venda: z.number() }).optional(),
          updatedAt: z.string(),
          cached:    z.boolean(),
        }),
      },
    },
  }, async (_req: any, reply: any) => {
    try {
      const data = await getCached('market:data', 15 * 60, loadMarketData);
      return reply.send({ ...data, cached: true });
    } catch (error) {
      app.log.error(error);
      return reply.send({
        updatedAt: new Date().toISOString(),
        btc: 520000,
        eth: 17000,
        usd: 5.75,
        eur: 6.25,
        gbp: 7.45,
        selic: 13.75,
        cdi: 13.65,
        ipca: 5.06,
        poupanca: 7.0,
        btc_change: 0,
        eth_change: 0,
        usd_change: 0,
        eur_change: 0,
        gbp_change: 0,
        cached: false,
      });
    }
  });

  // GET /market/quotes?tickers=BOVA11,PETR4
  app.get('/market/quotes', {
    schema: {
      tags: ['Market'],
      summary: 'Cotações de ações/ETFs/FIIs via BRAPI',
      querystring: z.object({ tickers: z.string() }),
      response: {
        200: z.array(z.object({
          symbol:        z.string(),
          name:          z.string(),
          price:         z.number(),
          change:        z.number(),
          changePercent: z.number(),
          logo:          z.string().nullable(),
        })),
      },
    },
  }, async (req: any, reply: any) => {
    const tickers = (req.query as { tickers: string }).tickers
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);

    const cacheKey = `market:quotes:${tickers.sort().join(',')}`;
    const data = await getCached(cacheKey, 15 * 60, () => loadQuotes(tickers));
    return reply.send(data);
  });

  // GET /market/tesouro
  app.get('/market/tesouro', {
    schema: {
      tags: ['Market'],
      summary: 'Títulos e taxas do Tesouro Direto',
      response: {
        200: z.array(z.object({
          nome:       z.string(),
          vencimento: z.string(),
          taxa:       z.number(),
          preco:      z.number(),
          tipo:       z.enum(['IPCA+', 'Prefixado', 'Selic']),
        })),
      },
    },
  }, async (_req: any, reply: any) => {
    const data = await getCached('market:tesouro', 60 * 60, loadTesouro);
    return reply.send(data);
  });
};
