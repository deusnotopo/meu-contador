/**
 * BrapiGateway
 * ────────────
 * Infrastructure layer for Stock and ETF market data.
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

export async function fetchQuotes(tickers: string[]): Promise<QuoteResult[]> {
  if (!BRAPI_TOKEN || !tickers.length) return [];
  
  const joined = tickers.slice(0, 10).join(',');
  try {
    const url = `${BRAPI_BASE}/quote/${joined}?token=${BRAPI_TOKEN}&fundamental=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    
    const data = await res.json() as any;
    return (data.results || []).map((r: any) => ({
      symbol: r.symbol || '',
      shortName: r.shortName || r.symbol || '',
      regularMarketPrice: r.regularMarketPrice || 0,
      regularMarketChange: r.regularMarketChange || 0,
      regularMarketChangePercent: r.regularMarketChangePercent || 0,
      logourl: r.logourl,
    }));
  } catch {
    return [];
  }
}

export async function fetchForex(tickers: string[]): Promise<QuoteResult[]> {
  // BRAPI endpoint for Currencies
  return fetchQuotes(tickers.map(t => `${t}=X`));
}
