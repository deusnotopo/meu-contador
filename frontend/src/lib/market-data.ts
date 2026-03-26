import { showSuccess, showError } from "./toast";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const BRAPI_BASE_URL = "https://brapi.dev/api";

export interface MarketData {
  btc: number;
  eth: number;
  usd: number;
  selic: number;
  cdi: number;
}

export const fetchMarketData = async (): Promise<MarketData> => {
  try {
    // 1. Fetch Crypto do CoinGecko (Public API - No auth required)
    const cryptoRes = await fetch(`${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=brl`);
    const cryptoData = await cryptoRes.json();

    // 2. Fetch Dólar via BRAPI
    const brapiToken = import.meta.env.VITE_BRAPI_TOKEN;
    let usdRate = 5.75; // Fallback
    
    if (brapiToken) {
      try {
        const usdRes = await fetch(`${BRAPI_BASE_URL}/quote/USDBRL=X?token=${brapiToken}`);
        const usdData = await usdRes.json();
        if (usdData.results && usdData.results[0]) {
          usdRate = usdData.results[0].regularMarketPrice || 5.75;
        }
      } catch (e) {
        console.warn("Failed to fetch USD from BRAPI, using fallback");
      }
    }

    // 3. Selic e CDI via API do Banco Central (SGS)
    // 11 = SELIC, 4389 = CDI
    let selic = 11.25;
    let cdi = 11.15;
    try {
      const [selicRes, cdiRes] = await Promise.all([
        fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json"),
        fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json")
      ]);
      const [selicData, cdiData] = await Promise.all([selicRes.json(), cdiRes.json()]);
      if (selicData && selicData[0]) selic = parseFloat(selicData[0].valor);
      if (cdiData && cdiData[0]) cdi = parseFloat(cdiData[0].valor);
    } catch (e) {
      console.warn("Failed to fetch BCB rates, using fallbacks");
    }
    
    return {
      btc: cryptoData.bitcoin?.brl || 520000,
      eth: cryptoData.ethereum?.brl || 17000,
      usd: usdRate,
      selic,
      cdi,
    };
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    return {
      btc: 500000,
      eth: 15000,
      usd: 5.80,
      selic: 11.25,
      cdi: 11.15
    };
  }
};

// Função auxiliar para buscar cotações de ações brasileiras
export const fetchStockQuote = async (ticker: string) => {
  const brapiToken = import.meta.env.VITE_BRAPI_TOKEN;
  if (!brapiToken) {
    console.warn("BRAPI token not configured");
    return null;
  }

  try {
    const response = await fetch(`${BRAPI_BASE_URL}/quote/${ticker}?token=${brapiToken}`);
    if (!response.ok) throw new Error("Failed to fetch stock quote");
    
    const data = await response.json();
    if (data.results && data.results[0]) {
      return {
        symbol: data.results[0].symbol,
        price: data.results[0].regularMarketPrice,
        name: data.results[0].shortName,
        logo: data.results[0].logourl,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
};
