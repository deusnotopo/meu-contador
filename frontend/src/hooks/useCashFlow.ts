import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useBudgets } from './useBudgets';
import { useGoals } from './useGoals';
import { loadReminders } from '@/lib/storage';

export interface CashFlowDay {
  date: string;
  dateFormatted: string;
  weekday: string;
  inflows: { description: string; amount: number; category: string }[];
  outflows: { description: string; amount: number; category: string }[];
  netFlow: number;
  projectedBalance: number;
  isCritical: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface CashFlowSummary {
  currentBalance: number;
  projectedBalance30Days: number;
  totalInflows30Days: number;
  totalOutflows30Days: number;
  safeToSpend: number;
  committedNext7Days: number;
  nextIncomeDate: string | null;
  criticalDays: number;
  positiveDays: number;
  negativeDays: number;
  averageDailyFlow: number;
  burnRate: number; // Days until balance reaches zero
}

export interface UpcomingCommitment {
  id: string;
  title: string;
  amount: number;
  date: string;
  source: 'reminder' | 'provisao' | 'recurring' | 'goal';
  category: string;
}

export interface RecurringItem {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dueDay: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
}

export function useCashFlow() {
  const personal = useTransactions('personal');
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  const reminders = useMemo(() => loadReminders(), [personal.transactions.length]);

  const provisoes = useMemo(() => {
    try {
      const raw = localStorage.getItem('meu_contador_provisoes');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [personal.transactions.length]);

  // Detect recurring transactions
  const recurringItems = useMemo((): RecurringItem[] => {
    const items: RecurringItem[] = [];
    const descriptionMap: Record<string, { 
      amounts: number[]; 
      type: 'income' | 'expense';
      category: string;
      dates: number[];
    }> = {};

    personal.allTransactions.forEach(tx => {
      const key = tx.description.toLowerCase().trim();
      if (!descriptionMap[key]) {
        descriptionMap[key] = { 
          amounts: [], 
          type: tx.type,
          category: tx.category,
          dates: []
        };
      }
      descriptionMap[key]!.amounts.push(tx.amount);
      const day = new Date(tx.date).getDate();
      descriptionMap[key]!.dates.push(day);
    });

    Object.entries(descriptionMap).forEach(([desc, data]) => {
      if (data.amounts.length >= 2) {
        const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
        const mostCommonDay = Math.round(
          data.dates.reduce((a, b) => a + b, 0) / data.dates.length
        );

        items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          amount: avgAmount,
          type: data.type,
          category: data.category,
          dueDay: mostCommonDay,
          frequency: 'monthly',
        });
      }
    });

    return items.sort((a, b) => a.dueDay - b.dueDay);
  }, [personal.allTransactions]);

  // Generate 30-day cash flow projection
  const cashFlowDays = useMemo((): CashFlowDay[] => {
    const days: CashFlowDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let runningBalance = personal.totals.balance;

    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayOfMonth = date.getDate();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday = i === 0;

      const inflows: CashFlowDay['inflows'] = [];
      const outflows: CashFlowDay['outflows'] = [];

      // Add recurring items
      recurringItems.forEach(item => {
        if (item.dueDay === dayOfMonth) {
          if (item.type === 'income') {
            inflows.push({
              description: item.description,
              amount: item.amount,
              category: item.category,
            });
          } else {
            outflows.push({
              description: item.description,
              amount: item.amount,
              category: item.category,
            });
          }
        }
      });

      // Add budget items (estimated spending)
      if (!isWeekend) {
        budgets.forEach(budget => {
          if (budget.spent < budget.limit) {
            const remaining = budget.limit - budget.spent;
            const daysInMonth = 30;
            const dailyBudget = remaining / daysInMonth;
            if (dailyBudget > 0) {
              outflows.push({
                description: `Orçamento ${budget.category}`,
                amount: dailyBudget,
                category: budget.category,
              });
            }
          }
        });
      }

      // Add goal contributions
      goals.forEach(goal => {
        if (goal.currentAmount < goal.targetAmount && dayOfMonth === 1) {
          const remaining = goal.targetAmount - goal.currentAmount;
          const monthlyContribution = Math.min(remaining, 500); // Assume R$500/month
          outflows.push({
            description: `Meta: ${goal.name}`,
            amount: monthlyContribution,
            category: 'Metas',
          });
        }
      });

      const totalInflow = inflows.reduce((sum, i) => sum + i.amount, 0);
      const totalOutflow = outflows.reduce((sum, o) => sum + o.amount, 0);
      const netFlow = totalInflow - totalOutflow;

      runningBalance += netFlow;

      const isCritical = runningBalance < 0 || (runningBalance < personal.totals.expense * 0.1);

      days.push({
        date: date.toISOString().split('T')[0]!,
        dateFormatted: `${dayOfMonth} ${monthNames[date.getMonth()]}`,
        weekday: weekdayNames[date.getDay()]!,
        inflows,
        outflows,
        netFlow,
        projectedBalance: runningBalance,
        isCritical,
        isToday,
        isWeekend,
      });
    }

    return days;
  }, [personal.totals, recurringItems, budgets, goals]);

  // Calculate summary
  const summary = useMemo((): CashFlowSummary => {
    const currentBalance = personal.totals.balance;
    const lastDay = cashFlowDays[cashFlowDays.length - 1];
    const projectedBalance30Days = lastDay?.projectedBalance ?? currentBalance;

    const totalInflows30Days = cashFlowDays.reduce(
      (sum, day) => sum + day.inflows.reduce((s, i) => s + i.amount, 0),
      0
    );

    const totalOutflows30Days = cashFlowDays.reduce(
      (sum, day) => sum + day.outflows.reduce((s, o) => s + o.amount, 0),
      0
    );

    const criticalDays = cashFlowDays.filter(d => d.isCritical).length;
    const positiveDays = cashFlowDays.filter(d => d.netFlow > 0).length;
    const negativeDays = cashFlowDays.filter(d => d.netFlow < 0).length;

    const averageDailyFlow = (totalInflows30Days - totalOutflows30Days) / 30;

    const nextIncomeDay = cashFlowDays.find(day => day.inflows.length > 0);
    const nextIncomeDate = nextIncomeDay?.date ?? null;

    const committedNext7Days = cashFlowDays
      .slice(0, 7)
      .reduce((sum, day) => sum + day.outflows.reduce((s, o) => s + o.amount, 0), 0);

    const safeToSpend = Math.max(0, currentBalance - committedNext7Days);

    // Calculate burn rate (days until balance reaches zero)
    let burnRate = Infinity;
    if (averageDailyFlow < 0) {
      burnRate = Math.floor(currentBalance / Math.abs(averageDailyFlow));
    }

    return {
      currentBalance,
      projectedBalance30Days,
      totalInflows30Days,
      totalOutflows30Days,
      safeToSpend,
      committedNext7Days,
      nextIncomeDate,
      criticalDays,
      positiveDays,
      negativeDays,
      averageDailyFlow,
      burnRate,
    };
  }, [cashFlowDays, personal.totals.balance]);

  const upcomingCommitments = useMemo((): UpcomingCommitment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30 = new Date(today);
    next30.setDate(next30.getDate() + 30);

    const reminderCommitments: UpcomingCommitment[] = reminders
      .filter(r => !r.isPaid)
      .map(r => ({
        id: `reminder-${r.id}`,
        title: r.name,
        amount: r.amount,
        date: r.dueDate,
        source: 'reminder' as const,
        category: r.category,
      }))
      .filter(item => {
        const d = new Date(item.date);
        return d >= today && d <= next30;
      });

    const provisaoCommitments: UpcomingCommitment[] = provisoes
      .map((p: any, index: number) => {
        const currentYear = today.getFullYear();
        let dueDate = new Date(currentYear, Number(p.mes || 1) - 1, 1);
        if (dueDate < today) dueDate = new Date(currentYear + 1, Number(p.mes || 1) - 1, 1);
        const missing = Math.max(0, Number(p.valorAnual || 0) - Number(p.acumulado || 0));
        return {
          id: `provisao-${p.id || index}`,
          title: p.nome || 'Provisão',
          amount: missing,
          date: dueDate.toISOString().split('T')[0]!,
          source: 'provisao' as const,
          category: 'Provisões',
        };
      })
      .filter(item => item.amount > 0)
      .filter(item => {
        const d = new Date(item.date);
        return d >= today && d <= next30;
      });

    const goalCommitments: UpcomingCommitment[] = goals
      .filter(goal => goal.currentAmount < goal.targetAmount)
      .map(goal => ({
        id: `goal-${goal.id}`,
        title: `Meta: ${goal.name}`,
        amount: Math.min(goal.targetAmount - goal.currentAmount, 500),
        date: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]!,
        source: 'goal' as const,
        category: 'Metas',
      }));

    return [...reminderCommitments, ...provisaoCommitments, ...goalCommitments]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [goals, provisoes, reminders]);

  // Get upcoming bills (next 7 days)
  const upcomingBills = useMemo(() => {
    return cashFlowDays
      .slice(0, 7)
      .filter(day => day.outflows.length > 0)
      .flatMap(day => 
        day.outflows.map(o => ({
          ...o,
          date: day.dateFormatted,
          weekday: day.weekday,
          isToday: day.isToday,
        }))
      )
      .sort((a, b) => a.isToday ? -1 : b.isToday ? 1 : 0);
  }, [cashFlowDays]);

  // Get insights
  const insights = useMemo(() => {
    const result: string[] = [];

    if (summary.criticalDays > 0) {
      result.push(`⚠️ Você tem ${summary.criticalDays} dias críticos nos próximos 30 dias. Planeje-se!`);
    }

    if (summary.safeToSpend < summary.currentBalance * 0.35) {
      result.push(`🛡️ Seu saldo realmente seguro para gastar hoje é ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.safeToSpend)}.`);
    }

    if (summary.burnRate < 90 && summary.burnRate !== Infinity) {
      result.push(`🔥 Com o ritmo atual, seu saldo dura apenas ${summary.burnRate} dias.`);
    }

    if (summary.averageDailyFlow < 0) {
      result.push(`📉 Seu fluxo diário médio é negativo: R$ ${Math.abs(summary.averageDailyFlow).toFixed(2)}/dia.`);
    }

    if (summary.positiveDays > summary.negativeDays) {
      result.push(`✅ ${summary.positiveDays} dias positivos vs ${summary.negativeDays} negativos. Continue assim!`);
    }

    const hasSalary = recurringItems.some(i => 
      i.description.toLowerCase().includes('salário') || 
      i.description.toLowerCase().includes('salario')
    );

    if (!hasSalary) {
      result.push(`💡 Não detectamos salário recorrente. Registre sua renda fixa para melhor projeção.`);
    }

    return result;
  }, [summary, recurringItems]);

  return {
    cashFlowDays,
    summary,
    recurringItems,
    upcomingBills,
    upcomingCommitments,
    insights,
  };
}