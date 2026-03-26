import { showSuccess, showError } from "./toast";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const BRAPI_BASE_URL = "https://brapi.dev/api";

// Cache para evitar rate limiting
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getFromCache = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export interface MarketData {
  btc: number;
  eth: number;
  usd: number;
  selic: number;
  cdi: number;
}

export const fetchMarketData = async (): Promise<MarketData> => {
  // Verificar cache primeiro
  const cached = getFromCache<MarketData>("market-data");
  if (cached) return cached;

  const fallback: MarketData = {
    btc: 520000,
    eth: 17000,
    usd: 5.75,
    selic: 11.25,
    cdi: 11.15
  };

  try {
    // 1. Fetch Crypto do CoinGecko (Public API - No auth required)
    let cryptoData: any = {};
    try {
      const cryptoRes = await fetch(
        `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=brl`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (cryptoRes.ok) {
        cryptoData = await cryptoRes.json();
      }
    } catch (e) {
      console.warn("Failed to fetch crypto, using fallback");
    }

    // 2. Fetch Dólar via BRAPI
    const brapiToken = import.meta.env.VITE_BRAPI_TOKEN;
    let usdRate = fallback.usd;
    
    if (brapiToken) {
      try {
        const usdRes = await fetch(
          `${BRAPI_BASE_URL}/quote/USDBRL=X?token=${brapiToken}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (usdRes.ok) {
          const usdData = await usdRes.json();
          if (usdData.results && usdData.results[0]) {
            usdRate = usdData.results[0].regularMarketPrice || fallback.usd;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch USD from BRAPI, using fallback");
      }
    }

    // 3. Selic e CDI via API do Banco Central (SGS)
    let selic = fallback.selic;
    let cdi = fallback.cdi;
    try {
      const [selicRes, cdiRes] = await Promise.all([
        fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json", 
          { signal: AbortSignal.timeout(10000) }),
        fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json",
          { signal: AbortSignal.timeout(10000) })
      ]);
      
      if (selicRes.ok) {
        const selicData = await selicRes.json();
        if (selicData && selicData[0]) selic = parseFloat(selicData[0].valor);
      }
      
      if (cdiRes.ok) {
        const cdiData = await cdiRes.json();
        if (cdiData && cdiData[0]) cdi = parseFloat(cdiData[0].valor);
      }
    } catch (e) {
      console.warn("Failed to fetch BCB rates, using fallbacks");
    }
    
    const result: MarketData = {
      btc: cryptoData.bitcoin?.brl || fallback.btc,
      eth: cryptoData.ethereum?.brl || fallback.eth,
      usd: usdRate,
      selic,
      cdi,
    };

    // Salvar no cache
    setCache("market-data", result);
    
    return result;
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    return fallback;
  }
};

// Função auxiliar para buscar cotações de ações brasileiras
export const fetchStockQuote = async (ticker: string) => {
  // Verificar cache primeiro
  const cacheKey = `stock-${ticker}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  const brapiToken = import.meta.env.VITE_BRAPI_TOKEN;
  if (!brapiToken) {
    console.warn("BRAPI token not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${BRAPI_BASE_URL}/quote/${ticker}?token=${brapiToken}`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (response.status === 429) {
      console.warn(`Rate limited for ${ticker}, using cached data if available`);
      return null;
    }
    
    if (!response.ok) throw new Error("Failed to fetch stock quote");
    
    const data = await response.json();
    if (data.results && data.results[0]) {
      const result = {
        symbol: data.results[0].symbol,
        price: data.results[0].regularMarketPrice,
        name: data.results[0].shortName,
        logo: data.results[0].logourl,
      };
      
      // Salvar no cache
      setCache(cacheKey, result);
      
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
};

// Função para buscar múltiplas cotações com rate limiting
export const fetchMultipleQuotes = async (tickers: string[]) => {
  const results: Record<string, any> = {};
  
  // Processar em lotes para evitar rate limiting
  for (let i = 0; i < tickers.length; i += 2) {
    const batch = tickers.slice(i, i + 2);
    const batchResults = await Promise.all(
      batch.map(ticker => fetchStockQuote(ticker))
    );
    
    batch.forEach((ticker, index) => {
      results[ticker] = batchResults[index];
    });
    
    // Aguardar entre lotes se não for o último
    if (i + 2 < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};
