import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCategoryEmoji } from "@/lib/constants";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import type { Transaction } from "@/types";

export const useInsightsStats = (transactions: Transaction[]) => {
  const { user } = useAuth();

  const activity = useMemo(() => {
    const recentPurchases = transactions.slice(0, 5).map(tx => ({
      id: tx.id,
      ico: getCategoryEmoji(tx.category),
      ti: tx.description,
      cat: `${tx.category} · ${FinancialFormatter.formatShortDate(tx.date)}`,
      am: tx.type === "expense" ? -tx.amount : tx.amount,
    }));

    const categorySpending = (() => {
      const cats: Record<string, number> = {};
      transactions
        .filter(tx => tx.type === "expense")
        .forEach(tx => { cats[tx.category] = (cats[tx.category] ?? 0) + tx.amount; });
      return Object.entries(cats)
        .map(([name, spent]) => ({ name, spent }))
        .sort((a, b) => b.spent - a.spent);
    })();

    return {
      recentPurchases,
      categorySpending,
    };
  }, [transactions]);

  return {
    activity,
    monthlyRevenue: user?.monthlyIncome ?? 0,
  };
};
