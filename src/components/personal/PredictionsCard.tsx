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
    <Card className="shadow-card border-0 overflow-hidden min-h-[300px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Brain className="text-primary" size={20} />
            Previsão Inteligente
          </div>
          {loading && (
            <Loader2 className="animate-spin text-muted-foreground" size={16} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-2xl border border-dashed">
            <TrendingUp size={32} className="text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm max-w-[200px]">
              Insira transações para ativar as previsões de IA
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((p) => (
              <div
                key={p.category}
                className="group p-4 rounded-2xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        p.trend === "up"
                          ? "bg-danger/10 text-danger"
                          : p.trend === "down"
                          ? "bg-success/10 text-success"
                          : "bg-info/10 text-info"
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
                      <span className="text-lg font-bold">{p.category}</span>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">
                        Gasto Previsto
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-foreground">
                      {formatCurrency(p.predictedAmount)}
                    </span>
                    <p
                      className={`text-xs font-black uppercase tracking-widest ${
                        p.trend === "up"
                          ? "text-danger"
                          : p.trend === "down"
                          ? "text-success"
                          : "text-info"
                      }`}
                    >
                      {p.trend === "up"
                        ? "Deve Subir"
                        : p.trend === "down"
                        ? "Deve Baixar"
                        : "Fica Igual"}
                    </p>
                  </div>
                </div>
                {p.reason && (
                  <p className="mt-3 text-sm text-muted-foreground italic leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
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
