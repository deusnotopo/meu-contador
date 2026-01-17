import type { AIInsights } from "@/lib/ai";
import { getFinancialInsights } from "@/lib/ai";
import { calculateFinancialHealth } from "@/lib/financial-health";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { Activity, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  transactions: Transaction[];
  totals: { income: number; expense: number; balance: number };
  showDetails?: boolean;
}

export const FinancialHealthCard = ({
  transactions,
  totals,
  showDetails,
}: Props) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (transactions.length < 5) return;

      setLoading(true);
      try {
        const data = await getFinancialInsights(transactions);
        setInsights(data);
      } catch (err) {
        console.error("AI fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [transactions]);

  // --- Professional Financial Algorithms ---
  const { score, rule503020, savingsRate, expenseCoverage } =
    calculateFinancialHealth(transactions, totals);

  const displayScore = insights?.score ?? Math.round(score);

  const getScoreColor = () => {
    if (displayScore >= 80) return "text-success"; // Excellent
    if (displayScore >= 60) return "text-info"; // Good (Healthy)
    if (displayScore >= 40) return "text-warning"; // Warning (Paycheck to Paycheck)
    return "text-danger"; // Critical (Debt Risk)
  };

  const tips =
    insights?.tips ??
    ([
      savingsRate < 5 &&
        "Alerta: Sua taxa de poupança está crítica (<5%). Reduza gastos supérfluos.",
      savingsRate >= 5 &&
        savingsRate < 20 &&
        "Bom começo! Tente atingir 20% de poupança para seguir a regra 50-30-20.",
      totals.expense > totals.income &&
        "Atenção: Você está gastando mais do que ganha (Déficit).",
      expenseCoverage > 1 &&
        expenseCoverage < 1.1 &&
        "Cuidado: Sua margem de segurança é baixa. Qualquer imprevisto pode gerar dívida.",
      savingsRate >= 20 &&
        "Parabéns! Você atingiu o padrão ouro de 20% de investimento.",
    ].filter(Boolean) as string[]);

  return (
    <div className="premium-card group transition-all duration-500 min-h-[400px]">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Activity size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Health <span className="text-white">Score</span>
            </h3>
          </div>
          {loading && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <Loader2 className="animate-spin text-indigo-400" size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                AI Analysing
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden group/score">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover/score:opacity-100 transition-opacity" />
          <div className="relative">
            <span
              className={`text-[120px] leading-none font-black tracking-tighter ${getScoreColor()} opacity-90`}
            >
              {Math.round(displayScore)}
            </span>
            <div
              className={`absolute -top-2 -right-6 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest ${getScoreColor()}`}
            >
              {displayScore >= 80
                ? "Master"
                : displayScore >= 60
                ? "Healthy"
                : displayScore >= 40
                ? "Fair"
                : "Risk"}
            </div>
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Global Performance Index
          </span>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Distribuição Recomendada
            </p>
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Rule 50-30-20
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Necessity: 50% */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Essencial (50)
                </span>
                <span className="text-xs font-bold text-white">
                  {rule503020.necessity.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-1000",
                    rule503020.necessity.percentage > 55 ? "bg-rose-500" : "bg-indigo-500"
                  )}
                  style={{
                    width: `${Math.min(100, rule503020.necessity.percentage)}%`,
                  }}
                />
              </div>
            </div>

            {/* Wants: 30% */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Estilo de Vida (30)
                </span>
                <span className="text-xs font-bold text-white">
                  {rule503020.want.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-1000",
                    rule503020.want.percentage > 35 ? "bg-amber-500" : "bg-sky-500"
                  )}
                  style={{
                    width: `${Math.min(100, rule503020.want.percentage)}%`,
                  }}
                />
              </div>
            </div>

            {/* Investment: 20% */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Liberdade (20)
                </span>
                <span className="text-xs font-bold text-white">
                  {(
                    rule503020.investment.percentage +
                    rule503020.debt.percentage
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-1000",
                    rule503020.investment.percentage >= 15 ? "bg-emerald-500" : "bg-slate-700"
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      rule503020.investment.percentage +
                        rule503020.debt.percentage
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {(showDetails || tips.length > 0 || transactions.length < 5) && (
          <div className="pt-8 border-t border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                <Sparkles size={16} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                Insights Estratégicos
              </h4>
            </div>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="group/tip flex gap-4 text-sm font-bold text-slate-300 bg-white/5 p-6 rounded-3xl border border-white/10 transition-all hover:bg-white/10 hover:border-white/20"
                >
                  <div className="mt-1.5 min-w-[8px] h-2 bg-indigo-500 rounded-full group-hover/tip:scale-125 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
