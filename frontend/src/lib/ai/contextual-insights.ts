import type { Transaction, Investment, Budget, SavingsGoal, Debt } from '@/types';

export interface FinancialContext {
  // Core metrics
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  
  // Investments
  portfolioValue: number;
  portfolioProfit: number;
  portfolioProfitPercent: number;
  assetAllocation: Record<string, number>;
  
  // Goals
  goalsProgress: { name: string; current: number; target: number; percent: number }[];
  
  // Debts
  totalDebt: number;
  debtToAssetRatio: number;
  
  // Budgets
  budgetAdherence: { category: string; spent: number; limit: number; percent: number }[];
  
  // Trends
  monthlyTrend: { month: string; income: number; expense: number; balance: number }[];
  topCategories: { category: string; amount: number; percent: number }[];
  
  // Behavioral
  averageDailySpend: number;
  largestExpense: { description: string; amount: number; date: string } | null;
  recurringExpenses: { description: string; amount: number; frequency: string }[];
}

export interface AIRecommendation {
  type: 'saving' | 'investment' | 'debt' | 'budget' | 'goal' | 'behavior';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action?: string;
  amount?: number;
}

export interface ContextualInsight {
  score: number;
  summary: string;
  recommendations: AIRecommendation[];
  predictions: {
    endOfMonthBalance: number;
    yearEndProjection: number;
    goalCompletionDates: { goal: string; estimatedDate: string }[];
  };
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
  }[];
}

/**
 * Builds comprehensive financial context from all user data
 */
export function buildFinancialContext(
  transactions: Transaction[],
  investments: Investment[],
  budgets: Budget[],
  goals: SavingsGoal[],
  debts: Debt[]
): FinancialContext {
  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  // Portfolio metrics
  const portfolioValue = investments.reduce((sum, i) => sum + (i.currentPrice * i.amount), 0);
  const portfolioInvested = investments.reduce((sum, i) => sum + (i.averagePrice * i.amount), 0);
  const portfolioProfit = portfolioValue - portfolioInvested;
  const portfolioProfitPercent = portfolioInvested > 0 ? (portfolioProfit / portfolioInvested) * 100 : 0;

  // Asset allocation
  const assetAllocation: Record<string, number> = {};
  investments.forEach(inv => {
    const value = inv.currentPrice * inv.amount;
    assetAllocation[inv.type] = (assetAllocation[inv.type] || 0) + value;
  });

  // Goals progress
  const goalsProgress = goals.map(g => ({
    name: g.name,
    current: g.currentAmount,
    target: g.targetAmount,
    percent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
  }));

  // Debt metrics
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalAssets = portfolioValue + balance;
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

  // Budget adherence
  const budgetAdherence = budgets.map(b => ({
    category: b.category,
    spent: b.spent,
    limit: b.limit,
    percent: b.limit > 0 ? (b.spent / b.limit) * 100 : 0,
  }));

  // Monthly trend (last 6 months)
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const month = t.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyData[month]!.income += t.amount;
    else monthlyData[month]!.expense += t.amount;
  });

  const monthlyTrend = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    }));

  // Top spending categories
  const categoryTotals: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const totalExpenseForCategories = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpenseForCategories > 0 ? (amount / totalExpenseForCategories) * 100 : 0,
    }));

  // Behavioral analysis
  const expenses = transactions.filter(t => t.type === 'expense');
  const uniqueDays = new Set(expenses.map(t => t.date.substring(0, 10))).size;
  const averageDailySpend = uniqueDays > 0 ? totalExpense / uniqueDays : 0;

  const largestExpense = expenses.length > 0
    ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0]!)
    : null;

  // Detect recurring expenses
  const recurringMap: Record<string, { amount: number; count: number }> = {};
  transactions.filter(t => t.type === 'expense' && t.recurring).forEach(t => {
    const key = t.description.toLowerCase();
    if (!recurringMap[key]) recurringMap[key] = { amount: 0, count: 0 };
    recurringMap[key]!.amount += t.amount;
    recurringMap[key]!.count++;
  });

  const recurringExpenses = Object.entries(recurringMap)
    .filter(([_, data]) => data.count >= 2)
    .map(([desc, data]) => ({
      description: desc,
      amount: Math.round(data.amount / data.count),
      frequency: data.count >= 3 ? 'Mensal' : 'Recorrente',
    }));

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsRate,
    portfolioValue,
    portfolioProfit,
    portfolioProfitPercent,
    assetAllocation,
    goalsProgress,
    totalDebt,
    debtToAssetRatio,
    budgetAdherence,
    monthlyTrend,
    topCategories,
    averageDailySpend,
    largestExpense: largestExpense ? {
      description: largestExpense.description,
      amount: largestExpense.amount,
      date: largestExpense.date,
    } : null,
    recurringExpenses,
  };
}

/**
 * Generates contextual insights and recommendations
 */
export function generateContextualInsights(context: FinancialContext): ContextualInsight {
  const recommendations: AIRecommendation[] = [];
  const alerts: ContextualInsight['alerts'] = [];

  // Calculate financial health score (0-100)
  let score = 50;
  
  // Savings rate impact (max +25)
  if (context.savingsRate >= 20) score += 25;
  else if (context.savingsRate >= 10) score += 15;
  else if (context.savingsRate >= 0) score += 5;
  else score -= 10;

  // Debt impact (max -20)
  if (context.debtToAssetRatio > 50) score -= 20;
  else if (context.debtToAssetRatio > 30) score -= 10;
  else if (context.debtToAssetRatio < 10) score += 10;

  // Budget adherence (max +15)
  const overBudgetCount = context.budgetAdherence.filter(b => b.percent > 100).length;
  if (overBudgetCount === 0 && context.budgetAdherence.length > 0) score += 15;
  else if (overBudgetCount <= 2) score += 5;
  else score -= 10;

  // Investment diversification (max +10)
  const assetTypes = Object.keys(context.assetAllocation).length;
  if (assetTypes >= 3) score += 10;
  else if (assetTypes >= 2) score += 5;

  score = Math.max(0, Math.min(100, score));

  // Generate recommendations based on analysis
  
  // 1. Savings recommendations
  if (context.savingsRate < 10) {
    recommendations.push({
      type: 'saving',
      priority: 'high',
      title: 'Aumente sua taxa de poupança',
      description: `Sua taxa de poupança atual é ${context.savingsRate.toFixed(1)}%. O ideal é pelo menos 20%.`,
      impact: `Economizando mais R$ ${Math.round(context.totalIncome * 0.1)}/mês, você terá R$ ${Math.round(context.totalIncome * 0.1 * 12 * 1.1)} em 1 ano (com juros compostos).`,
      action: 'Revise seus gastos nas categorias principais e corte o que não é essencial.',
      amount: context.totalIncome * 0.1,
    });
  }

  // 2. Budget alerts
  context.budgetAdherence.filter(b => b.percent > 100).forEach(b => {
    recommendations.push({
      type: 'budget',
      priority: 'high',
      title: `Orçamento de ${b.category} estourado`,
      description: `Você gastou ${b.percent.toFixed(0)}% do orçamento de ${b.category} (R$ ${b.spent.toFixed(2)} de R$ ${b.limit.toFixed(2)}).`,
      impact: `Se continuar neste ritmo, gastará R$ ${(b.spent * 1.2).toFixed(2)} a mais até o final do mês.`,
      action: 'Considere reduzir gastos nesta categoria ou ajustar o orçamento.',
    });
  });

  // 3. Investment diversification
  if (assetTypes < 2 && context.portfolioValue > 0) {
    recommendations.push({
      type: 'investment',
      priority: 'medium',
      title: 'Diversifique seus investimentos',
      description: `Sua carteira está concentrada em apenas ${assetTypes} tipo(s) de ativo.`,
      impact: 'Diversificação reduz risco e pode aumentar retornos em 15-20% no longo prazo.',
      action: 'Considere adicionar renda fixa, FIIs ou ETFs internacionais.',
    });
  }

  // 4. Debt management
  if (context.totalDebt > 0 && context.debtToAssetRatio > 30) {
    recommendations.push({
      type: 'debt',
      priority: 'high',
      title: 'Priorize o pagamento de dívidas',
      description: `Suas dívidas representam ${context.debtToAssetRatio.toFixed(1)}% do seu patrimônio.`,
      impact: `Pagando R$ ${Math.round(context.totalDebt * 0.1)}/mês a mais, quita em ${Math.ceil(context.totalDebt / (context.totalDebt * 0.1))} meses.`,
      action: 'Use o método avalanche: quite primeiro as dívidas com maior juros.',
      amount: context.totalDebt * 0.1,
    });
  }

  // 5. Goal acceleration
  const slowGoals = context.goalsProgress.filter(g => g.percent < 30 && g.target > 0);
  if (slowGoals.length > 0) {
    const goal = slowGoals[0]!;
    recommendations.push({
      type: 'goal',
      priority: 'medium',
      title: `Acelere a meta "${goal.name}"`,
      description: `Você atingiu apenas ${goal.percent.toFixed(1)}% da meta (R$ ${goal.current.toFixed(2)} de R$ ${goal.target.toFixed(2)}).`,
      impact: `Aumentando o aporte em R$ 500/mês, atinge a meta ${(goal.target - goal.current) / 500} meses antes.`,
      action: 'Configure transferências automáticas para esta meta.',
    });
  }

  // 6. Behavioral insights
  if (context.largestExpense && context.largestExpense.amount > context.totalExpense * 0.3) {
    recommendations.push({
      type: 'behavior',
      priority: 'medium',
      title: 'Gasto principal muito alto',
      description: `"${context.largestExpense.description}" representa ${((context.largestExpense.amount / context.totalExpense) * 100).toFixed(1)}% dos seus gastos.`,
      impact: 'Reduzindo este gasto em 20%, você economiza R$ ' + Math.round(context.largestExpense.amount * 0.2) + '/mês.',
      action: 'Analise se este gasto pode ser reduzido ou substituído.',
    });
  }

  // Generate alerts
  if (context.balance < 0) {
    alerts.push({
      type: 'warning',
      message: `⚠️ Seus gastos excedem sua renda em R$ ${Math.abs(context.balance).toFixed(2)} este mês.`,
    });
  }

  if (context.savingsRate >= 20) {
    alerts.push({
      type: 'success',
      message: `🎉 Parabéns! Sua taxa de poupança de ${context.savingsRate.toFixed(1)}% está acima da média brasileira.`,
    });
  }

  // Predictions
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailyAverage = context.totalExpense / Math.max(currentDay, 1);
  const projectedMonthExpense = dailyAverage * daysInMonth;
  const endOfMonthBalance = context.totalIncome - projectedMonthExpense;

  const monthlySavings = context.balance;
  const yearEndProjection = context.balance + (monthlySavings * (12 - currentMonth - 1));

  const goalCompletionDates = context.goalsProgress
    .filter(g => g.percent < 100 && monthlySavings > 0)
    .map(g => {
      const remaining = g.target - g.current;
      const monthsNeeded = Math.ceil(remaining / (monthlySavings * 0.3)); // Assume 30% of savings go to goals
      const completionDate = new Date();
      completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
      return {
        goal: g.name,
        estimatedDate: completionDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      };
    });

  // Generate summary
  const summary = generateSummary(score, context, recommendations);

  return {
    score,
    summary,
    recommendations,
    predictions: {
      endOfMonthBalance,
      yearEndProjection,
      goalCompletionDates,
    },
    alerts,
  };
}

function generateSummary(score: number, context: FinancialContext, recommendations: AIRecommendation[]): string {
  const parts: string[] = [];

  if (score >= 80) {
    parts.push('🟢 Suas finanças estão em excelente estado!');
  } else if (score >= 60) {
    parts.push('🟡 Suas finanças estão no caminho certo, mas há pontos de melhoria.');
  } else if (score >= 40) {
    parts.push('🟠 Suas finanças precisam de atenção em algumas áreas.');
  } else {
    parts.push('🔴 Suas finanças requerem ação imediata para evitar problemas.');
  }

  if (context.savingsRate > 0) {
    parts.push(`Você está poupando ${context.savingsRate.toFixed(1)}% da sua renda.`);
  } else {
    parts.push('Você não está poupando nada este mês.');
  }

  if (context.portfolioValue > 0) {
    parts.push(`Seu patrimônio investido vale R$ ${context.portfolioValue.toLocaleString('pt-BR')}.`);
  }

  const highPriority = recommendations.filter(r => r.priority === 'high').length;
  if (highPriority > 0) {
    parts.push(`Há ${highPriority} recomendação(ões) prioritária(s) para implementar.`);
  }

  return parts.join(' ');
}