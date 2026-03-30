import { useMemo } from 'react';
import { useTransactions } from './useTransactions';

export interface RecurringExpense {
  id: string;
  description: string;
  category: string;
  averageAmount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  lastPayment: string;
  nextPayment: string;
  paymentDay: number;
  totalPaidLast12Months: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercent: number;
  isOverpriced: boolean;
  marketComparison?: {
    average: number;
    difference: number;
    recommendation: string;
    sourceLabel: string;
    isReference: boolean;
  };
}

export interface RecurringSummary {
  totalMonthly: number;
  totalAnnual: number;
  itemCount: number;
  overpricedCount: number;
  potentialSavings: number;
  topCategories: { category: string; amount: number; percent: number }[];
}

// Benchmarks de referência para alertas heurísticos.
// Não representam cotação oficial nem média estatística nacional consolidada.
const REFERENCE_BENCHMARKS: Record<string, { average: number; sourceLabel: string }> = {
  'Netflix': { average: 55.90, sourceLabel: 'faixa de plano padrão' },
  'Spotify': { average: 21.90, sourceLabel: 'faixa de plano individual' },
  'Amazon Prime': { average: 14.90, sourceLabel: 'assinatura base divulgada' },
  'Disney+': { average: 33.90, sourceLabel: 'faixa promocional/base' },
  'HBO Max': { average: 34.90, sourceLabel: 'faixa de assinatura mensal' },
  'YouTube Premium': { average: 20.90, sourceLabel: 'faixa de assinatura individual' },
  'Academia': { average: 120.00, sourceLabel: 'referência urbana simplificada' },
  'Plano de Saúde': { average: 800.00, sourceLabel: 'referência simplificada individual' },
  'Internet': { average: 100.00, sourceLabel: 'banda larga residencial de entrada' },
  'Celular': { average: 60.00, sourceLabel: 'plano controle/pós básico' },
  'Aluguel': { average: 1500.00, sourceLabel: 'referência genérica, depende fortemente da praça' },
  'Condomínio': { average: 500.00, sourceLabel: 'referência genérica de condomínio urbano' },
  'Energia Elétrica': { average: 200.00, sourceLabel: 'consumo residencial simplificado' },
  'Água': { average: 80.00, sourceLabel: 'referência residencial simplificada' },
  'Gás': { average: 100.00, sourceLabel: 'referência simplificada' },
  'Seguro Auto': { average: 200.00, sourceLabel: 'referência mensalizada simplificada' },
  'Financiamento Auto': { average: 800.00, sourceLabel: 'parcela de referência simplificada' },
  'Parcela Curso': { average: 300.00, sourceLabel: 'ticket educacional simplificado' },
};

export function useRecurringExpenses() {
  const personal = useTransactions('personal');

  // Detect recurring expenses from transaction history
  const recurringExpenses = useMemo((): RecurringExpense[] => {
    const descriptionMap: Record<string, {
      amounts: number[];
      dates: string[];
      category: string;
    }> = {};

    // Group transactions by description
    personal.allTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const key = tx.description.toLowerCase().trim();
        if (!descriptionMap[key]) {
          descriptionMap[key] = {
            amounts: [],
            dates: [],
            category: tx.category,
          };
        }
        descriptionMap[key]!.amounts.push(tx.amount);
        descriptionMap[key]!.dates.push(tx.date);
      });

    // Filter for recurring (at least 2 occurrences)
    const recurring: RecurringExpense[] = [];
    
    Object.entries(descriptionMap).forEach(([desc, data]) => {
      if (data.amounts.length < 2) return;

      const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
      const sortedDates = [...data.dates].sort();
      const lastDate = sortedDates[sortedDates.length - 1]!;
      
      // Detect payment day
      const days = data.dates.map(d => new Date(d).getDate());
      const paymentDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);

      // Calculate next payment
      const lastDateObj = new Date(lastDate);
      const nextPayment = new Date(lastDateObj);
      nextPayment.setMonth(nextPayment.getMonth() + 1);
      nextPayment.setDate(paymentDay);

      // Calculate trend
      const recentAmounts = data.amounts.slice(-3);
      const olderAmounts = data.amounts.slice(0, -3);
      
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      let trendPercent = 0;
      
      if (olderAmounts.length > 0 && recentAmounts.length > 0) {
        const recentAvg = recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length;
        const olderAvg = olderAmounts.reduce((a, b) => a + b, 0) / olderAmounts.length;
        
        if (olderAvg > 0) {
          trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
          if (trendPercent > 5) trend = 'increasing';
          else if (trendPercent < -5) trend = 'decreasing';
        }
      }

      // Calculate total paid in last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const totalPaidLast12Months = data.amounts.reduce((sum, amount, i) => {
        const date = new Date(data.dates[i]!);
        return date >= twelveMonthsAgo ? sum + amount : sum;
      }, 0);

      // Check if overpriced
      const descNormalized = desc.charAt(0).toUpperCase() + desc.slice(1);
      const benchmark = REFERENCE_BENCHMARKS[descNormalized];
      const marketAvg = benchmark?.average;
      const isOverpriced = marketAvg ? avgAmount > marketAvg * 1.1 : false;

      recurring.push({
        id: desc,
        description: descNormalized,
        category: data.category,
        averageAmount: avgAmount,
        frequency: 'monthly',
        lastPayment: lastDate,
        nextPayment: nextPayment.toISOString().split('T')[0]!,
        paymentDay,
        totalPaidLast12Months,
        trend,
        trendPercent,
        isOverpriced,
        marketComparison: marketAvg ? {
          average: marketAvg,
          difference: avgAmount - marketAvg,
          sourceLabel: benchmark?.sourceLabel ?? 'referência simplificada',
          isReference: true,
          recommendation: avgAmount > marketAvg 
            ? `Considere renegociar ou trocar. Economia potencial estimada: R$ ${((avgAmount - marketAvg) * 12).toFixed(2)}/ano`
            : 'Valor dentro da faixa de referência usada pelo app',
        } : undefined,
      });
    });

    return recurring.sort((a, b) => b.averageAmount - a.averageAmount);
  }, [personal.allTransactions]);

  // Calculate summary
  const summary = useMemo((): RecurringSummary => {
    const totalMonthly = recurringExpenses.reduce((sum, e) => sum + e.averageAmount, 0);
    const totalAnnual = totalMonthly * 12;
    const overpricedCount = recurringExpenses.filter(e => e.isOverpriced).length;
    
    const potentialSavings = recurringExpenses
      .filter(e => e.marketComparison && e.isOverpriced)
      .reduce((sum, e) => sum + (e.marketComparison!.difference * 12), 0);

    // Top categories
    const categoryTotals: Record<string, number> = {};
    recurringExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.averageAmount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: totalMonthly > 0 ? (amount / totalMonthly) * 100 : 0,
      }));

    return {
      totalMonthly,
      totalAnnual,
      itemCount: recurringExpenses.length,
      overpricedCount,
      potentialSavings,
      topCategories,
    };
  }, [recurringExpenses]);

  // Generate insights
  const insights = useMemo(() => {
    const result: string[] = [];

    if (recurringExpenses.length === 0) {
      result.push('📝 Nenhuma despesa recorrente detectada. Registre suas transações para análise.');
      return result;
    }

    // Total monthly warning
    if (summary.totalMonthly > 2000) {
      result.push(`💸 Seus gastos recorrentes somam R$ ${summary.totalMonthly.toFixed(2)}/mês (R$ ${summary.totalAnnual.toFixed(2)}/ano).`);
    }

    // Overpriced warning
    if (summary.overpricedCount > 0) {
      result.push(`⚠️ ${summary.overpricedCount} despesa(s) acima da faixa de referência do app. Economia potencial estimada: R$ ${summary.potentialSavings.toFixed(2)}/ano.`);
    }

    // Trend warnings
    const increasing = recurringExpenses.filter(e => e.trend === 'increasing');
    if (increasing.length > 0) {
      const worst = increasing.reduce((a, b) => a.trendPercent > b.trendPercent ? a : b);
      result.push(`📈 "${worst.description}" aumentou ${worst.trendPercent.toFixed(1)}% nos últimos meses.`);
    }

    // Subscription fatigue
    const subscriptions = recurringExpenses.filter(e => 
      ['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO Max', 'YouTube Premium'].some(s => 
        e.description.toLowerCase().includes(s.toLowerCase())
      )
    );
    
    if (subscriptions.length >= 3) {
      const total = subscriptions.reduce((sum, s) => sum + s.averageAmount, 0);
      result.push(`📺 Você tem ${subscriptions.length} serviços de streaming (R$ ${total.toFixed(2)}/mês). Considere manter apenas os que realmente usa.`);
    }

    // Next payments
    const upcoming = recurringExpenses
      .filter(e => {
        const next = new Date(e.nextPayment);
        const today = new Date();
        const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
      })
      .slice(0, 3);

    if (upcoming.length > 0) {
      result.push(`📅 Próximos pagamentos: ${upcoming.map(e => `${e.description} (${e.paymentDay})`).join(', ')}`);
    }

    result.push('ℹ️ Comparações de mercado usam referências heurísticas e devem ser confirmadas com preços e contratos reais.');

    return result;
  }, [recurringExpenses, summary]);

  return {
    recurringExpenses,
    summary,
    insights,
  };
}