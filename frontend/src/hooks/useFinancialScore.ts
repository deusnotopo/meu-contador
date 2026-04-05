import { useMemo } from 'react';

interface GlobalTotals {
  income: number;
  expense: number;
  balance: number;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface UserMetrics {
  employmentType?: string;
  dependents?: number;
  monthlyIncome?: number;
  hasEmergencyFund?: boolean;
}

export const useFinancialScore = (globalTotals: GlobalTotals, user: UserMetrics | null) => {
  return useMemo(() => {
    if (!user) return { score: 0, tooltip: "Usuário não identificado.", sustainableDaily: 0, estimatedTax: 0 };

    const isPj = user.employmentType === 'pj';
    const dependents = user.dependents ?? 0;
    const emergencyMonths = isPj ? 12 : 6;
    const monthlyFixedCosts = globalTotals.expense > 0 ? globalTotals.expense : (user.monthlyIncome ?? 0) * 0.6;
    const requiredReserve = monthlyFixedCosts * emergencyMonths;
    const dependentPenalty = 1 - (dependents * 0.08);

    // Sustainable Daily Spending
    const sustainableDaily = globalTotals.netWorth > 0
      ? Math.round(globalTotals.netWorth * 0.04 / 365 * Math.max(0.4, dependentPenalty))
      : 0;

    // Estimated Taxes
    const monthlyRevenue = user.monthlyIncome ?? globalTotals.income;
    const estimatedTax = isPj
      ? Math.round(monthlyRevenue * 0.06)
      : Math.round(Math.max(0, (monthlyRevenue - 4664) * 0.275));

    // Health Score
    if (globalTotals.income === 0) {
      return { score: 0, tooltip: "Registre receitas para calcular o score de saúde.", sustainableDaily, estimatedTax };
    }

    const savingsRatio = globalTotals.balance / globalTotals.income;
    const debtRatio = globalTotals.liabilities / (globalTotals.assets || 1);
    let score = Math.round((savingsRatio * 50) + ((1 - debtRatio) * 50));
    let tooltip = "Score Base. ";

    const currentBalance = globalTotals.balance;
    if (currentBalance < requiredReserve) {
      const reserveGap = (requiredReserve - currentBalance) / requiredReserve;
      score = Math.round(score * (1 - reserveGap * 0.4));
      tooltip += isPj 
        ? "⚠️ Reserva PF limitada afeta PJ (-score). " 
        : "⚠️ Reserva inferior a 6 meses de segurança (-score). ";
    }
    if (dependents > 0 && !user.hasEmergencyFund) {
      score = Math.round(score * (1 - dependents * 0.04));
      tooltip += `⚠️ ${dependents} dependente(s) sem Fundo de Emergência (-score).`;
    }
    
    if (tooltip === "Score Base. ") tooltip = "Seu score está ótimo! Reserva adequada e endividamento sob controle.";
    
    return {
      score: Math.min(100, Math.max(0, score)),
      tooltip,
      sustainableDaily,
      estimatedTax
    };
  }, [globalTotals, user]);
};
