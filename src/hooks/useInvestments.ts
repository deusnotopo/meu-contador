import { useAuth } from "@/context/AuthContext";
import { getStockQuote } from "@/lib/api/brapi";
import {
  loadDividends,
  loadInvestments,
  loadInvestmentSales,
  saveDividends,
  saveInvestments,
  saveInvestmentSales,
  STORAGE_EVENT,
  STORAGE_KEYS,
} from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import type {
  Dividend,
  Investment,
  InvestmentSale,
  TaxIndicator,
} from "@/types";
import { useEffect, useState } from "react";

export const useInvestments = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Investment[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [sales, setSales] = useState<InvestmentSale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const loadedAssets = loadInvestments();
    const loadedDividends = loadDividends();
    const loadedSales = loadInvestmentSales();

    setAssets(loadedAssets);
    setDividends(loadedDividends);
    setSales(loadedSales);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; data: any }>;
      const detail = customEvent.detail;
      if (detail?.key === STORAGE_KEYS.INVESTMENTS) {
        setAssets(detail.data as Investment[]);
      }
      if (detail?.key === STORAGE_KEYS.DIVIDENDS) {
        setDividends(detail.data as Dividend[]);
      }
      if (detail?.key === STORAGE_KEYS.INVESTMENT_SALES) {
        setSales(detail.data as InvestmentSale[]);
      }
    };

    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);

  const addAsset = (asset: Omit<Investment, "id" | "lastUpdate">) => {
    const newAsset: Investment = {
      ...asset,
      id: Date.now(),
      lastUpdate: new Date().toISOString(),
    };
    const updated = [...assets, newAsset];
    setAssets(updated);
    saveInvestments(updated);
    showSuccess("Ativo cadastrado com sucesso!");
  };

  const updateAsset = (id: number, data: Partial<Investment>) => {
    const updated = assets.map((a) =>
      a.id === id ? { ...a, ...data, lastUpdate: new Date().toISOString() } : a
    );
    setAssets(updated);
    saveInvestments(updated);
  };

  const deleteAsset = (id: number) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    saveInvestments(updated);
    showSuccess("Ativo removido.");
  };

  const addDividend = (dividend: Omit<Dividend, "id">) => {
    const newDividend: Dividend = {
      ...dividend,
      id: Date.now().toString(),
    };
    const updated = [...dividends, newDividend];
    setDividends(updated);
    saveDividends(updated);
    showSuccess("Provento registrado com sucesso!");
  };

  const deleteDividend = (id: string) => {
    const updated = dividends.filter((d) => d.id !== id);
    setDividends(updated);
    saveDividends(updated);
    showSuccess("Provento removido.");
  };

  const addSale = (sale: Omit<InvestmentSale, "id" | "totalValue">) => {
    const asset = assets.find((a) => a.id === sale.assetId);
    if (!asset) return;

    if (asset.amount < sale.amount) {
      showError("Quantidade insuficiente para venda.");
      return;
    }

    const newSale: InvestmentSale = {
      ...sale,
      id: Date.now().toString(),
      totalValue: sale.amount * sale.price,
    };

    // Update asset quantity
    const updatedAssets = assets.map((a) =>
      a.id === sale.assetId ? { ...a, amount: a.amount - sale.amount } : a
    );

    const updatedSales = [...sales, newSale];

    setAssets(updatedAssets);
    setSales(updatedSales);
    saveInvestments(updatedAssets);
    saveInvestmentSales(updatedSales);
    showSuccess("Venda registrada e carteira atualizada!");
  };

  const deleteSale = (id: string) => {
    const saleToDelete = sales.find((s) => s.id === id);
    if (!saleToDelete) return;

    // Restore asset quantity (optional choice, but logical for "undoing" a mistake)
    const updatedAssets = assets.map((a) =>
      a.id === saleToDelete.assetId
        ? { ...a, amount: a.amount + saleToDelete.amount }
        : a
    );

    const updatedSales = sales.filter((s) => s.id !== id);

    setAssets(updatedAssets);
    setSales(updatedSales);
    saveInvestments(updatedAssets);
    saveInvestmentSales(updatedSales);
    showSuccess("Venda removida e estoque restaurado.");
  };

  const getTaxIndicators = (): TaxIndicator[] => {
    const monthlySales = sales.reduce((acc, curr) => {
      if (curr.type !== "stock") return acc; // Only stocks count towards 20k threshold
      const month = curr.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + curr.totalValue;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlySales).map(([month, total]) => ({
      month,
      totalStockSales: total,
      isOverLimit: total > 20000,
      estimatedTax: total > 20000 ? total * 0.15 : 0, // Simplified 15% for Swing Trade
    }));
  };

  const syncPrices = async (
    userId: string,
    token: string = "YOUR_TOKEN_HERE"
  ) => {
    setLoading(true);

    const useRealApi =
      token && token !== "YOUR_TOKEN_HERE" && token.length > 10;

    if (!useRealApi) {
      showError(
        "Configure sua API Key nas configurações para atualizar preços reais."
      );
      setLoading(false);
      return;
    }

    const updatedAssets = await Promise.all(
      assets.map(async (asset) => {
        if (asset.type === "stock" || asset.type === "fii") {
          const quote = await getStockQuote(asset.ticker, token);
          if (quote) {
            return {
              ...asset,
              currentPrice: quote.regularMarketPrice,
              name: quote.shortName || asset.name,
              lastUpdate: new Date().toISOString(),
            };
          }
        }
        return asset;
      })
    );

    setAssets(updatedAssets);
    saveInvestments(updatedAssets);
    setLoading(false);
    showSuccess("Cotações atualizadas via B3!");
  };

  return {
    assets,
    dividends,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    addDividend,
    deleteDividend,
    addSale,
    deleteSale,
    getTaxIndicators,
    syncPrices,
  };
};
