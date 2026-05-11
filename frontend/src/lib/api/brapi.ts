import { logger } from "@/lib/logger";

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
    logger.error(`[BRAPI] Quote fetch failed for ${ticker}`, error);
    return null;
  }
};
