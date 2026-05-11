/**
 * BudgetIntelligence.tsx — Akita Mode Refactor
 * ──────────────────────────────────────────────
 * Predictive budget layer: burn rate, pace alerts, and projections.
 * 
 * Logic is isolated in BudgetService for professional-grade precision.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, AlertTriangle, CheckCircle2,
  ChevronRight, Flame, Calendar, Info
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { BudgetService, BudgetMetrics } from "@/services/BudgetService";
import { FinancialFormatter } from "@/services/FinancialFormatter";
import type { TabType } from "@/types/navigation";

// ── Burn Rate Gauge ─────────────────────────────────────────────────────────

const BurnGauge = ({
  spent, limit, accent
}: { label: string; spent: number; limit: number; accent: string }) => {
  const { dayOfMonth: DOM, daysInMonth: DAYS } = BudgetService.getCalendarContext();
  const pct = limit > 0 ? Math.min(120, (spent / limit) * 100) : 0;
  const w = DAYS > 0 ? (DOM / DAYS) * 100 : 0;

  return (
    <div className="mb-2 last:mb-0">
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-px bg-white/20 z-10"
          style={{ left: `${w}%` }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
    </div>
  );
};

// ── Signal Card ──────────────────────────────────────────────────────────────

const SignalCard = ({ 
  label: category,
  metrics,
  onNavigate 
}: { label: string; metrics: BudgetMetrics; onNavigate?: (t: TabType) => void }) => {
  const { dayOfMonth: DOM } = BudgetService.getCalendarContext();
  const [expanded, setExpanded] = useState(false);

  const { accent, bg, border, Icon, statusLabel } = ((): {
    accent: string; bg: string; border: string;
    Icon: React.ElementType; statusLabel: string;
  } => {
    switch (metrics.status) {
      case "critical": return { accent: "#F43F5E", bg: "bg-rose-500/8",    border: "border-rose-500/20",    Icon: Flame,         statusLabel: "Crítico" };
      case "warning":  return { accent: "#F59E0B", bg: "bg-amber-500/8",   border: "border-amber-500/20",   Icon: AlertTriangle, statusLabel: "Alerta" };
      case "over":     return { accent: "#EF4444", bg: "bg-red-500/10",    border: "border-red-500/25",     Icon: TrendingUp,    statusLabel: "Estourado" };
      default:         return { accent: "#10B981", bg: "bg-emerald-500/5", border: "border-emerald-500/15", Icon: CheckCircle2,  statusLabel: "Saudável" };
    }
  })();

  return (
    <div className={`rounded-2xl border ${bg} ${border} overflow-hidden transition-all duration-300`}>
      <button
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}25` }}>
          <Icon size={13} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] font-black text-white/90 capitalize truncate">{category}</span>
            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ color: accent, backgroundColor: `${accent}18` }}>{statusLabel}</span>
          </div>
          <BurnGauge label="" spent={metrics.spent} limit={metrics.limit} accent={accent} />
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[14px] font-black font-mono" style={{ color: accent }}>
            {Math.round(metrics.percentage)}%
          </div>
          <ChevronRight size={11} className={`text-white/20 transition-transform ${expanded ? "rotate-90" : ""} ml-auto`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 grid grid-cols-2 gap-2">
              <div className="rounded-xl p-2.5 bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Saldo/dia</div>
                <div className="text-[13px] font-black font-mono text-white">
                  {metrics.dailyAllowance > 0 ? FinancialFormatter.formatCurrency(metrics.dailyAllowance) : "---"}
                </div>
              </div>
              <div className="rounded-xl p-2.5 bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Projeção Fim/Mês</div>
                <div className="text-[13px] font-black font-mono"
                  style={{ color: metrics.projectedSpend > metrics.limit ? "#F43F5E" : "#10B981" }}>
                  {FinancialFormatter.formatCurrency(metrics.projectedSpend)}
                </div>
              </div>
              {metrics.status !== "safe" && (
                <div className="col-span-2 rounded-xl p-2.5 bg-indigo-500/5 border border-indigo-500/10">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-400/60 mb-1">Análise de Ritmo (Pace)</div>
                  <div className="text-[11px] text-white/70 leading-relaxed font-medium">
                    {metrics.status === "over" 
                      ? "Limite ultrapassado. Realoque fundos de outras categorias para manter o balanço zero (ZBB)."
                      : `Consumo ${Math.round((metrics.paceIndex - 1) * 100)}% mais rápido que o esperado para o dia ${DOM}.`
                    }
                  </div>
                </div>
              )}
              <button
                onClick={() => onNavigate?.("personal")}
                className="col-span-2 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold mt-1"
                style={{ color: accent, backgroundColor: `${accent}10`, border: `1px solid ${accent}20` }}
              >
                Auditar Transações <ChevronRight size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const BudgetIntelligence = ({ onNavigate }: { onNavigate?: (tab: TabType) => void }) => {
  const { transactions: _transactions } = useTransactions("personal");
  const { budgets } = useBudgets();
  const { dayOfMonth: DOM, daysInMonth: DAYS, daysRemaining: LEFT } = BudgetService.getCalendarContext();

  // ── Compute intelligence signals using BudgetService ──────────────────────
  const analyzedBudgets = useMemo(() => {
    if (!budgets.length) return [];

    return budgets
      .filter(b => b.limit > 0)
      .map(b => ({
        category: b.category,
        metrics: BudgetService.getMetrics(b.spent ?? 0, b.limit, DOM, DAYS)
      }))
      .sort((a, b) => {
        const order = { over: 0, critical: 1, warning: 2, safe: 3 };
        return order[a.metrics.status] - order[b.metrics.status];
      });
  }, [budgets, DOM, DAYS]);

  const stats = useMemo(() => {
    const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
    const overallPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    const criticalCount = analyzedBudgets.filter(b => b.metrics.status === "critical" || b.metrics.status === "over").length;

    return { totalLimit, totalSpent, overallPct, criticalCount };
  }, [budgets, analyzedBudgets]);

  if (!budgets.length) return null;

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-indigo-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/50">Budget Engine (v2.0)</span>
          {stats.criticalCount > 0 && (
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20"
            >
              {stats.criticalCount} ALERTA{stats.criticalCount > 1 ? "S" : ""}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30">
          <Calendar size={10} />
          {LEFT} dias p/ fechar o ciclo
        </div>
      </div>

      {/* ── Global Progress ─────────────────────────────────────────────────── */}
      <div className="card-obsidian rounded-3xl p-5 border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Capacidade de Gasto (Mês)</div>
            <div className="text-[24px] font-black font-mono text-white leading-none">
              {FinancialFormatter.formatCurrency(stats.totalSpent)}
              <span className="text-[12px] text-white/20 ml-2 font-bold select-none">/ {FinancialFormatter.formatCurrency(stats.totalLimit)}</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[28px] font-black font-mono text-indigo-400 leading-none">
              {Math.round(stats.overallPct)}%
            </div>
          </div>
        </div>
        
        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{ left: `${(DOM / DAYS) * 100}%` }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, stats.overallPct)}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
            style={{ 
              filter: stats.overallPct > (DOM/DAYS)*100 ? "hue-rotate(-40deg) saturate(1.2)" : "none" 
            }}
          />
        </div>
        <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-white/20">
          <span>Dia 1</span>
          <span className="text-white/40">Tempo decorrido: {Math.round((DOM/DAYS)*100)}%</span>
          <span>Dia {DAYS}</span>
        </div>
      </div>

      {/* ── Per-budget signals ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2">
        {analyzedBudgets.map(item => (
          <SignalCard 
            key={item.category} 
            label={item.category} 
            metrics={item.metrics} 
            onNavigate={onNavigate} 
          />
        ))}
      </div>

      {/* ── Info Footnote ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <Info size={12} className="text-white/20" />
        <p className="text-[9px] text-white/30 leading-tight">
          Cálculos baseados em <b>Pace-to-Limit</b>. Se o indicador de tempo (barra vertical) estiver à frente do progresso de gasto, seu orçamento está saudável.
        </p>
      </div>
    </div>
  );
};

