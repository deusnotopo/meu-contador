import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import type { Transaction } from "@/types";
import { ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

interface Props {
  transactions: Transaction[];
}

export const EmergencyFundCard = ({ transactions }: Props) => {
  const stats = useMemo(() => {
    // 1. Filter expense transactions that are NOT investments or debts
    const relevantExpenses = transactions.filter(
      (t) => t.type === "expense" && t.classification !== "investment" && t.classification !== "debt"
    );

    // 2. Group by month to get average
    const monthlyTotals: Record<string, number> = {};
    relevantExpenses.forEach((t) => {
      const month = t.date.slice(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
    });

    const months = Object.keys(monthlyTotals);
    const totalExpenses = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
    const avgMonthlyExpense = months.length > 0 ? totalExpenses / months.length : 0;

    // 3. Current "Emergency Fund" - Sum of all transactions classified as 'investment' (simplified)
    const currentSavings = transactions
      .filter((t) => t.classification === "investment" || t.category === "Investimentos")
      .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
    
    const targetMonths = 6;
    const targetAmount = avgMonthlyExpense * targetMonths;
    const progress = targetAmount > 0 ? (currentSavings / targetAmount) * 100 : 0;
    const monthsCovered = avgMonthlyExpense > 0 ? currentSavings / avgMonthlyExpense : 0;

    return {
      avgMonthlyExpense,
      currentSavings,
      targetAmount,
      progress: Math.min(100, Math.max(0, progress)),
      monthsCovered: monthsCovered.toFixed(1),
      isSafe: parseFloat(monthsCovered) >= 3,
      isSolid: parseFloat(monthsCovered) >= 6
    };
  }, [transactions]);

  if (stats.avgMonthlyExpense === 0 && stats.currentSavings === 0) return null;

  return (
    <Card className="glass-card border-none rounded-[2rem] overflow-hidden group transition-all duration-500 hover:shadow-premium">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
          <ShieldCheck className="text-primary glow-text" size={22} />
          Reserva de Emergência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-end mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Escudo de Proteção</span>
            <span className={`text-3xl font-black glow-text ${stats.isSolid ? 'text-success' : stats.isSafe ? 'text-info' : 'text-warning'}`}>
              {stats.monthsCovered} meses
            </span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ${stats.isSolid ? 'bg-success' : stats.isSafe ? 'bg-info' : 'bg-warning'}`}
                style={{ width: `${stats.progress}%` }}
            />
          </div>
          <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-tighter text-right">
            ALVO: 6 MESES • <span className="text-white">{formatCurrency(stats.targetAmount)}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 px-1">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Custo de Vida</span>
            <span className="text-xl font-black text-white">{formatCurrency(stats.avgMonthlyExpense)}</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Total Acumulado</span>
            <span className="text-xl font-black text-primary glow-text">{formatCurrency(stats.currentSavings)}</span>
          </div>
        </div>

        <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
          <div className={`p-2.5 rounded-xl ${stats.isSolid ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'} shrink-0`}>
            {stats.isSolid ? (
              <TrendingUp size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>
          <p className="text-sm font-bold text-slate-300 leading-relaxed">
            {stats.isSolid 
              ? "Sua fortaleza financeira está construída. Você tem liberdade para investir pesado."
              : stats.isSafe 
                ? "Ótimo progresso. Sua barreira de proteção está quase completa."
                : "Alerta: Seu colchão financeiro está vulnerável. Priorize este fundo agora."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
