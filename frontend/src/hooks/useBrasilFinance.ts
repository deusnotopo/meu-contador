import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useInvestments } from './useInvestments';
import { useDebts } from './useDebts';
import { useGoals } from './useGoals';
import { FinanceService } from '@/services/FinanceService';
import { compararInvestimentos, INDICADORES_BRASIL, calcularReservaEmergencia } from '@/lib/finance/brasil-indicadores';

export function useBrasilFinance() {
  const personal = useTransactions('personal');
  const { assets } = useInvestments();
  const { debts } = useDebts();
  const { goals } = useGoals();

  const metrics = useMemo(() => {
    return FinanceService.aggregateMetrics({
      income: personal.totals.income,
      expense: personal.totals.expense,
      assets,
      debts
    });
  }, [personal, assets, debts]);

  const taxBreakdown = useMemo(() => FinanceService.getTaxBreakdown(metrics.totalIncome), [metrics.totalIncome]);

  const investmentComparison = useMemo(() => compararInvestimentos(metrics.portfolioValue, 12), [metrics.portfolioValue]);

  const compoundInterest = useMemo(() => FinanceService.simulateWealthGrowth(metrics), [metrics]);

  const reservesTotal = useMemo(() => {
    return goals
      .filter(g => g.name.toLowerCase().includes('reserva') || g.name.toLowerCase().includes('emergência'))
      .reduce((sum, g) => sum + g.currentAmount, 0);
  }, [goals]);

  const health = useMemo(() => FinanceService.conductHealthCheck(metrics, reservesTotal), [metrics, reservesTotal]);

  const emergencyPlan = useMemo(() => {
    return calcularReservaEmergencia(
      metrics.totalExpense,
      true, 
      false,
      metrics.totalDebt > 0
    );
  }, [metrics.totalExpense, metrics.totalDebt]);

  const fireMetrics = useMemo(() => {
    return FinanceService.calculateFire({
      currentNetWorth: metrics.portfolioValue,
      monthlyExpenses: metrics.totalExpense,
      monthlyDeposit: Math.max(0, metrics.balance),
      yearlyReturn: INDICADORES_BRASIL.CDI?.valor ?? 11.15,
      withdrawalRate: 0.032 // 3.2%
    });
  }, [metrics]);

  return {
    indicators: INDICADORES_BRASIL,
    metrics,
    salaryBreakdown: taxBreakdown?.salary || null,
    inssBreakdown: taxBreakdown?.inss || null,
    irrfBreakdown: taxBreakdown?.irrf || null,
    investmentComparison,
    compoundInterest,
    emergencyReserve: emergencyPlan,
    monthsEmergencyReserve: health.monthsEmergencyReserve,
    fireMetrics,
    financialScore: health.score,
    insights: health.insights,
    healthScore: health.score.score,
    healthClass: health.score.classificacao,
    healthColor: health.score.cor,
  };
}