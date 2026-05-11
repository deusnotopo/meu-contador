/**
 * market-data.ts — Frontend Market Data Client
 *
 * Todas as chamadas vão para o backend (/api/market/*).
 * O token BRAPI NUNCA fica exposto no frontend.
 * Cache in-memory de 10 min para evitar re-fetches desnecessários.
 */

import { logger } from '@/lib/logger';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const CACHE_TTL = 10 * 60 * 1000; // 10 min

interface CacheEntry<T> { data: T; ts: number }
const _cache = new Map<string, CacheEntry<unknown>>();

function fromCache<T>(key: string): T | null {
  const e = _cache.get(key);
  if (e && Date.now() - e.ts < CACHE_TTL) return e.data as T;
  return null;
}
function toCache<T>(key: string, data: T) {
  _cache.set(key, { data, ts: Date.now() });
}

// ─── Tipos públicos ────────────────────────────────────────────────────────

export interface MarketData {
  btc:      number;
  eth:      number;
  usd:      number;
  eur:      number;
  gbp:      number;
  selic:    number;
  cdi:      number;
  ipca:     number;
  poupanca: number;
  btc_change?: number;
  eth_change?: number;
  usd_change?: number;
  eur_change?: number;
  gbp_change?: number;
  updatedAt?: string;
  cached?:   boolean;
  isLive?:   boolean; // true = dado veio do servidor, false = fallback local
}

export interface StockQuoteResult {
  symbol:        string;
  name?:         string;
  price?:        number;
  change?:       number;
  changePercent?: number;
  logo?:         string | null;
}

// ─── Estado vazio — exibido quando backend está offline ─────────────────────
// NÃO usar valores hardcoded aqui. Zeros sinalizam indisponibilidade.
const OFFLINE_STATE: MarketData = {
  btc: 0, eth: 0, usd: 0, eur: 0, gbp: 0,
  btc_change: 0, eth_change: 0, usd_change: 0, eur_change: 0, gbp_change: 0,
  selic: null as unknown as number, // null propagado com type workaround
  cdi: null as unknown as number,
  ipca: null as unknown as number,
  poupanca: null as unknown as number,
  isLive: false,
};

// ─── fetchMarketData ───────────────────────────────────────────────────────
export const fetchMarketData = async (): Promise<MarketData> => {
  const cached = fromCache<MarketData>('market:data');
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/market/data`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as MarketData;
    const result: MarketData = { ...data, isLive: true };
    toCache('market:data', result);
    return result;
  } catch (err) {
    logger.warn('[market-data] backend offline — dados indisponíveis', err);
    return OFFLINE_STATE;
  }
};

// ─── fetchStockQuote ───────────────────────────────────────────────────────
export const fetchStockQuote = async (ticker: string): Promise<StockQuoteResult | null> => {
  const key = `market:quote:${ticker}`;
  const cached = fromCache<StockQuoteResult>(key);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/market/quotes?tickers=${ticker}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as StockQuoteResult[];
    const quote = data[0] || null;
    if (quote) toCache(key, quote);
    return quote;
  } catch {
    return null;
  }
};

// ─── fetchMultipleQuotes ───────────────────────────────────────────────────
export const fetchMultipleQuotes = async (
  tickers: string[],
): Promise<Record<string, StockQuoteResult | null>> => {
  if (!tickers.length) return {};

  const cacheKey = `market:quotes:${tickers.slice().sort().join(',')}`;
  const cached = fromCache<Record<string, StockQuoteResult | null>>(cacheKey);
  if (cached) return cached;

  try {
    const joined = tickers.slice(0, 10).join(',');
    const res = await fetch(`${API_BASE}/market/quotes?tickers=${joined}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json() as StockQuoteResult[];
    const map: Record<string, StockQuoteResult | null> = {};
    tickers.forEach(t => { map[t] = list.find(q => q.symbol === t) || null; });
    toCache(cacheKey, map);
    return map;
  } catch {
    const empty: Record<string, null> = {};
    tickers.forEach(t => { empty[t] = null; });
    return empty;
  }
};

// ─── fetchTesouroDireto ────────────────────────────────────────────────────
export interface TesouroTitle {
  nome:       string;
  vencimento: string;
  taxa:       number;
  preco:      number;
  tipo:       'IPCA+' | 'Prefixado' | 'Selic';
}

export const fetchTesouroDireto = async (): Promise<TesouroTitle[]> => {
  const cached = fromCache<TesouroTitle[]>('market:tesouro');
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/market/tesouro`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as TesouroTitle[];
    toCache('market:tesouro', data);
    return data;
  } catch {
    return [];
  }
};
