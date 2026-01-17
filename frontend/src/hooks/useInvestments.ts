import { api } from "@/lib/api";
import { getStockQuote } from "@/lib/api/brapi";
import { showError, showSuccess } from "@/lib/toast";
import { logAction } from "@/lib/audit-service";
import type {
  Dividend,
  Investment,
  TaxIndicator,
  Currency,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export const useInvestments = () => {
  const { setGlobalLoading, user } = useAuth();
  const currentWorkspaceId = user?.currentWorkspaceId || user?.uid || "";
  const [assets, setAssets] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = async () => {
    setLoading(true);
    setGlobalLoading(true);
    try {
      const data = await api.get<Investment[]>("/investments");
      setAssets(data);
    } catch (error) {
      console.warn("Backend API not available for investments.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const addAsset = async (asset: Omit<Investment, "id" | "lastUpdate">) => {
    try {
      const newAsset = await api.post<Investment>("/investments", asset);
      setAssets((prev) => [...prev, newAsset]);
      
      if (currentWorkspaceId) {
        logAction(currentWorkspaceId, "CREATE_INVESTMENT", `Novo Ativo: ${asset.ticker} (${asset.amount} un)`);
      }
      
      showSuccess("Ativo cadastrado com sucesso!");
    } catch (error) {
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
    } catch (error) {
      showError("Erro ao remover ativo.");
    }
  };

  const addDividend = async (investmentId: string, dividend: Omit<Dividend, "id" | "assetId" | "assetTicker">) => {
    try {
      await api.post(`/investments/${investmentId}/dividends`, dividend);
      await fetchInvestments(); // Refresh to get updated nested data
      showSuccess("Provento registrado!");
    } catch (error) {
      showError("Erro ao registrar provento.");
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
    } catch (error) {
      showError("Erro ao registrar venda.");
    }
  };

  const getTaxIndicators = (
    convert: (amount: number, from: Currency, to: Currency) => number
  ): TaxIndicator[] => {
    // Collect all sales from all assets
    const allSales = assets.flatMap(a => (a as any).sales || []) as any[];
    
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
    } catch (e) {
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
    totalDividends: assets.reduce(
      (sum, a) => sum + ((a as any).dividends || []).reduce((s: number, d: any) => s + d.amount, 0),
      0
    ),
  };

  return {
    assets,
    loading,
    totals,
    addAsset,
    deleteAsset,
    addDividend,
    addSale,
    getTaxIndicators,
    syncPrices,
  };
};
