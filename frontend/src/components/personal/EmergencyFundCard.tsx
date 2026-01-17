import type { Transaction } from "@/types";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

interface Props {
  transactions: Transaction[];
}

export const EmergencyFundCard = ({ transactions }: Props) => {
  const stats = useMemo(() => {
    // 1. Filter expense transactions that are NOT investments or debts
    const relevantExpenses = transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.classification !== "investment" &&
        t.classification !== "debt"
    );

    // 2. Group by month to get average
    const monthlyTotals: Record<string, number> = {};
    relevantExpenses.forEach((t) => {
      const month = t.date.slice(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
    });

    const months = Object.keys(monthlyTotals);
    const totalExpenses = Object.values(monthlyTotals).reduce(
      (a, b) => a + b,
      0
    );
    const avgMonthlyExpense =
      months.length > 0 ? totalExpenses / months.length : 0;

    // 3. Current "Emergency Fund" - Sum of all transactions classified as 'investment' (simplified)
    const currentSavings = transactions
      .filter(
        (t) =>
          t.classification === "investment" || t.category === "Investimentos"
      )
      .reduce(
        (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
        0
      );

    const targetMonths = 6;
    const targetAmount = avgMonthlyExpense * targetMonths;
    const progress =
      targetAmount > 0 ? (currentSavings / targetAmount) * 100 : 0;
    const monthsCovered =
      avgMonthlyExpense > 0 ? currentSavings / avgMonthlyExpense : 0;

    return {
      avgMonthlyExpense,
      currentSavings,
      targetAmount,
      progress: Math.min(100, Math.max(0, progress)),
      monthsCovered: monthsCovered.toFixed(1),
      isSafe: parseFloat(monthsCovered) >= 3,
      isSolid: parseFloat(monthsCovered) >= 6,
    };
  }, [transactions]);

  if (stats.avgMonthlyExpense === 0 && stats.currentSavings === 0) return null;

  return (
    <div className="premium-card group hover:scale-[1.02] transition-all duration-500 overflow-hidden">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Reserva de <span className="text-white">Emergência</span>
          </h3>
        </div>

        <div className="space-y-8">
          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group/inner">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover/inner:opacity-100 transition-opacity" />

            <div className="flex justify-between items-end mb-4">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Autonomia Financeira
                </p>
                <span
                  className={`text-4xl font-black tracking-tighter ${
                    stats.isSolid
                      ? "text-emerald-400"
                      : stats.isSafe
                      ? "text-sky-400"
                      : "text-amber-400"
                  }`}
                >
                  {stats.monthsCovered}{" "}
                  <span className="text-lg opacity-50 ml-1">meses</span>
                </span>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Meta: 6 Meses
                </div>
              </div>
            </div>

            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                  stats.isSolid
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                    : stats.isSafe
                    ? "bg-gradient-to-r from-sky-600 to-sky-400"
                    : "bg-gradient-to-r from-amber-600 to-amber-400"
                }`}
                style={{ width: `${stats.progress}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Progresso
              </span>
              <span className="text-xs font-bold text-white/60">
                <PrivacyValue value={stats.currentSavings} /> /{" "}
                <PrivacyValue value={stats.targetAmount} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 px-2">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                Custo de Vida
              </span>
              <span className="text-2xl font-black text-white tracking-tighter">
                <PrivacyValue value={stats.avgMonthlyExpense} />
                <span className="text-[10px] text-slate-500 ml-1 font-bold">
                  /mês
                </span>
              </span>
            </div>
            <div className="space-y-2 text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                Total Líquido
              </span>
              <span className="text-2xl font-black text-indigo-400 tracking-tighter">
                <PrivacyValue value={stats.currentSavings} />
              </span>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stats.isSolid
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              } shrink-0`}
            >
              {stats.isSolid ? (
                <ShieldCheck size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Status do Fundo
              </p>
              <p className="text-sm font-bold text-slate-300 leading-tight">
                {stats.isSolid
                  ? "Fortaleza construída. Você tem total liberdade estratégica."
                  : stats.isSafe
                  ? "Barreira de proteção sólida. Continue até a autonomia plena."
                  : "Vulnerabilidade detectada. Priorize o colchão de segurança agora."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
