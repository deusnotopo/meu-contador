const BASE_URL = "https://brapi.dev/api";

export interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  logourl: string;
  shortName: string;
}

export const getStockQuote = async (
  ticker: string,
  token: string
): Promise<StockQuote | null> => {
  try {
    const response = await fetch(`${BASE_URL}/quote/${ticker}?token=${token}`);
    if (!response.ok) throw new Error("Falha na API");

    const data = await response.json();
    const result = data.results[0];

    return {
      symbol: result.symbol,
      regularMarketPrice: result.regularMarketPrice,
      logourl: result.logourl,
      shortName: result.shortName,
    };
  } catch (error) {
    console.error(`Erro ao buscar cotação para ${ticker}:`, error);
    return null;
  }
};
