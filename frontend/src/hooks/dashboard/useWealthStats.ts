import { useMemo } from "react";
import { useTransactions } from "../useTransactions";
import { useInvestments } from "../useInvestments";
import { useDebts } from "../useDebts";
import { useAuth } from "@/context/AuthContext";
import { useFinancialScore } from "../useFinancialScore";

export const useWealthStats = () => {
  const { user } = useAuth();
  const isBusinessUser = user?.employmentType === "pj";

  const personal = useTransactions("personal");
  const business = useTransactions(isBusinessUser ? "business" : "personal");
  const { totals: investTotals, loading: investLoading } = useInvestments();
  const { totals: debtTotals, isLoading: debtLoading } = useDebts();

  // 1. Agregação de Totais (Memoized isoladamente)
  const stats = useMemo(() => {
    const balance = isBusinessUser
      ? personal.totals.balance + business.totals.balance
      : personal.totals.balance;
    
    const bankAssets = balance > 0 ? balance : 0;
    const bankLiabilities = balance < 0 ? Math.abs(balance) : 0;

    return {
      income: isBusinessUser ? personal.totals.income + business.totals.income : personal.totals.income,
      expense: isBusinessUser ? personal.totals.expense + business.totals.expense : personal.totals.expense,
      balance,
      netWorth: bankAssets + investTotals.currentValue - (debtTotals.totalBalance + bankLiabilities),
      assets: bankAssets + investTotals.currentValue,
      liabilities: debtTotals.totalBalance + bankLiabilities,
    };
  }, [personal.totals, business.totals, investTotals, debtTotals, isBusinessUser]);

  const userMetrics = useMemo(() => user ? {
    employmentType: user.employmentType,
    dependents: user.dependents,
    monthlyIncome: user.monthlyIncome,
    hasEmergencyFund: user.hasEmergencyFund
  } : null, [user?.employmentType, user?.dependents, user?.monthlyIncome, user?.hasEmergencyFund]);

  // 2. Saúde Financeira
  const health = useFinancialScore(stats, userMetrics);

  // 3. Variação
  const monthlyVariation = useMemo(() => {
    if (personal.monthlyTrend.length < 2) return { amount: 0, percentage: 0 };
    const current = personal.monthlyTrend[personal.monthlyTrend.length - 1];
    const previous = personal.monthlyTrend[personal.monthlyTrend.length - 2];
    
    if (!current || !previous) return { amount: 0, percentage: 0 }; // Akita: Type Guard contra falha de Array Bounds

    const variation = (current.receitas - current.despesas) - (previous.receitas - previous.despesas);
    const percentage = previous.receitas > 0 ? (variation / previous.receitas) * 100 : 0;
    return { amount: variation, percentage };
  }, [personal.monthlyTrend]);

  const sparklineData = useMemo(() => {
    return personal.monthlyTrend.length > 0 ? personal.monthlyTrend.map(d => d.receitas - d.despesas) : [];
  }, [personal.monthlyTrend]);

  const isLoading = personal.isLoading || investLoading || debtLoading;

  return {
    stats,
    health,
    sparklineData,
    monthlyVariation,
    isLoading
  };
};
