/**
 * CashFlowForecast.tsx — Phase 31
 * ────────────────────────────────
 * 6-month cash flow projection with scenario engine:
 * - Optimistic (income +10%, expenses -5%)
 * - Neutral (average of last 3 months)
 * - Pessimistic (income -15%, expenses +10%)
 * Plus: stress test date, monthly breakdown, recurring drain map,
 * and surplus allocation suggestion.
 * All pure computation from existing hooks.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronUp,
  Zap, Shield, AlertTriangle, Sparkles, BarChart3
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MonthProjection {
  month: string;      // "Jan 2026"
  monthKey: string;   // "2026-01"
  income: number;
  expense: number;
  net: number;
  cumulativeBalance: number;
  recurringDrain: number;
}

interface Scenario {
  id: "optimistic" | "neutral" | "pessimistic";
  label: string;
  emoji: string;
  color: string;
  months: MonthProjection[];
  totalNet: number;
  stressMonth: string | null; // first month with negative cumulative
}

// ── Forecast Engine ───────────────────────────────────────────────────────────

function buildScenario(
  id: Scenario["id"],
  label: string,
  emoji: string,
  color: string,
  avgIncome: number,
  avgExpense: number,
  recurringMonthly: number,
  startBalance: number,
  incomeMult: number,
  expenseMult: number,
): Scenario {
  const months: MonthProjection[] = [];
  let cumulative = startBalance;
  let stressMonth: string | null = null;
  const now = new Date();

  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const income  = avgIncome * incomeMult;
    const expense = avgExpense * expenseMult;
    const net     = income - expense;
    cumulative   += net;

    if (cumulative < 0 && !stressMonth) {
      stressMonth = monthLabel;
    }

    months.push({
      month: monthLabel,
      monthKey,
      income,
      expense,
      net,
      cumulativeBalance: cumulative,
      recurringDrain: recurringMonthly,
    });
  }

  const totalNet = months.reduce((s, m) => s + m.net, 0);
  return { id, label, emoji, color, months, totalNet, stressMonth };
}

// ── Chart: Mini Sparkline ─────────────────────────────────────────────────────

const SparklineChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(Math.abs), 1);
  const h = 48;
  const w = 200;
  const step = w / (data.length - 1 || 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h / 2 - (v / max) * (h / 2 - 4);
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${h / 2} ${points} ${w},${h / 2}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sfg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sfg-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Zero line */}
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
};

// ── Scenario Card ─────────────────────────────────────────────────────────────

const ScenarioCard = ({
  scenario, active, onClick
}: { scenario: Scenario; active: boolean; onClick: () => void }) => {
  const lastMonth = scenario.months[scenario.months.length - 1];
  const isPositive = (lastMonth?.cumulativeBalance ?? 0) >= 0;

  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-2xl p-4 text-left transition-all border"
      style={active
        ? { borderColor: scenario.color, background: `${scenario.color}08`, boxShadow: `0 0 30px ${scenario.color}12` }
        : { borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{scenario.emoji}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{scenario.label}</span>
      </div>
      <div className={`text-[18px] font-black font-mono ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
        {formatCurrency(lastMonth?.cumulativeBalance ?? 0)}
      </div>
      <div className="text-[9px] text-white/25 mt-0.5">Saldo em 6 meses</div>
      {scenario.stressMonth && (
        <div className="flex items-center gap-1 mt-2">
          <AlertTriangle size={9} className="text-amber-400" />
          <span className="text-[8px] text-amber-400 font-bold">
            Negativo em {scenario.stressMonth}
          </span>
        </div>
      )}
    </button>
  );
};

// ── Monthly Breakdown Row ─────────────────────────────────────────────────────

const MonthRow = ({ m, maxAbs }: { m: MonthProjection; maxAbs: number }) => {
  const barW = maxAbs > 0 ? (Math.abs(m.net) / maxAbs) * 100 : 0;
  const isPositive = m.net >= 0;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-b-0">
      <span className="text-[10px] text-white/40 font-bold w-16 capitalize">{m.month}</span>
      <div className="flex-1 relative h-4 bg-white/[0.03] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(barW, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute top-0 bottom-0 rounded-full"
          style={{ backgroundColor: isPositive ? "#10B98160" : "#F43F5E60" }}
        />
      </div>
      <div className="flex items-center gap-1 w-24 justify-end">
        {isPositive ? <TrendingUp size={9} className="text-emerald-400" /> : <TrendingDown size={9} className="text-rose-400" />}
        <span className={`text-[11px] font-black font-mono ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {isPositive ? "+" : ""}{formatCurrency(m.net)}
        </span>
      </div>
      <span className="text-[10px] font-mono text-white/30 w-20 text-right">
        {formatCurrency(m.cumulativeBalance)}
      </span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const CashFlowForecast = () => {
  const { totals, transactions } = useTransactions("personal");
  const { summary: recurringSummary } = useRecurringExpenses();
  const [activeScenario, setActiveScenario] = useState<Scenario["id"]>("neutral");
  const [expanded, setExpanded] = useState(false);

  const scenarios = useMemo(() => {
    // Calculate 3-month moving averages
    const now = new Date();
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      if (tx.type === "income") monthlyData[key]!.income += tx.amount;
      else monthlyData[key]!.expense += tx.amount;
    });

    // Get last 3 months
    const recentMonths: { income: number; expense: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key]) recentMonths.push(monthlyData[key]!);
    }

    const avgIncome  = recentMonths.length > 0
      ? recentMonths.reduce((s, m) => s + m.income, 0) / recentMonths.length
      : totals?.income ?? 0;
    const avgExpense = recentMonths.length > 0
      ? recentMonths.reduce((s, m) => s + m.expense, 0) / recentMonths.length
      : totals?.expense ?? 0;

    const startBalance = (totals?.income ?? 0) - (totals?.expense ?? 0);
    const recurringMonthly = recurringSummary.totalMonthly;

    return [
      buildScenario("optimistic", "Otimista", "🚀", "#10B981", avgIncome, avgExpense, recurringMonthly, startBalance, 1.10, 0.95),
      buildScenario("neutral",    "Neutro",   "⚖️", "#3B82F6", avgIncome, avgExpense, recurringMonthly, startBalance, 1.00, 1.00),
      buildScenario("pessimistic","Pessimista","🌧️", "#F43F5E", avgIncome, avgExpense, recurringMonthly, startBalance, 0.85, 1.10),
    ];
  }, [transactions, totals, recurringSummary.totalMonthly]);

  const current = scenarios.find(s => s.id === activeScenario) ?? scenarios[1]!;

  if (!totals || ((totals.income ?? 0) === 0 && (totals.expense ?? 0) === 0)) {
    return (
      <EmptyIntelligence
        icon={BarChart3}
        emoji="📊"
        title="Projeção de Caixa"
        description="Registre receitas e despesas para ver a projeção de 6 meses com cenários otimista, neutro e pessimista."
        compact
        color="#3B82F6"
      />
    );
  }

  const maxAbsNet = Math.max(...current.months.map(m => Math.abs(m.net)), 1);
  const recurringPct = (totals?.expense ?? 1) > 0
    ? (recurringSummary.totalMonthly / (totals?.expense ?? 1)) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0A0E1A] to-[#060912] overflow-hidden"
    >
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 size={15} className="text-blue-400" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-widest text-blue-400">Cash Flow Forecast</div>
            <div className="text-[9px] text-white/30">Projeção 6 meses · 3 cenários · Stress test</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
            current.totalNet >= 0
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}>
            {current.totalNet >= 0 ? "+" : ""}{formatCurrency(current.totalNet)}
          </span>
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 space-y-5">

              {/* Scenario Toggle */}
              <div className="flex flex-col sm:flex-row gap-3">
                {scenarios.map(s => (
                  <ScenarioCard key={s.id} scenario={s} active={activeScenario === s.id} onClick={() => setActiveScenario(s.id)} />
                ))}
              </div>

              {/* Sparkline */}
              <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Saldo Acumulado</span>
                  <span className="text-[9px] font-mono text-white/20">
                    {current.months[0]?.month} → {current.months[current.months.length - 1]?.month}
                  </span>
                </div>
                <SparklineChart data={current.months.map(m => m.cumulativeBalance)} color={current.color} />
              </div>

              {/* Monthly Breakdown */}
              <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-blue-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Projeção Mensal</span>
                  </div>
                  <div className="flex gap-3 text-[8px] text-white/20">
                    <span>Fluxo</span>
                    <span>Saldo</span>
                  </div>
                </div>
                {current.months.map(m => (
                  <MonthRow key={m.monthKey} m={m} maxAbs={maxAbsNet} />
                ))}
              </div>

              {/* Recurring Drain Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={10} className="text-amber-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">Custo Fixo Autopilot</span>
                  </div>
                  <div className="text-[16px] font-black font-mono text-amber-400">
                    {formatCurrency(recurringSummary.totalMonthly)}
                    <span className="text-[9px] text-white/20 ml-1">/mês</span>
                  </div>
                  <div className="text-[9px] text-white/25 mt-1">
                    {recurringPct.toFixed(0)}% das despesas é automático
                  </div>
                </div>
                <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield size={10} className="text-emerald-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">Margem de Segurança</span>
                  </div>
                  <div className={`text-[16px] font-black font-mono ${
                    current.totalNet >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {formatCurrency(Math.abs(current.totalNet / 6))}
                    <span className="text-[9px] text-white/20 ml-1">/mês</span>
                  </div>
                  <div className="text-[9px] text-white/25 mt-1">
                    {current.totalNet >= 0 ? "Superávit médio mensal" : "Déficit médio mensal"}
                  </div>
                </div>
              </div>

              {/* Stress Alert */}
              {current.stressMonth && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                  <AlertTriangle size={13} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-black text-rose-400">⚠ Stress Test: Saldo negativo em {current.stressMonth}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      No cenário {current.label.toLowerCase()}, seu saldo fica negativo. Aumente a reserva ou reduza despesas antes dessa data.
                    </div>
                  </div>
                </div>
              )}

              {/* Surplus suggestion */}
              {current.totalNet > 0 && !current.stressMonth && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <Sparkles size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-black text-emerald-400">Superávit projetado: {formatCurrency(current.totalNet)}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      Sugestão: destine {formatCurrency(current.totalNet * 0.5)} para investimentos e {formatCurrency(current.totalNet * 0.3)} para metas.
                      Mantenha {formatCurrency(current.totalNet * 0.2)} como reserva adicional.
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
