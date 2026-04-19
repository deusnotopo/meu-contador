import { api } from "@/lib/api";
import { getStockQuote } from "@/lib/api/brapi";
import { showError, showSuccess } from "@/lib/toast";
import { logAction } from "@/lib/audit-service";
import { InvestmentSchema } from "@/lib/schemas";
import { z } from "zod";
import type {
  Dividend,
  Investment,
  InvestmentWithRelations,
  TaxIndicator,
  Currency,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { ErrorService } from "@/services/ErrorService";

const InvestmentsResponseSchema = z.object({
  items: z.array(InvestmentSchema).optional(),
  totalPages: z.number().optional(),
});

export const useInvestments = () => {
  const { user } = useAuth();
  const currentWorkspaceId = user?.currentWorkspaceId || user?.uid || "";
  const [assets, setAssets] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const InvestResponseSchema = z.object({
        items: z.array(InvestmentSchema).optional(),
        totalPages: z.number().optional(),
        total: z.number().optional(), // Backend generally sends total and totalPages
      });

      const firstPage = await api.get<z.infer<typeof InvestResponseSchema>>(
        "/investments?page=1&limit=100",
        { schema: InvestResponseSchema }
      );
      const resp = firstPage;
      const totalPages = Math.max(1, resp?.totalPages || 1);
      let items = resp?.items || [];

      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.get<z.infer<typeof InvestResponseSchema>>(
              `/investments?page=${index + 2}&limit=100`,
              {
                schema: InvestResponseSchema,
              },
            ),
          ),
        );

        items = items.concat(
          remainingPages.flatMap((page) => page.items || []),
        );
      }

      items = items.filter((item) => item.amount > 0);
      setAssets(items || []);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        console.error("Zod Validation Error (Investments):", err.errors);
        setError("Dados de investimentos incompatíveis.");
      } else {
        ErrorService.log(err, "Investments:fetch");
        const msg = err instanceof Error ? err.message : "Investimentos indisponíveis no momento. Tente novamente mais tarde.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const addAsset = async (asset: Omit<Investment, "id" | "lastUpdate">) => {
    try {
      const newAsset = await api.post<Investment>("/investments", asset);
      setAssets((prev) => [...prev, newAsset]);

      if (currentWorkspaceId) {
        logAction(
          currentWorkspaceId,
          "CREATE_INVESTMENT",
          `Novo Ativo: ${asset.ticker} (${asset.amount} un)`,
        );
      }

      showSuccess("Ativo cadastrado com sucesso!");
    } catch (error) {
      ErrorService.log(error, "Investments:addAsset");
      showError("Erro ao cadastrar ativo.");
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const asset = assets.find((a) => a.id === id);
      await api.delete(`/investments/${id}`);
      setAssets((prev) => prev.filter((a) => a.id !== id));

      if (currentWorkspaceId && asset) {
        logAction(
          currentWorkspaceId,
          "DELETE_INVESTMENT",
          `Removido Ativo: ${asset.ticker}`,
        );
      }

      showSuccess("Ativo removido.");
    } catch (error) {
      ErrorService.log(error, "Investments:deleteAsset");
      showError("Erro ao remover ativo.");
    }
  };

  const addDividend = async (
    investmentId: string,
    dividend: Omit<Dividend, "id" | "assetId" | "assetTicker">,
  ) => {
    try {
      await api.post(`/investments/${investmentId}/dividends`, dividend);
      await fetchInvestments(); // Refresh to get updated nested data
      showSuccess("Provento registrado!");
    } catch (error) {
      ErrorService.log(error, "Investments:addDividend");
      showError("Erro ao registrar provento.");
    }
  };

  const deleteDividend = async (investmentId: string, dividendId: string) => {
    try {
      await api.delete(`/investments/${investmentId}/dividends/${dividendId}`);
      await fetchInvestments();
      showSuccess("Provento removido!");
    } catch (error) {
      ErrorService.log(error, "Investments:deleteDividend");
      showError("Erro ao remover provento.");
    }
  };

  const addSale = async (
    investmentId: string,
    sale: { amount: number; price: number; date: string },
  ) => {
    try {
      await api.post(`/investments/${investmentId}/sales`, sale);
      await fetchInvestments(); // Refresh to get updated quantity

      const asset = assets.find((a) => a.id === investmentId);
      if (currentWorkspaceId && asset) {
        logAction(
          currentWorkspaceId,
          "SALE_INVESTMENT",
          `Venda: ${asset.ticker} (${sale.amount} un)`,
        );
      }

      showSuccess("Venda registrada!");
    } catch (error) {
      ErrorService.log(error, "Investments:addSale");
      showError("Erro ao registrar venda.");
    }
  };

  const getTaxIndicators = (
    convert: (amount: number, from: Currency, to: Currency) => number,
  ): TaxIndicator[] => {
    const monthlySales = (assets as InvestmentWithRelations[]).reduce(
      (acc, asset) => {
        const stockSales = (asset.sales ?? []).filter(
          () => asset.type === "stock",
        );

        stockSales.forEach((sale) => {
          const month = new Date(sale.date).toISOString().substring(0, 7);
          const grossSale = convert(
            sale.totalValue,
            (sale.currency || asset.currency || "BRL") as Currency,
            "BRL",
          );
          const estimatedCostBasis = convert(
            sale.amount * asset.averagePrice,
            (asset.currency || "BRL") as Currency,
            "BRL",
          );
          const estimatedProfit = Math.max(grossSale - estimatedCostBasis, 0);

          acc[month] = acc[month] || { totalStockSales: 0, estimatedProfit: 0 };
          acc[month].totalStockSales += grossSale;
          acc[month].estimatedProfit += estimatedProfit;
        });

        return acc;
      },
      {} as Record<
        string,
        { totalStockSales: number; estimatedProfit: number }
      >,
    );

    return Object.entries(monthlySales).map(([month, totals]) => ({
      month,
      totalStockSales: totals.totalStockSales,
      isOverLimit: totals.totalStockSales > 20000,
      estimatedTax:
        totals.totalStockSales > 20000 ? totals.estimatedProfit * 0.15 : 0,
    }));
  };

  const updateAsset = async (id: string, updates: Partial<Investment>) => {
    try {
      const updated = await api.put<Investment>(`/investments/${id}`, updates);
      setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showSuccess("Ativo atualizado!");
    } catch (error) {
      ErrorService.log(error, "Investments:updateAsset");
      showError("Erro ao atualizar ativo.");
    }
  };

  const syncPrices = async (token: string = "") => {
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
              const nextAsset = {
                ...asset,
                currentPrice: quote.regularMarketPrice,
                name: quote.shortName || asset.name,
              };

              await api.put<Investment>(`/investments/${asset.id}`, {
                currentPrice: nextAsset.currentPrice,
                name: nextAsset.name,
              });

              return nextAsset;
            }
          }
          return asset;
        }),
      );

      setAssets(updatedAssets);
      showSuccess("Cotações atualizadas!");
    } catch (error) {
      ErrorService.log(error, "Investments:syncPrices");
      showError("Erro ao sincronizar preços.");
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    currentValue: assets.reduce(
      (sum, a) => sum + (a.currentPrice || a.averagePrice) * a.amount,
      0,
    ),
    totalInvested: assets.reduce(
      (sum, a) => sum + a.averagePrice * a.amount,
      0,
    ),
    totalDividends: (assets as InvestmentWithRelations[]).reduce(
      (sum, a) => sum + (a.dividends ?? []).reduce((s, d) => s + d.amount, 0),
      0,
    ),
  };

  const dividends = (assets as InvestmentWithRelations[]).flatMap((a) =>
    (a.dividends || []).map((d) => ({
      ...d,
      assetId: a.id.toString(),
      assetTicker: a.ticker,
    })),
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
