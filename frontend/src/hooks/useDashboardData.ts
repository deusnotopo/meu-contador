import React from "react";
import { useTransactions } from "./useTransactions";
import { useInvestments } from "./useInvestments";
import { useDebts } from "./useDebts";
import { useGoals } from "./useGoals";
import { useAuth } from "@/context/AuthContext";
import { useFinancialScore } from "./useFinancialScore";
import { useReminders } from "./useReminders";
import { useTour } from "./useTour";
import { useIntelligence } from "./useIntelligence";
import { useGamification } from "./useGamification";
import { formatShortDate } from "@/lib/formatters";
import { getCategoryEmoji } from "@/lib/constants";
import type { TabType } from "@/types/navigation";

export const useDashboardData = (onNavigate?: (tab: TabType) => void) => {
  const { user } = useAuth();
  const isBusinessUser = user?.employmentType === "pj";

  // ─── 1. Parallel Data Fetching ───────────────────────────────────────────
  const personal = useTransactions("personal");
  const business = useTransactions(isBusinessUser ? "business" : "personal");
  const { totals: investTotals, assets, loading: investLoading } = useInvestments();
  const { totals: debtTotals, debts, isLoading: debtLoading } = useDebts();
  const { goals, loading: goalsLoading } = useGoals();
  const { startTour } = useTour();
  const remindersCtx = useReminders();
  const { intelligence } = useIntelligence();
  const { level, streaks, isLoading: gamLoading } = useGamification();

  // ─── 2. Global Totals Calculation (Single Pass) ──────────────────────────
  const totalBankBalance = isBusinessUser
    ? personal.totals.balance + business.totals.balance
    : personal.totals.balance;
  
  const bankAssets = totalBankBalance > 0 ? totalBankBalance : 0;
  const bankLiabilities = totalBankBalance < 0 ? Math.abs(totalBankBalance) : 0;

  const globalTotals = React.useMemo(() => ({
    income: isBusinessUser ? personal.totals.income + business.totals.income : personal.totals.income,
    expense: isBusinessUser ? personal.totals.expense + business.totals.expense : personal.totals.expense,
    balance: totalBankBalance,
    netWorth: bankAssets + investTotals.currentValue - (debtTotals.totalBalance + bankLiabilities),
    assets: bankAssets + investTotals.currentValue,
    liabilities: debtTotals.totalBalance + bankLiabilities,
  }), [personal.totals, business.totals, investTotals, debtTotals, isBusinessUser, totalBankBalance, bankAssets, bankLiabilities]);

  // ─── 3. Derived Metrics (Reflexão e Performance) ───────────────────────
  const sparklineData = React.useMemo(() => 
    personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map(d => d.receitas - d.despesas) : [],
    [personal.monthlyTrend]
  );

  const recentPurchases = React.useMemo(() => 
    personal.allTransactions.slice(0, 5).map(tx => ({
      id: tx.id,
      ico: getCategoryEmoji(tx.category),
      ti: tx.description,
      cat: `${tx.category} · ${formatShortDate(tx.date)}`,
      am: tx.type === "expense" ? -tx.amount : tx.amount,
    })),
    [personal.allTransactions]
  );

  const monthlyVariation = React.useMemo(() => {
    if (personal.monthlyTrend.length < 2) return { amount: 0, percentage: 0 };
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1]!;
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2]!;
    const variation = (current.receitas - current.despesas) - (previous.receitas - previous.despesas);
    const percentage = previous.receitas > 0 ? (variation / previous.receitas) * 100 : 0;
    return { amount: variation, percentage };
  }, [personal.monthlyTrend]);

  const categorySpending = React.useMemo(() => {
    const cats: Record<string, number> = {};
    personal.allTransactions
      .filter(tx => tx.type === "expense")
      .forEach(tx => { cats[tx.category] = (cats[tx.category] ?? 0) + tx.amount; });
    return Object.entries(cats)
      .map(([name, spent]) => ({ name, spent }))
      .sort((a, b) => b.spent - a.spent);
  }, [personal.allTransactions]);

  const {
    score: healthScore,
    tooltip: healthScoreTooltip,
    sustainableDaily,
    estimatedTax,
    scoreReliability,
    scoreSourceLabel
  } = useFinancialScore(globalTotals, user ? {
    employmentType: user.employmentType,
    dependents: user.dependents,
    monthlyIncome: user.monthlyIncome,
    hasEmergencyFund: user.hasEmergencyFund
  } : null);

  const monthlyRevenue = user?.monthlyIncome ?? globalTotals.income;

  const setupMissions = React.useMemo(() => [
    { id: "debts", emoji: "💳", label: "Mapeie suas dívidas", sub: "Habilita Custo Zero", xp: 150, done: debts.length > 0, tab: "debt_payoff" as TabType },
    { id: "investments", emoji: "📈", label: "Adicione seus investimentos", sub: "Ativa o Painel Retorno", xp: 200, done: assets.length > 0, tab: "investments" as TabType },
    { id: "goals", emoji: "🎯", label: "Defina uma meta financeira", sub: "Ativa Metas", xp: 100, done: goals.length > 0, tab: "planning" as TabType },
    { id: "fire", emoji: "🔥", label: "Aposentadoria", sub: "Simulador FIRE", xp: 250, done: !!user?.retirementAge, tab: "retirement" as TabType },
    { id: "pj", emoji: "🏢", label: "Config PJ", sub: "Separa finanças", xp: 150, done: !!user?.businessCnpj, tab: "profile" as TabType, hide: user?.employmentType !== "pj" },
    { id: "academy", emoji: "🎓", label: "Complete uma aula", sub: "XP", xp: 100, done: false, tab: "education" as TabType },
  ].filter(m => !m.hide), [debts.length, assets.length, goals.length, user]);

  const loading = personal.isLoading || investLoading || debtLoading || goalsLoading;

  return {
    user,
    personal,
    business,
    globalTotals,
    healthScore,
    healthScoreTooltip,
    sustainableDaily,
    estimatedTax,
    scoreReliability,
    scoreSourceLabel,
    recentPurchases,
    categorySpending,
    monthlyVariation,
    sparklineData,
    setupMissions,
    remindersCtx,
    intelligence,
    level,
    streaks,
    gamLoading,
    loading,
    startTour,
    monthlyRevenue,
    onNavigate
  };
};
