import { currencyService } from "@/lib/currency";
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
        // Using Frankfurter API (Free, no key)
        const res = await fetch(
          "https://api.frankfurter.app/latest?from=BRL&to=USD,EUR,GBP"
        );
        const data = await res.json();
        if (data.rates) {
          const newRates = { BRL: 1, ...data.rates };
          setRates(newRates);
          currencyService.updateRates(newRates);
        }
      } catch (error) {
        console.error("Failed to fetch rates, using defaults:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const convert = (amount: number, from: Currency, to: Currency) => {
    return currencyService.convertFromBRL(
      currencyService.convertToBRL(amount, from as any),
      to as any
    );
  };

  return (
    <CurrencyContext.Provider
      value={{ baseCurrency: "BRL", rates, convert, loading }}
    >
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
