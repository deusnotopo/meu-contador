import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import {
  getCategoryPredictions,
  predictEndOfMonthBalance,
} from "@/lib/prediction-engine";
import type { Transaction } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface SmartCoachProps {
  transactions: Transaction[];
  currentBalance: number;
}

export const SmartCoach = ({
  transactions,
  currentBalance,
}: SmartCoachProps) => {
  const [minimized, setMinimized] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // 1. Calculate Forecasts
  const { predictedBalance, confidence } = useMemo(
    () => predictEndOfMonthBalance(transactions, currentBalance),
    [transactions, currentBalance]
  );

  const categoryPredictions = useMemo(
    () => getCategoryPredictions(transactions),
    [transactions]
  );

  // 2. Filter significant insights
  const insights = useMemo(() => {
    const list = [];

    // Balance Forecast Insight
    const balanceDiff = predictedBalance - currentBalance;
    if (balanceDiff < -100) {
      list.push({
        id: "forecast-drop",
        type: "warning",
        title: "Tendência de Queda",
        message: `Se o ritmo continuar, você fechará o mês com ${formatCurrency(
          predictedBalance
        )}.`,
        icon: TrendingDown,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
      });
    } else if (balanceDiff > 100) {
      list.push({
        id: "forecast-growth",
        type: "success",
        title: "Tendência Positiva",
        message: `Projeção de fechar o mês com ${formatCurrency(
          predictedBalance
        )}! (${formatCurrency(balanceDiff)} acima do atual).`,
        icon: TrendingUp,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      });
    }

    // Category Anomalies (Only show significant ones > 20% change)
    categoryPredictions.slice(0, 3).forEach((pred) => {
      if (pred.trend === "up" && pred.predictedAmount > 500) {
        list.push({
          id: `spike-${pred.category}`,
          type: "warning",
          title: `Atenção: ${pred.category}`,
          message: `Projeção de ${formatCurrency(
            pred.predictedAmount
          )} (Aumento de ${pred.percentChange.toFixed(0)}%).`,
          icon: AlertTriangle,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: "all-good",
        type: "success",
        title: "No Caminho Certo",
        message: "Seus gastos estão estáveis e dentro do esperado.",
        icon: CheckCircle2,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
      });
    }

    return list;
  }, [predictedBalance, currentBalance, categoryPredictions]);

  // Rotate tips if minimized
  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % insights.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [insights.length]);

  const activeInsight = insights[currentTipIndex] || insights[0];

  return (
    <div className="relative">
      {/* Minimized View (Floating Pill) */}
      {minimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-24 right-6 z-40"
        >
          <div
            className="bg-[#0f172a] border border-white/10 rounded-full shadow-2xl p-1 pr-6 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform group"
            onClick={() => setMinimized(false)}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                Smart Coach
              </span>
              <span className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                {activeInsight.title}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded View (Card) */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="premium-card p-0 overflow-hidden mb-8"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Brain size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Smart Coach
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    IA Preditiva & Análise
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {confidence > 60 && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[10px]"
                  >
                    Alta Confiança
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-white"
                  onClick={() => setMinimized(true)}
                >
                  <TrendingDown size={16} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Main Prediction */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Projeção Final do Mês
                  </p>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {formatCurrency(predictedBalance)}
                  </div>
                </div>
                <div
                  className={`text-right ${
                    predictedBalance >= currentBalance
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-end gap-1 text-xs font-bold mb-1">
                    {predictedBalance >= currentBalance ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    <span>
                      {(
                        ((predictedBalance - currentBalance) /
                          Math.abs(currentBalance || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    vs Atual
                  </p>
                </div>
              </div>

              {/* Carousel of Insights */}
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeInsight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 rounded-2xl border border-white/5 ${activeInsight.bg} relative overflow-hidden`}
                  >
                    <div className="flex items-start gap-4 z-10 relative">
                      <div
                        className={`p-2 rounded-xl bg-white/10 ${activeInsight.color}`}
                      >
                        <activeInsight.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`text-xs font-black uppercase tracking-widest mb-1 ${activeInsight.color}`}
                        >
                          {activeInsight.title}
                        </h4>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed">
                          {activeInsight.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Indicators */}
                {insights.length > 1 && (
                  <div className="flex justify-center gap-1.5 pt-2">
                    {insights.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentTipIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentTipIndex
                            ? "bg-indigo-400 w-4"
                            : "bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-2 border-t border-white/5 bg-white/[0.02]">
              <Button
                variant="ghost"
                className="w-full text-xs font-bold text-slate-400 hover:text-white h-10 gap-2"
              >
                <Sparkles size={14} className="text-indigo-400" />
                Ver Análise Completa
                <ArrowRight size={14} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
