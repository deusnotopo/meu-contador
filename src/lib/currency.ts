export type CurrencyCode = "BRL" | "USD" | "EUR" | "GBP";

interface ExchangeRates {
  [key: string]: number; // Rate relative to BRL (Base currency)
}

// Fallback rates relative to BRL (1 BRL = X Currency)
let currentRates: ExchangeRates = {
  BRL: 1,
  USD: 0.17,
  EUR: 0.16,
  GBP: 0.13,
};

// Inverse rates (1 Currency = X BRL)
let displayRates: ExchangeRates = {
  BRL: 1,
  USD: 5.88,
  EUR: 6.25,
  GBP: 7.69,
};

export const SUPPORTED_CURRENCIES: {
  code: CurrencyCode;
  symbol: string;
  name: string;
}[] = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "US$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" },
];

export const currencyService = {
  updateRates(newRates: ExchangeRates) {
    currentRates = { ...currentRates, ...newRates };
    // Update display rates (inverse)
    Object.keys(newRates).forEach((code) => {
      if (newRates[code] > 0) {
        displayRates[code] = 1 / newRates[code];
      }
    });
  },

  /**
   * Converts an amount from a source currency to BRL
   */
  convertToBRL(amount: number, currency: CurrencyCode): number {
    if (currency === "BRL" || !currency) return amount;
    const rate = displayRates[currency] || 1;
    return amount * rate;
  },

  /**
   * Converts an amount from BRL to a target currency
   */
  convertFromBRL(amountBRL: number, targetCurrency: CurrencyCode): number {
    if (targetCurrency === "BRL" || !targetCurrency) return amountBRL;
    const rate = displayRates[targetCurrency] || 1;
    return amountBRL / rate;
  },

  /**
   * Formats a value in the specified currency
   */
  format(amount: number, currency: CurrencyCode): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(amount);
  },

  /**
   * Gets the current exchange rate for a currency against BRL
   */
  getRate(currency: CurrencyCode): number {
    return displayRates[currency] || 1;
  },
};
