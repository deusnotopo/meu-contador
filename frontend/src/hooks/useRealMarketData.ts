import { useState, useEffect, useCallback } from "react";
import { fetchMarketData, fetchStockQuote } from "@/lib/market-data";

interface MarketData {
  btc: number;
  eth: number;
  usd: number;
  selic: number;
  cdi: number;
  lastUpdate: string;
  isLive: boolean;
}

interface StockQuote {
  symbol: string;
  price: number;
  name: string;
  logo?: string;
}

export function useRealMarketData(refreshInterval = 5 * 60 * 1000) {
  const [marketData, setMarketData] = useState<MarketData>({
    btc: 520000,
    eth: 17000,
    usd: 5.75,
    selic: 14.75,
    cdi: 14.65,
    lastUpdate: "",
    isLive: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMarketData();
      setMarketData({
        ...data,
        lastUpdate: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        isLive: true,
      });
    } catch (err) {
      console.error("Error loading market data:", err);
      setError("Erro ao carregar dados de mercado");
      setMarketData((prev) => ({ ...prev, isLive: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [loadData, refreshInterval]);

  const getStockQuote = useCallback(async (ticker: string): Promise<StockQuote | null> => {
    try {
      return (await fetchStockQuote(ticker)) as StockQuote | null;
    } catch (err) {
      console.error(`Error fetching ${ticker}:`, err);
      return null;
    }
  }, []);

  return {
    marketData,
    loading,
    error,
    refresh: loadData,
    getStockQuote,
  };
}