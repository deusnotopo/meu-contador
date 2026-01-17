import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { StatCard, MiniChart } from '../ui/DashboardWidgets';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
}

import { PremiumGate } from '../ui/PremiumGate';
import { MFAGate } from '../security/MFAGate';

export function AnalyticsDashboard({ transactions }: AnalyticsDashboardProps) {
  return (
    <PremiumGate feature="premium_analytics">
      <MFAGate>
        <AnalyticsDashboardContent transactions={transactions} />
      </MFAGate>
    </PremiumGate>
  );
}

function AnalyticsDashboardContent({ transactions }: AnalyticsDashboardProps) {
  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        income: 0,
        expenses: 0,
      };
    });

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthIndex = Math.floor(
        (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      if (monthIndex >= 0 && monthIndex < 6) {
        const dataIndex = 5 - monthIndex;
        if (t.type === 'income') {
          last6Months[dataIndex].income += t.amount;
        } else {
          last6Months[dataIndex].expenses += t.amount;
        }
      }
    });

    return last6Months;
  }, [transactions]);

  // Calculate category breakdown
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  // Calculate trends
  const trends = useMemo(() => {
    const currentMonth = monthlyData[5];
    const previousMonth = monthlyData[4];
    
    const incomeChange = previousMonth.income
      ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
      : 0;
    const expenseChange = previousMonth.expenses
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
      : 0;

    return { incomeChange, expenseChange };
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Receitas"
          value={`R$ ${totals.income.toLocaleString('pt-BR')}`}
          change={trends.incomeChange}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Despesas"
          value={`R$ ${totals.expenses.toLocaleString('pt-BR')}`}
          change={trends.expenseChange}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Saldo"
          value={`R$ ${totals.balance.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          color="indigo"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <MiniChart
          title="Tendência Mensal (Despesas)"
          data={monthlyData.map((m) => m.expenses)}
          color="rose"
        />

        {/* Income Trend */}
        <MiniChart
          title="Tendência Mensal (Receitas)"
          data={monthlyData.map((m) => m.income)}
          color="emerald"
        />
      </div>

      {/* Top Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-400" />
          Top 5 Categorias de Despesas
        </h3>
        <div className="space-y-3">
          {categoryData.map(([category, amount], index) => {
            const percentage = (amount / totals.expenses) * 100;
            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{category}</span>
                  <span className="text-white font-semibold">
                    R$ {amount.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Insights Inteligentes
        </h3>
        <div className="space-y-3">
          {trends.incomeChange > 0 && (
            <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-300 font-semibold">
                  Receitas em Alta
                </p>
                <p className="text-xs text-slate-400">
                  Suas receitas aumentaram {trends.incomeChange.toFixed(1)}% este mês!
                </p>
              </div>
            </div>
          )}
          {trends.expenseChange > 10 && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-amber-300 font-semibold">
                  Atenção: Despesas Aumentando
                </p>
                <p className="text-xs text-slate-400">
                  Suas despesas aumentaram {trends.expenseChange.toFixed(1)}% este mês.
                </p>
              </div>
            </div>
          )}
          {totals.balance > 0 && (
            <div className="flex items-start gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div>
                <p className="text-sm text-indigo-300 font-semibold">
                  Saldo Positivo
                </p>
                <p className="text-xs text-slate-400">
                  Você economizou R$ {totals.balance.toLocaleString('pt-BR')} este período!
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
