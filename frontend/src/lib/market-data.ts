import { showSuccess, showError } from "./toast";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
// O HG Finance necessita de passar por um backend ou proxy em produção devido a CORS, 
// mas para o escopo v3 MVP vamos mockar a estrutura até o usuário adicionar a API key real no backend.
// Porém o CoinGecko é 100% livre de CORS para a rota /simple/price.

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

    // 2. Fetch Tradicional
    // Como HG Finance bloqueia chamadas diretas do navegador sem proxy pago, 
    // mockaremos inicialmente os valores da B3/Selic para manter o MVP fluido,
    // garantindo que a estrutura Cripto seja real.
    
    return {
      btc: cryptoData.bitcoin?.brl || 520000,
      eth: cryptoData.ethereum?.brl || 17000,
      usd: 5.75, // Placeholder dolar atual
      selic: 11.25, // Placeholder selic atual
      cdi: 11.15, // Placeholder cdi atual
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
