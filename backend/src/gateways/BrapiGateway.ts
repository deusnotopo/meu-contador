/**
 * BrapiGateway
 * ────────────
 * Infrastructure layer for Stock and ETF market data via brapi.dev.
 * Forex é buscado pelo endpoint /api/v2/currency — não /api/quote.
 */

const BRAPI_BASE = process.env.BRAPI_BASE_URL || 'https://brapi.dev/api';
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

export interface QuoteResult {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  logourl?: string;
}

export interface ForexResult {
  symbol: string;      // ex: "USDBRL"
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

// ── Ações / ETFs / FIIs ──────────────────────────────────────────────────────

export async function fetchQuotes(tickers: string[]): Promise<QuoteResult[]> {
  if (!BRAPI_TOKEN || !tickers.length) return [];

  const joined = tickers.slice(0, 10).join(',');
  try {
    const url = `${BRAPI_BASE}/quote/${joined}?token=${BRAPI_TOKEN}&fundamental=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json() as { results?: unknown[] };
    const results = Array.isArray(data.results) ? data.results : [];

    return results.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        symbol: String(item.symbol ?? ''),
        shortName: String(item.shortName ?? item.symbol ?? ''),
        regularMarketPrice: Number(item.regularMarketPrice ?? 0),
        regularMarketChange: Number(item.regularMarketChange ?? 0),
        regularMarketChangePercent: Number(item.regularMarketChangePercent ?? 0),
        logourl: typeof item.logourl === 'string' ? item.logourl : undefined,
      };
    });
  } catch {
    return [];
  }
}

// ── Câmbio via /api/v2/currency ───────────────────────────────────────────────
// Brapi usa pares no formato "USD-BRL", "EUR-BRL", etc.

export async function fetchForex(currencies: string[]): Promise<ForexResult[]> {
  if (!BRAPI_TOKEN || !currencies.length) return [];

  // Monta pares BRL: USD → "USD-BRL"
  const pairs = currencies.map(c => `${c}-BRL`).join(',');
  try {
    const url = `https://brapi.dev/api/v2/currency?currency=${pairs}&token=${BRAPI_TOKEN}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json() as { currency?: unknown[] };
    const list = Array.isArray(data.currency) ? data.currency : [];

    return list.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      // brapi retorna o símbolo como "USD/BRL" normaliza para "USDBRL=X"
      const fromSymbol = String(item.fromCurrency ?? '');
      return {
        symbol: `${fromSymbol}BRL=X`,
        regularMarketPrice: Number(item.ask ?? item.bid ?? 0),
        regularMarketChangePercent: Number(item.pctChange ?? 0),
      };
    });
  } catch {
    return [];
  }
}
