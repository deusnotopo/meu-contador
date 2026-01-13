import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="glass-card border-none rounded-[2rem] overflow-hidden min-h-[300px] group transition-all duration-500 hover:shadow-premium">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-lg font-black tracking-tight text-white">
          <div className="flex items-center gap-2">
            <Brain className="text-primary glow-text" size={22} />
            Previsão Inteligente
          </div>
          {loading && (
            <Loader2 className="animate-spin text-indigo-400" size={16} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
            <TrendingUp size={40} className="text-slate-600 mb-3" />
            <p className="text-slate-500 text-sm font-bold max-w-[200px]">
              Insira transações para ativar o motor de previsão IA.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((p) => (
              <div
                key={p.category}
                className="group p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all border border-white/5 shadow-premium"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div
                      className={`p-4 rounded-2xl shadow-lg ${
                        p.trend === "up"
                          ? "bg-danger/20 text-danger"
                          : p.trend === "down"
                          ? "bg-success/20 text-success"
                          : "bg-info/20 text-info"
                      }`}
                    >
                      {p.trend === "up" ? (
                        <TrendingUp size={20} />
                      ) : p.trend === "down" ? (
                        <TrendingDown size={20} />
                      ) : (
                        <Minus size={20} />
                      )}
                    </div>
                    <div>
                      <span className="text-xl font-black text-white tracking-tight">{p.category}</span>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-0.5">
                        Estimativa
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white glow-text">
                      {formatCurrency(p.predictedAmount)}
                    </span>
                    <p
                      className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${
                        p.trend === "up"
                          ? "text-danger"
                          : p.trend === "down"
                          ? "text-success"
                          : "text-indigo-400"
                      }`}
                    >
                      {p.trend === "up"
                        ? "Alta Prevista"
                        : p.trend === "down"
                        ? "Baixa Prevista"
                        : "Estável"}
                    </p>
                  </div>
                </div>
                {p.reason && (
                  <p className="mt-4 text-sm text-slate-400 font-bold leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
