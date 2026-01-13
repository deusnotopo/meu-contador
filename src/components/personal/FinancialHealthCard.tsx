import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AIInsights } from "@/lib/ai";
import { getFinancialInsights } from "@/lib/ai";
import { calculateFinancialHealth } from "@/lib/financial-health";
import type { Transaction } from "@/types";
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
  const { score, rule503020, savingsRate, expenseCoverage } = calculateFinancialHealth(transactions, totals);
  
  const displayScore = insights?.score ?? Math.round(score);

  const getScoreColor = () => {
    if (displayScore >= 80) return "text-success"; // Excellent
    if (displayScore >= 60) return "text-info";    // Good (Healthy)
    if (displayScore >= 40) return "text-warning"; // Warning (Paycheck to Paycheck)
    return "text-danger";                   // Critical (Debt Risk)
  };

  const tips =
    insights?.tips ??
    ([
      savingsRate < 5 && "Alerta: Sua taxa de poupança está crítica (<5%). Reduza gastos supérfluos.",
      savingsRate >= 5 && savingsRate < 20 && "Bom começo! Tente atingir 20% de poupança para seguir a regra 50-30-20.",
      totals.expense > totals.income && "Atenção: Você está gastando mais do que ganha (Déficit).",
      expenseCoverage > 1 && expenseCoverage < 1.1 && "Cuidado: Sua margem de segurança é baixa. Qualquer imprevisto pode gerar dívida.",
      savingsRate >= 20 && "Parabéns! Você atingiu o padrão ouro de 20% de investimento.",
    ].filter(Boolean) as string[]);

  return (
    <Card className="glass-card border-none rounded-[2rem] overflow-hidden min-h-[300px] group transition-all duration-500 hover:shadow-premium">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-lg font-black tracking-tight text-white">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Saúde Financeira
          </div>
          {loading && (
            <Loader2 className="animate-spin text-indigo-400" size={16} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className={`text-8xl font-black tracking-tighter glow-text ${getScoreColor()}`}>
            {Math.round(displayScore)}
          </span>
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
            Índice de Performance
          </span>
        </div>

        <div className="space-y-5 px-1">
          <div className="flex items-center gap-2 text-sm font-black text-indigo-200 uppercase tracking-widest">
            <Activity size={18} className="text-indigo-400" />
            Meta 50-30-20
          </div>
          
          <div className="space-y-4">
            {/* Necessity: 50% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider font-black">Necessidades (50%)</span>
                <span className="text-white">{rule503020.necessity.percentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${rule503020.necessity.percentage > 55 ? "bg-danger" : "bg-primary glow-text"}`}
                    style={{ width: `${Math.min(100, rule503020.necessity.percentage)}%` }}
                />
              </div>
            </div>

            {/* Wants: 30% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider font-black">Desejos (30%)</span>
                <span className="text-white">{rule503020.want.percentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${rule503020.want.percentage > 35 ? "bg-warning" : "bg-info"}`}
                    style={{ width: `${Math.min(100, rule503020.want.percentage)}%` }}
                />
              </div>
            </div>

            {/* Investment: 20% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider font-black">Investimento (20%)</span>
                <span className="text-white">{(rule503020.investment.percentage + rule503020.debt.percentage).toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${rule503020.investment.percentage >= 15 ? "bg-success" : "bg-slate-700"}`}
                    style={{ width: `${Math.min(100, rule503020.investment.percentage + rule503020.debt.percentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {(showDetails || tips.length > 0 || transactions.length < 5) && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xl font-black text-white tracking-tight">
              <Sparkles size={22} className="text-amber-400" />
              Insights do Consultor
            </div>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-4 text-base font-bold text-slate-300 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm group hover:bg-white/10 transition-colors"
                >
                  <div className="mt-1.5 min-w-[10px] h-2.5 bg-primary rounded-full shadow-lg shadow-primary/20" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
