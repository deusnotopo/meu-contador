import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useInvestments } from './useInvestments';
import { useBudgets } from './useBudgets';
import { useGoals } from './useGoals';
import { useDebts } from './useDebts';
import {
  buildFinancialContext,
  generateContextualInsights,
  type FinancialContext,
  type ContextualInsight,
} from '@/lib/ai/contextual-insights';

export function useFinancialContext() {
  const personal = useTransactions('personal');
  const business = useTransactions('business');
  const { assets } = useInvestments();
  const { budgets } = useBudgets();
  const { goals } = useGoals();
  const { debts } = useDebts();

  // Combine personal and business transactions
  const allTransactions = useMemo(() => {
    return [...personal.allTransactions, ...business.allTransactions];
  }, [personal.allTransactions, business.allTransactions]);

  // Build comprehensive financial context
  const context: FinancialContext = useMemo(() => {
    return buildFinancialContext(
      allTransactions,
      assets,
      budgets,
      goals,
      debts
    );
  }, [allTransactions, assets, budgets, goals, debts]);

  // Generate AI insights
  const insights: ContextualInsight = useMemo(() => {
    return generateContextualInsights(context);
  }, [context]);

  // Quick access to key metrics
  const metrics = useMemo(() => ({
    // Core
    totalIncome: context.totalIncome,
    totalExpense: context.totalExpense,
    balance: context.balance,
    savingsRate: context.savingsRate,

    // Portfolio
    portfolioValue: context.portfolioValue,
    portfolioProfit: context.portfolioProfit,
    portfolioProfitPercent: context.portfolioProfitPercent,

    // Health
    healthScore: insights.score,
    recommendationsCount: insights.recommendations.length,
    highPriorityCount: insights.recommendations.filter(r => r.priority === 'high').length,

    // Alerts
    hasWarnings: insights.alerts.some(a => a.type === 'warning'),
    hasSuccess: insights.alerts.some(a => a.type === 'success'),

    // Predictions
    endOfMonthBalance: insights.predictions.endOfMonthBalance,
    yearEndProjection: insights.predictions.yearEndProjection,
  }), [context, insights]);

  // Generate AI context string for chat
  const aiContextString = useMemo(() => {
    return `
CONTEXTO FINANCEIRO DO USUÁRIO:
================================

MÉTRICAS PRINCIPAIS:
- Renda Total: R$ ${context.totalIncome.toLocaleString('pt-BR')}
- Despesas Totais: R$ ${context.totalExpense.toLocaleString('pt-BR')}
- Saldo: R$ ${context.balance.toLocaleString('pt-BR')}
- Taxa de Poupança: ${context.savingsRate.toFixed(1)}%

INVESTIMENTOS:
- Valor da Carteira: R$ ${context.portfolioValue.toLocaleString('pt-BR')}
- Lucro/Prejuízo: R$ ${context.portfolioProfit.toLocaleString('pt-BR')} (${context.portfolioProfitPercent.toFixed(1)}%)
- Alocação: ${Object.entries(context.assetAllocation).map(([type, value]) => `${type}: R$ ${value.toLocaleString('pt-BR')}`).join(', ')}

METAS:
${context.goalsProgress.map(g => `- ${g.name}: R$ ${g.current.toLocaleString('pt-BR')} / R$ ${g.target.toLocaleString('pt-BR')} (${g.percent.toFixed(1)}%)`).join('\n')}

DÍVIDAS:
- Total: R$ ${context.totalDebt.toLocaleString('pt-BR')}
- Razão Dívida/Patrimônio: ${context.debtToAssetRatio.toFixed(1)}%

ORÇAMENTOS:
${context.budgetAdherence.map(b => `- ${b.category}: R$ ${b.spent.toLocaleString('pt-BR')} / R$ ${b.limit.toLocaleString('pt-BR')} (${b.percent.toFixed(1)}%)`).join('\n')}

TOP CATEGORIAS DE GASTO:
${context.topCategories.map(c => `- ${c.category}: R$ ${c.amount.toLocaleString('pt-BR')} (${c.percent.toFixed(1)}%)`).join('\n')}

COMPORTAMENTO:
- Gasto Médio Diário: R$ ${context.averageDailySpend.toLocaleString('pt-BR')}
${context.largestExpense ? `- Maior Gasto: ${context.largestExpense.description} (R$ ${context.largestExpense.amount.toLocaleString('pt-BR')})` : ''}
${context.recurringExpenses.length > 0 ? `- Despesas Recorrentes: ${context.recurringExpenses.map(e => `${e.description} (R$ ${e.amount})`).join(', ')}` : ''}

SCORE DE SAÚDE FINANCEIRA: ${insights.score}/100

RECOMENDAÇÕES PRIORITÁRIAS:
${insights.recommendations.filter(r => r.priority === 'high').map(r => `- ${r.title}: ${r.description}`).join('\n')}

PREVISÕES:
- Saldo Final do Mês: R$ ${insights.predictions.endOfMonthBalance.toLocaleString('pt-BR')}
- Projeção Fim do Ano: R$ ${insights.predictions.yearEndProjection.toLocaleString('pt-BR')}
`;
  }, [context, insights]);

  return {
    // Full context
    context,
    insights,

    // Quick metrics
    metrics,

    // AI context for chat
    aiContextString,

    // Raw data
    transactions: allTransactions,
    investments: assets,
    budgets,
    goals,
    debts,

    // Loading states
    isLoading: personal.isLoading || business.isLoading,
    error: personal.error || business.error,
  };
}