import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useInvestments } from './useInvestments';
import { useDebts } from './useDebts';
import { useGoals } from './useGoals';
import {
  calcularSalarioLiquido,
  calcularINSS,
  calcularIRRF,
  compararInvestimentos,
  simularJurosCompostos,
  calcularReservaEmergencia,
  calcularFIRE,
  calcularScoreFinanceiro,
  INDICADORES_BRASIL,
  type ScoreFinanceiro,
  type ComparativoInvestimento,
} from '@/lib/finance/brasil-indicadores';

export function useBrasilFinance() {
  const personal = useTransactions('personal');
  const { assets } = useInvestments();
  const { debts } = useDebts();
  const { goals } = useGoals();

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const totalIncome = personal.totals.income;
    const totalExpense = personal.totals.expense;
    const balance = personal.totals.balance;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    // Portfolio metrics
    const portfolioValue = assets.reduce((sum: number, i) => sum + (i.currentPrice * i.amount), 0);
    const portfolioInvested = assets.reduce((sum: number, i) => sum + (i.averagePrice * i.amount), 0);
    const portfolioProfit = portfolioValue - portfolioInvested;

    // Debt metrics
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

    // Investment types
    const investmentTypes = new Set(assets.map((i) => i.type)).size;

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      portfolioValue,
      portfolioProfit,
      totalDebt,
      investmentTypes,
    };
  }, [personal, assets, debts]);

  // Calculate salary breakdown (assumes totalIncome is monthly salary)
  const salaryBreakdown = useMemo(() => {
    if (metrics.totalIncome <= 0) return null;
    return calcularSalarioLiquido(metrics.totalIncome);
  }, [metrics.totalIncome]);

  // Calculate INSS
  const inssBreakdown = useMemo(() => {
    if (metrics.totalIncome <= 0) return null;
    return calcularINSS(metrics.totalIncome);
  }, [metrics.totalIncome]);

  // Calculate IRRF
  const irrfBreakdown = useMemo(() => {
    if (metrics.totalIncome <= 0 || !inssBreakdown) return null;
    return calcularIRRF(metrics.totalIncome - inssBreakdown.contribuicao);
  }, [metrics.totalIncome, inssBreakdown]);

  // Compare investments
  const investmentComparison = useMemo((): ComparativoInvestimento[] => {
    return compararInvestimentos(metrics.portfolioValue, 12);
  }, [metrics.portfolioValue]);

  // Simulate compound interest
  const compoundInterest = useMemo(() => {
    const aporteMensal = Math.max(0, metrics.balance);
    if (aporteMensal <= 0) return null;
    return simularJurosCompostos(
      metrics.portfolioValue,
      aporteMensal,
      INDICADORES_BRASIL.CDI?.valor ?? 11.15,
      10
    );
  }, [metrics.portfolioValue, metrics.balance]);

  // Calculate emergency reserve
  const emergencyReserve = useMemo(() => {
    return calcularReservaEmergencia(
      metrics.totalExpense,
      true, // Assume formal employment
      false,
      metrics.totalDebt > 0
    );
  }, [metrics.totalExpense, metrics.totalDebt]);

  // Calculate months of emergency reserve
  const monthsEmergencyReserve = useMemo(() => {
    const reserves = goals
      .filter(g => g.name.toLowerCase().includes('reserva') || g.name.toLowerCase().includes('emergência'))
      .reduce((sum, g) => sum + g.currentAmount, 0);
    
    return metrics.totalExpense > 0 ? reserves / metrics.totalExpense : 0;
  }, [goals, metrics.totalExpense]);

  // Calculate FIRE
  const fireMetrics = useMemo(() => {
    const despesasAnuais = metrics.totalExpense * 12;
    return calcularFIRE(despesasAnuais);
  }, [metrics.totalExpense]);

  // Calculate financial score
  const financialScore = useMemo((): ScoreFinanceiro => {
    return calcularScoreFinanceiro(
      metrics.totalIncome,
      metrics.totalExpense,
      metrics.portfolioValue,
      metrics.totalDebt,
      metrics.investmentTypes,
      monthsEmergencyReserve
    );
  }, [metrics, monthsEmergencyReserve]);

  // Indicators
  const indicators = INDICADORES_BRASIL;

  // Generate insights based on Brazilian reality
  const insights = useMemo(() => {
    const result: string[] = [];

    // Savings rate
    if (metrics.savingsRate < 10) {
      result.push('💡 Taxa de poupança abaixo de 10%. Tente economizar pelo menos R$ ' + 
        Math.round(metrics.totalIncome * 0.1).toLocaleString('pt-BR') + '/mês.');
    }

    // Emergency reserve
    if (monthsEmergencyReserve < 3) {
      result.push('🚨 Reserva de emergência insuficiente. Você precisa de pelo menos R$ ' +
        Math.round(emergencyReserve.valorMinimo).toLocaleString('pt-BR') + ' (3 meses).');
    }

    // Investment diversification
    if (metrics.investmentTypes < 2) {
      result.push('📊 Carteira pouco diversificada. Considere adicionar renda fixa (Tesouro Direto) e/ou FIIs.');
    }

    // Debt
    if (metrics.totalDebt > 0) {
      const debtRatio = metrics.portfolioValue > 0 
        ? (metrics.totalDebt / metrics.portfolioValue) * 100 
        : 100;
      
      if (debtRatio > 50) {
        result.push('⚠️ Endividamento alto! Priorize quitar dívidas antes de investir mais.');
      }
    }

    // INSS recommendation
    if (salaryBreakdown && salaryBreakdown.percentualDesconto > 30) {
      result.push('🧾 Seus descontos são altos (' + salaryBreakdown.percentualDesconto.toFixed(1) + 
        '%). Considere PGBL para deduzir até 12% do IR.');
    }

    return result;
  }, [metrics, monthsEmergencyReserve, emergencyReserve, salaryBreakdown]);

  return {
    // Indicators
    indicators,

    // Metrics
    metrics,
    salaryBreakdown,
    inssBreakdown,
    irrfBreakdown,

    // Investment analysis
    investmentComparison,
    compoundInterest,

    // Emergency planning
    emergencyReserve,
    monthsEmergencyReserve,

    // Retirement
    fireMetrics,

    // Score
    financialScore,

    // Insights
    insights,

    // Quick access
    healthScore: financialScore.score,
    healthClass: financialScore.classificacao,
    healthColor: financialScore.cor,
  };
}