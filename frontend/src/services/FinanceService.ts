import {
  calcularSalarioLiquido,
  calcularINSS,
  calcularIRRF,
  simularJurosCompostos,
  calcularScoreFinanceiro,
  INDICADORES_BRASIL,
} from "@/lib/finance/brasil-indicadores";
import type { Investment } from "@/lib/schemas";
import type { Debt } from "@/types";

export interface FinancialMetrics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  portfolioValue: number;
  portfolioProfit: number;
  totalDebt: number;
  investmentTypes: number;
}

export interface FireConfig {
  currentNetWorth: number;
  monthlyExpenses: number;
  monthlyDeposit: number;
  yearlyReturn: number;
  withdrawalRate: number;
}


export class FinanceService {
  /**
   * Calcula métricas agregadas a partir de dados brutos
   */
  static aggregateMetrics(data: {
    income: number;
    expense: number;
    assets: Investment[];
    debts: Debt[];
  }): FinancialMetrics {
    const { income, expense, assets, debts } = data;
    const balance = income - expense;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;

    const portfolioValue = assets.reduce(
      (sum, i) => sum + i.currentPrice * i.amount,
      0,
    );
    const portfolioInvested = assets.reduce(
      (sum, i) => sum + i.averagePrice * i.amount,
      0,
    );
    const portfolioProfit = portfolioValue - portfolioInvested;

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const investmentTypes = new Set(assets.map((i) => i.type)).size;

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
      savingsRate,
      portfolioValue,
      portfolioProfit,
      totalDebt,
      investmentTypes,
    };
  }

  /**
   * Gera o breakdown completo de impostos e salário (CLT)
   */
  static getTaxBreakdown(grossSalary: number) {
    if (grossSalary <= 0) return null;

    const salaryBreakdown = calcularSalarioLiquido(grossSalary);
    const inssBreakdown = calcularINSS(grossSalary);
    const irrfBreakdown = calcularIRRF(
      grossSalary - inssBreakdown.contribuicao,
    );

    return {
      salary: salaryBreakdown,
      inss: inssBreakdown,
      irrf: irrfBreakdown,
    };
  }

  /**
   * Calcula projeção de liberdade financeira (FIRE)
   */
  static calculateFire(config: FireConfig) {
    const {
      currentNetWorth,
      monthlyExpenses,
      monthlyDeposit,
      yearlyReturn,
      withdrawalRate,
    } = config;
    const monthlyRate = Math.pow(1 + yearlyReturn / 100, 1 / 12) - 1;
    const withdrawalMultiplier = 1 / withdrawalRate;

    const targets = {
      lean: monthlyExpenses * 0.6 * 12 * withdrawalMultiplier,
      base: monthlyExpenses * 12 * withdrawalMultiplier,
      fat: monthlyExpenses * 1.8 * 12 * withdrawalMultiplier,
    };

    const calculateMonths = (target: number) => {
      if (target <= 0) return 0;
      if (currentNetWorth >= target) return 0;
      if (monthlyRate === 0) {
        return monthlyDeposit > 0
          ? (target - currentNetWorth) / monthlyDeposit
          : Infinity;
      }

      let balance = currentNetWorth;
      let months = 0;
      while (balance < target && months < 1200) {
        balance = balance * (1 + monthlyRate) + monthlyDeposit;
        months++;
      }
      return months;
    };

    return {
      targets,
      months: {
        lean: calculateMonths(targets.lean),
        base: calculateMonths(targets.base),
        fat: calculateMonths(targets.fat),
      },
      safeWithdrawals: {
        lean: monthlyExpenses * 0.6,
        base: monthlyExpenses,
        fat: monthlyExpenses * 1.8,
      },
    };
  }

  /**
   * Avalia a saúde financeira e gera insights
   */
  static conductHealthCheck(metrics: FinancialMetrics, reservesCount: number) {
    const monthsEmergencyReserve =
      metrics.totalExpense > 0 ? reservesCount / metrics.totalExpense : 0;

    const score = calcularScoreFinanceiro(
      metrics.totalIncome,
      metrics.totalExpense,
      metrics.portfolioValue,
      metrics.totalDebt,
      metrics.investmentTypes,
      monthsEmergencyReserve,
    );

    const insights: string[] = [];

    if (metrics.savingsRate < 10) {
      insights.push(
        `💡 Taxa de poupança abaixo de 10%. Meta: R$ ${Math.round(metrics.totalIncome * 0.1).toLocaleString("pt-BR")}/mês.`,
      );
    }

    if (monthsEmergencyReserve < 3) {
      insights.push(
        "🚨 Reserva de emergência insuficiente. Prioridade: atingir 3 meses de despesas.",
      );
    }

    if (
      metrics.totalDebt > 0 &&
      metrics.totalDebt / (metrics.portfolioValue || 1) > 0.5
    ) {
      insights.push(
        "⚠️ Endividamento alto! Foque na quitação antes de novos investimentos aportes.",
      );
    }

    return {
      score,
      monthsEmergencyReserve,
      insights,
    };
  }

  /**
   * Projeção de Juros Compostos
   */
  static simulateWealthGrowth(metrics: FinancialMetrics) {
    const aporteMensal = Math.max(0, metrics.balance);
    return simularJurosCompostos(
      metrics.portfolioValue,
      aporteMensal,
      INDICADORES_BRASIL.CDI?.valor ?? 11.15,
      10,
    );
  }
}
