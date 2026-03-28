import { showSuccess, showError } from "./toast";
import { cryptoCircuitBreaker, stockCircuitBreaker, bcbCircuitBreaker } from "./circuit-breaker";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const BRAPI_BASE_URL = "https://brapi.dev/api";

// Cache para evitar rate limiting
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Fallback data for when APIs are down
const FALLBACK_MARKET_DATA: MarketData = {
  btc: 520000,
  eth: 17000,
  usd: 5.75,
  selic: 11.25,
  cdi: 11.15
};

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
    // 1. Fetch Crypto do CoinGecko with circuit breaker
    let cryptoData: any = {};
    try {
      const cryptoDataResult = await cryptoCircuitBreaker.call(
        async () => {
          const cryptoRes = await fetch(
            `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=brl`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!cryptoRes.ok) throw new Error(`CoinGecko API failed: ${cryptoRes.status}`);
          return cryptoRes.json();
        },
        () => ({ bitcoin: { brl: FALLBACK_MARKET_DATA.btc }, ethereum: { brl: FALLBACK_MARKET_DATA.eth } })
      );
      cryptoData = cryptoDataResult;
    } catch (e) {
      console.warn("Failed to fetch crypto, using fallback");
    }

    // 2. Fetch Dólar via BRAPI with circuit breaker
    const brapiToken = import.meta.env.VITE_BRAPI_TOKEN;
    let usdRate = FALLBACK_MARKET_DATA.usd;
    
    if (brapiToken) {
      try {
        const usdData = await stockCircuitBreaker.call(
          async () => {
            const usdRes = await fetch(
              `${BRAPI_BASE_URL}/quote/USDBRL=X?token=${brapiToken}`,
              { signal: AbortSignal.timeout(10000) }
            );
            if (!usdRes.ok) throw new Error(`BRAPI API failed: ${usdRes.status}`);
            return usdRes.json();
          },
          () => ({ results: [{ regularMarketPrice: FALLBACK_MARKET_DATA.usd }] })
        );
        if (usdData.results && usdData.results[0]) {
          usdRate = usdData.results[0].regularMarketPrice || FALLBACK_MARKET_DATA.usd;
        }
      } catch (e) {
        console.warn("Failed to fetch USD from BRAPI, using fallback");
      }
    }

    // 3. Selic e CDI via API do Banco Central (SGS) with circuit breaker
    let selic = FALLBACK_MARKET_DATA.selic;
    let cdi = FALLBACK_MARKET_DATA.cdi;
    try {
      const bcbData = await bcbCircuitBreaker.call(
        async () => {
          const [selicRes, cdiRes] = await Promise.all([
            fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json", 
              { signal: AbortSignal.timeout(10000) }),
            fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json",
              { signal: AbortSignal.timeout(10000) })
          ]);
          
          if (!selicRes.ok) throw new Error(`BCB Selic API failed: ${selicRes.status}`);
          if (!cdiRes.ok) throw new Error(`BCB CDI API failed: ${cdiRes.status}`);
          
          const [selicData, cdiData] = await Promise.all([selicRes.json(), cdiRes.json()]);
          return { selicData, cdiData };
        },
        () => ({ selicData: [{ valor: FALLBACK_MARKET_DATA.selic }], cdiData: [{ valor: FALLBACK_MARKET_DATA.cdi }] })
      );
      
      if (bcbData.selicData && bcbData.selicData[0]) selic = parseFloat(bcbData.selicData[0].valor);
      if (bcbData.cdiData && bcbData.cdiData[0]) cdi = parseFloat(bcbData.cdiData[0].valor);
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
