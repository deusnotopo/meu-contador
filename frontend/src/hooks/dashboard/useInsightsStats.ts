import { useMemo } from "react";
import { useTransactions } from "../useTransactions";
import { useAuth } from "@/context/AuthContext";
import { getCategoryEmoji } from "@/lib/constants";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import { useWealthStats } from "./useWealthStats";

export const useInsightsStats = () => {
  const { user } = useAuth();
  const personal = useTransactions("personal");

  // Re-aproveitamos parte do stats para obter as despesas totais, 
  // mas o ideal seria o componente depender puramente de personal transactions
  const { stats, health } = useWealthStats();

  const activity = useMemo(() => {
    const recentPurchases = personal.allTransactions.slice(0, 5).map(tx => ({
      id: tx.id,
      ico: getCategoryEmoji(tx.category),
      ti: tx.description,
      cat: `${tx.category} · ${FinancialFormatter.formatShortDate(tx.date)}`,
      am: tx.type === "expense" ? -tx.amount : tx.amount,
    }));

    const categorySpending = (() => {
      const cats: Record<string, number> = {};
      personal.allTransactions
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
  }, [personal.allTransactions]);

  return {
    stats,
    health,
    activity,
    monthlyRevenue: user?.monthlyIncome ?? stats.income,
    isLoading: personal.isLoading,
    error: personal.error
  };
};
