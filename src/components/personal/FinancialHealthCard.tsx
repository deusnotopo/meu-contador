import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AIInsights } from "@/lib/ai";
import { getFinancialInsights } from "@/lib/ai";
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

  // 1. Savings Rate (Target: 20%+)
  const savingsRate = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0;
  const savingsScore = Math.min(100, Math.max(0, (savingsRate / 20) * 100));

  // 2. Liquidity / Solvency Check (Target: Income > Expenses * 1.1 buffer)
  const expenseCoverage = totals.expense > 0 ? totals.income / totals.expense : 2;
  const liquidityScore = Math.min(100, Math.max(0, (expenseCoverage - 0.8) * 100)); // <0.8 is danger, 1.0 is break-even, >1.8 is perfect

  // 3. Weighted Score Calculation
  // 40% Savings Rate, 60% Liquidity/Control
  const calculatedScore = (savingsScore * 0.4) + (liquidityScore * 0.6);
  
  const score = insights?.score ?? Math.round(calculatedScore);

  const getScoreColor = () => {
    if (score >= 80) return "text-success"; // Excellent
    if (score >= 60) return "text-info";    // Good (Healthy)
    if (score >= 40) return "text-warning"; // Warning (Paycheck to Paycheck)
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
    <Card className="shadow-card border-0 overflow-hidden relative min-h-[300px]">
      <div
        className={`absolute top-0 left-0 w-1 h-full ${
          score >= 80 ? "bg-success" : score >= 50 ? "bg-info" : "bg-danger"
        }`}
      />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Saúde Financeira
          </div>
          {loading && (
            <Loader2 className="animate-spin text-muted-foreground" size={16} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-3xl border border-border/50">
          <span className={`text-7xl font-black ${getScoreColor()}`}>
            {Math.round(score)}
          </span>
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">
            Saúde Geral
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-muted-foreground uppercase tracking-widest">
              Seu Progresso
            </span>
            <span className={getScoreColor()}>{Math.round(score)} / 100</span>
          </div>
          <Progress value={score} className="h-3 rounded-full" />
        </div>

        {(showDetails || tips.length > 0 || transactions.length < 5) && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Sparkles size={20} className="text-primary" />
              Dicas do Contador IA
            </div>
            {transactions.length < 5 && (
               <p className="text-sm text-muted-foreground italic">
                 Adicione pelo menos 5 transações para receber dicas personalizadas da IA.
               </p>
            )}
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-base font-medium text-foreground bg-muted p-4 rounded-2xl border border-border/50 shadow-sm"
                >
                  <div className="mt-1.5 min-w-[8px] h-2 bg-primary rounded-full" />
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
