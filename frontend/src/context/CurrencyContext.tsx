import { currencyService } from "@/lib/currency";
import { logger } from '@/lib/logger';
import { fetchMarketData } from "@/lib/market-data";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { Currency } from "@/types";



interface CurrencyContextType {
  baseCurrency: Currency;
  rates: Record<string, number>;
  convert: (amount: number, from: Currency, to: Currency) => number;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rates, setRates] = useState<Record<string, number>>({
    BRL: 1,
    USD: 0.17,
    EUR: 0.16,
    GBP: 0.13,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        // Use our consolidated backend market data instead of external APIs
        const marketData = await fetchMarketData();
        
        const newRates = {
          BRL: 1,
          USD: 1 / marketData.usd,
          EUR: 1 / marketData.eur,
          GBP: 1 / marketData.gbp,
        };
        
        setRates(newRates);
        currencyService.updateRates(newRates);
      } catch (_error) {
        // Fallback already handled within fetchMarketData
        logger.warn("[Currency] Failed to sync with market backend, using existing defaults.");
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const convert = React.useCallback((amount: number, from: Currency, to: Currency) => {
    return currencyService.convertFromBRL(
      currencyService.convertToBRL(amount, from),
      to
    );
  }, []);

  const contextValue = React.useMemo(() => ({
    baseCurrency: "BRL" as const,
    rates,
    convert,
    loading
  }), [rates, convert, loading]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context)
    throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
};
