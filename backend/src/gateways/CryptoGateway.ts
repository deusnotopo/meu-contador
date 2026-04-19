/**
 * CryptoGateway
 * ─────────────
 * Infrastructure layer for cryptocurrency market data.
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface CryptoPrice {
  price: number;
  change24h: number;
}

export async function fetchPrices(): Promise<{ btc: CryptoPrice; eth: CryptoPrice }> {
  try {
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!res.ok) throw new Error(`CG_HTTP_${res.status}`);
    
    const data = await res.json() as any;
    
    return {
      btc: {
        price: data.bitcoin?.brl || 0,
        change24h: data.bitcoin?.brl_24h_change || 0,
      },
      eth: {
        price: data.ethereum?.brl || 0,
        change24h: data.ethereum?.brl_24h_change || 0,
      }
    };
  } catch (err) {
    console.warn('[CryptoGateway] Failed to fetch coingecko:', err);
    return {
      btc: { price: 0, change24h: 0 },
      eth: { price: 0, change24h: 0 }
    };
  }
}
