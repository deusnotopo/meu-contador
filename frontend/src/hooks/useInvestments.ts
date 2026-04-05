import { api } from "@/lib/api";
import { getStockQuote } from "@/lib/api/brapi";
import { showError, showSuccess } from "@/lib/toast";
import { logAction } from "@/lib/audit-service";
import type {
  Dividend,
  Investment,
  InvestmentWithRelations,
  TaxIndicator,
  Currency,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";

export const useInvestments = () => {
  const { setGlobalLoading, user } = useAuth();
  const currentWorkspaceId = user?.currentWorkspaceId || user?.uid || "";
  const [assets, setAssets] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setGlobalLoading(true);
    setError(null);
    
    try {
      const response = await api.get<Investment[] | { items?: Investment[] }>("/investments");
      const items = Array.isArray(response) ? response : (response?.items || []);
      setAssets(items);
    } catch (err) {
      console.error("Investments API Error:", err);
      setError("Investimentos indisponíveis no momento. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }, [setGlobalLoading]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const addAsset = async (asset: Omit<Investment, "id" | "lastUpdate">) => {
    try {
      const newAsset = await api.post<Investment>("/investments", asset);
      setAssets((prev) => [...prev, newAsset]);
      
      if (currentWorkspaceId) {
        logAction(currentWorkspaceId, "CREATE_INVESTMENT", `Novo Ativo: ${asset.ticker} (${asset.amount} un)`);
      }
      
      showSuccess("Ativo cadastrado com sucesso!");
    } catch {
      showError("Erro ao cadastrar ativo.");
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const asset = assets.find(a => a.id === id);
      await api.delete(`/investments/${id}`);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      
      if (currentWorkspaceId && asset) {
        logAction(currentWorkspaceId, "DELETE_TRANSACTION", `Removido Ativo: ${asset.ticker}`);
      }
      
      showSuccess("Ativo removido.");
    } catch {
      showError("Erro ao remover ativo.");
    }
  };

  const addDividend = async (investmentId: string, dividend: Omit<Dividend, "id" | "assetId" | "assetTicker">) => {
    try {
      await api.post(`/investments/${investmentId}/dividends`, dividend);
      await fetchInvestments(); // Refresh to get updated nested data
      showSuccess("Provento registrado!");
    } catch {
      showError("Erro ao registrar provento.");
    }
  };

  const deleteDividend = async (investmentId: string, dividendId: string) => {
    try {
      await api.delete(`/investments/${investmentId}/dividends/${dividendId}`);
      await fetchInvestments();
      showSuccess("Provento removido!");
    } catch {
      showError("Erro ao remover provento.");
    }
  };

  const addSale = async (investmentId: string, sale: { amount: number; price: number; date: string }) => {
    try {
      await api.post(`/investments/${investmentId}/sales`, sale);
      await fetchInvestments(); // Refresh to get updated quantity
      
      const asset = assets.find(a => a.id === investmentId);
      if (currentWorkspaceId && asset) {
        logAction(currentWorkspaceId, "SALE_INVESTMENT", `Venda: ${asset.ticker} (${sale.amount} un)`);
      }
      
      showSuccess("Venda registrada!");
    } catch {
      showError("Erro ao registrar venda.");
    }
  };

  const getTaxIndicators = (
    convert: (amount: number, from: Currency, to: Currency) => number
  ): TaxIndicator[] => {
    // Collect all sales from all assets
    const allSales = (assets as InvestmentWithRelations[]).flatMap(
      (a) => a.sales ?? []
    );
    
    const monthlySales = allSales.reduce((acc, curr) => {
      const valueInBRL = convert(curr.totalValue, curr.currency || "BRL", "BRL");
      const month = new Date(curr.date).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + valueInBRL;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlySales).map(([month, total]) => ({
      month,
      totalStockSales: total as number,
      isOverLimit: (total as number) > 20000,
      estimatedTax: (total as number) > 20000 ? (total as number) * 0.15 : 0,
    }));
  };

  const updateAsset = async (id: string, updates: Partial<Investment>) => {
    try {
      const updated = await api.put<Investment>(`/investments/${id}`, updates);
      setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showSuccess("Ativo atualizado!");
    } catch {
      showError("Erro ao atualizar ativo.");
    }
  };

  const syncPrices = async (
    token: string = ""
  ) => {
    if (!token || token === "YOUR_TOKEN_HERE") {
      showError("API Key necessária.");
      return;
    }

    setLoading(true);
    try {
      const updatedAssets = await Promise.all(
        assets.map(async (asset) => {
          if (asset.type === "stock" || asset.type === "fii") {
            const quote = await getStockQuote(asset.ticker, token);
            if (quote) {
              return {
                ...asset,
                currentPrice: quote.regularMarketPrice,
                name: quote.shortName || asset.name,
              };
            }
          }
          return asset;
        })
      );

      // In a real enterprise app, we'd send these updates to the backend
      // For now, we update local state and notify success
      setAssets(updatedAssets);
      showSuccess("Cotações atualizadas!");
    } catch {
      showError("Erro ao sincronizar preços.");
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    currentValue: assets.reduce(
      (sum, a) => sum + (a.currentPrice || a.averagePrice) * a.amount,
      0
    ),
    totalInvested: assets.reduce(
      (sum, a) => sum + a.averagePrice * a.amount,
      0
    ),
    totalDividends: (assets as InvestmentWithRelations[]).reduce(
      (sum, a) => sum + (a.dividends ?? []).reduce((s, d) => s + d.amount, 0),
      0
    ),
  };

  const dividends = (assets as InvestmentWithRelations[]).flatMap((a) =>
    (a.dividends || []).map((d) => ({
      ...d,
      assetId: a.id.toString(),
      assetTicker: a.ticker,
    }))
  );

  return {
    assets,
    loading,
    error,
    totals,
    addAsset,
    deleteAsset,
    addDividend,
    addSale,
    updateAsset,
    getTaxIndicators,
    syncPrices,
    dividends,
    deleteDividend,
  };
};
