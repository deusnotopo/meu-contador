/**
 * BudgetVsActual.tsx — Phase 45
 * ───────────────────────────────
 * Budget vs Actual spending comparison by category.
 * Local calculation from transactions + budgets data.
 * Shows variance (over/under), % utilized, and trend arrows.
 * Zero API calls on mount.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryComparison {
  category: string;
  budget: number;
  actual: number;
  variance: number;  // positive = under budget (good), negative = over (bad)
  pct: number;       // actual/budget * 100
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function barColor(pct: number) {
  if (pct <= 75) return "#10B981";  // green — comfortable
  if (pct <= 95) return "#F59E0B";  // amber — warning
  return "#F43F5E";                  // red — over or near limit
}

function statusLabel(pct: number) {
  if (pct <= 75) return { text: "No controle", color: "text-emerald-400" };
  if (pct <= 95) return { text: "Atenção", color: "text-amber-400" };
  if (pct <= 100) return { text: "No limite", color: "text-orange-400" };
  return { text: "Estourou", color: "text-rose-400" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const BudgetVsActual = () => {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();

  // Current month boundaries
  const { startOfMonth, endOfMonth, monthName } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const name = start.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    return { startOfMonth: start, endOfMonth: end, monthName: name };
  }, []);

  // Actual spending per category this month
  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date);
        return d >= startOfMonth && d <= endOfMonth;
      })
      .forEach(t => {
        const cat = t.category || "Outros";
        map[cat] = (map[cat] || 0) + Math.abs(t.amount);
      });
    return map;
  }, [transactions, startOfMonth, endOfMonth]);

  // Merge with budget definitions
  const comparisons: CategoryComparison[] = useMemo(() => {
    const rows: CategoryComparison[] = [];

    // Budgeted categories
    for (const b of budgets) {
      const category = b.category;
      const budget = b.limit ?? 0;
      if (budget <= 0) continue;
      const actual = actualByCategory[category] || 0;
      const variance = budget - actual;
      const pct = budget > 0 ? (actual / budget) * 100 : 0;
      rows.push({ category, budget, actual, variance, pct });
    }

    // Unbudgeted categories with spending (overflow)
    for (const [cat, actual] of Object.entries(actualByCategory)) {
      if (!rows.find(r => r.category === cat)) {
        rows.push({ category: cat, budget: 0, actual, variance: -actual, pct: 999 });
      }
    }

    return rows.sort((a, b) => b.pct - a.pct); // worst first
  }, [budgets, actualByCategory]);

  const totalBudget = comparisons.reduce((s, c) => s + c.budget, 0);
  const totalActual = comparisons.reduce((s, c) => s + c.actual, 0);
  const totalVariance = totalBudget - totalActual;
  const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  if (comparisons.length === 0) {
    return (
      <EmptyIntelligence
        icon={Target}
        emoji="🎯"
        title="Orçamento vs Real"
        description="Configure orçamentos por categoria para ver o comparativo mensal."
        compact
        color="#6366F1"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#03050F] to-[#020409] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Target size={15} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Orçamento vs Real</div>
            <div className="text-[9px] text-white/30 capitalize">{monthName}</div>
          </div>
        </div>

        {/* Total summary */}
        <div className="text-right">
          <div className={`text-[13px] font-black font-mono ${totalVariance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {totalVariance >= 0 ? "+" : ""}{formatCurrency(totalVariance)}
          </div>
          <div className="text-[8px] text-white/20">{totalPct.toFixed(0)}% do orçamento</div>
        </div>
      </div>

      {/* Global progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-white/20">
          <span>{formatCurrency(totalActual)} gasto</span>
          <span>de {formatCurrency(totalBudget)}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalPct, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: barColor(totalPct) }}
          />
        </div>
      </div>

      {/* Category rows */}
      <div className="space-y-2.5">
        {comparisons.slice(0, 6).map((c, i) => {
          const pctCapped = Math.min(c.pct, 100);
          const status = statusLabel(c.pct);
          const TrendIcon = c.variance > 0 ? TrendingDown : c.variance < 0 ? TrendingUp : Minus;
          return (
            <motion.div
              key={c.category}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TrendIcon
                    size={9}
                    className={c.variance > 0 ? "text-emerald-400 flex-shrink-0" : "text-rose-400 flex-shrink-0"}
                  />
                  <span className="text-[10px] text-white/60 truncate">{c.category}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`text-[8px] font-bold ${status.color}`}>{status.text}</span>
                  <span className="text-[9px] font-mono font-bold text-white/50">
                    {formatCurrency(c.actual)}
                    {c.budget > 0 && <span className="text-white/20">/{formatCurrency(c.budget)}</span>}
                  </span>
                </div>
              </div>

              {c.budget > 0 ? (
                <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctCapped}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: barColor(c.pct) }}
                  />
                </div>
              ) : (
                <div className="text-[8px] text-amber-400/50 pl-3">Sem orçamento definido</div>
              )}
            </motion.div>
          );
        })}
        {comparisons.length > 6 && (
          <div className="text-[9px] text-white/20 text-center pt-1">
            +{comparisons.length - 6} categorias adicionais
          </div>
        )}
      </div>

      {/* Footer insight */}
      {totalVariance > 0 ? (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400/70">
          🎯 Você está <strong>{formatCurrency(totalVariance)}</strong> abaixo do orçamento este mês. Mantenha o ritmo.
        </div>
      ) : (
        <div className="px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-400/70">
          ⚠️ Orçamento estourado em <strong>{formatCurrency(Math.abs(totalVariance))}</strong>. Revise as categorias em vermelho.
        </div>
      )}
    </motion.div>
  );
};
