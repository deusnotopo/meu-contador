import type { AIInsights } from "@/lib/ai";
import { getFinancialInsights } from "@/lib/ai";
import { formatCurrency } from "@/lib/formatters";
import type { Transaction } from "@/types";
import { Brain, Loader2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  transactions: Transaction[];
  showDetails?: boolean;
}

export const PredictionsCard = ({ transactions, showDetails }: Props) => {
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

  const getLastMonthByCategory = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= lastMonth && d < thisMonth && t.type === "expense";
    });

    const byCategory: Record<string, number> = {};
    lastMonthTxs.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    return byCategory;
  };

  const getPreviousMonthByCategory = () => {
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const prevMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= prevMonthStart && d < lastMonthStart && t.type === "expense";
    });

    const byCategory: Record<string, number> = {};
    prevMonthTxs.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    return byCategory;
  };

  const lastMonth = getLastMonthByCategory();
  const prevMonth = getPreviousMonthByCategory();

  const predictions =
    insights?.predictions ??
    Object.entries(lastMonth)
      .slice(0, showDetails ? 6 : 4)
      .map(([category, amount]) => {
        const prevAmount = prevMonth[category] || 0;
        let trend: "up" | "down" | "stable" = "stable";
        if (prevAmount > 0) {
          if (amount > prevAmount * 1.05) trend = "up";
          else if (amount < prevAmount * 0.95) trend = "down";
        }

        return {
          category,
          predictedAmount:
            amount * (trend === "up" ? 1.08 : trend === "down" ? 0.95 : 1.02),
          trend,
          reason: "",
        };
      });

  return (
    <div className="premium-card group transition-all duration-500 min-h-[400px]">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Brain size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Previsão <span className="text-white">Inteligente</span>
            </h3>
          </div>
          {loading && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <Loader2 className="animate-spin text-purple-400" size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Processing IA
              </span>
            </div>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <TrendingUp size={24} className="text-slate-600" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">
              Motor Desligado
            </h4>
            <p className="text-slate-500 text-xs font-bold max-w-[240px] leading-relaxed">
              Precisamos de mais dados para calibrar os algoritmos de previsão e
              projetar seu futuro financeiro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((p) => (
              <div
                key={p.category}
                className="group/item p-6 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover/item:scale-110 ${
                        p.trend === "up"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/10"
                          : p.trend === "down"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"
                          : "bg-sky-500/10 text-sky-500 border border-sky-500/10"
                      }`}
                    >
                      {p.trend === "up" ? (
                        <TrendingUp size={20} strokeWidth={3} />
                      ) : p.trend === "down" ? (
                        <TrendingDown size={20} strokeWidth={3} />
                      ) : (
                        <Minus size={20} strokeWidth={3} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-white tracking-tight truncate uppercase">
                        {p.category}
                      </h4>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">
                        Estimativa Próximo Mês
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-white tracking-tighter">
                      {formatCurrency(p.predictedAmount)}
                    </div>
                    <div
                      className={`text-[8px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block ${
                        p.trend === "up"
                          ? "bg-rose-500/10 text-rose-500"
                          : p.trend === "down"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-sky-500/10 text-sky-500"
                      }`}
                    >
                      {p.trend === "up"
                        ? "Alta Prevista"
                        : p.trend === "down"
                        ? "Otimização"
                        : "Consistente"}
                    </div>
                  </div>
                </div>
                {p.reason && (
                  <div className="mt-4 pt-4 border-t border-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                      <span className="text-indigo-400 mr-2">CONTEXTO:</span>
                      {p.reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
