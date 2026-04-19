/**
 * WeeklyDigest.tsx — Phase 43
 * ─────────────────────────────
 * Compact weekly financial summary card.
 * Shows: this week vs last week comparison,
 * top 3 expenses, daily average, trend,
 * and one actionable insight.
 * Like a personal finance newsletter in a card.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Newspaper, TrendingUp, TrendingDown, ArrowRight,
  Calendar, DollarSign
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeekData {
  totalExpense: number;
  totalIncome: number;
  dailyAvg: number;
  txCount: number;
  topExpenses: { description: string; amount: number; category: string }[];
  topCategory: string;
  topCategoryAmount: number;
}

interface DigestResult {
  thisWeek: WeekData;
  lastWeek: WeekData;
  expenseChange: number;     // % change
  incomeChange: number;
  weekLabel: string;         // "Semana 15 · 7-14 Abr"
  insight: string;
  insightType: "positive" | "warning" | "neutral";
  savingsThisWeek: number;
}

// ── Engine ────────────────────────────────────────────────────────────────────

function buildDigest(
  transactions: { type: string; description: string; category: string; amount: number; date: string }[],
): DigestResult | null {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // This week: Monday to today
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - mondayOffset);
  thisMonday.setHours(0, 0, 0, 0);

  // Last week: previous Monday to Sunday
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(lastSunday.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);

  const buildWeek = (from: Date, to: Date): WeekData => {
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const weekTx = transactions.filter(t => {
      const d = t.date.slice(0, 10);
      return d >= fromStr && d <= toStr;
    });

    const expenses = weekTx.filter(t => t.type === "expense");
    const income = weekTx.filter(t => t.type === "income");
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // Top 3 expenses
    const sorted = [...expenses].sort((a, b) => b.amount - a.amount);
    const topExpenses = sorted.slice(0, 3).map(t => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
    }));

    // Top category
    const cats: Record<string, number> = {};
    expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
    const topCatEntry = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];

    return {
      totalExpense,
      totalIncome,
      dailyAvg: totalExpense / days,
      txCount: weekTx.length,
      topExpenses,
      topCategory: topCatEntry?.[0] ?? "—",
      topCategoryAmount: topCatEntry?.[1] ?? 0,
    };
  };

  const thisWeek = buildWeek(thisMonday, now);
  const lastWeek = buildWeek(lastMonday, lastSunday);

  if (thisWeek.txCount === 0 && lastWeek.txCount === 0) return null;

  const expenseChange = lastWeek.totalExpense > 0
    ? ((thisWeek.totalExpense - lastWeek.totalExpense) / lastWeek.totalExpense) * 100
    : 0;
  const incomeChange = lastWeek.totalIncome > 0
    ? ((thisWeek.totalIncome - lastWeek.totalIncome) / lastWeek.totalIncome) * 100
    : 0;

  // Week label
  const weekNum = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const fmtDay = (d: Date) => d.getDate();
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const weekLabel = `Semana ${weekNum} · ${fmtDay(thisMonday)}-${fmtDay(now)} ${months[now.getMonth()]}`;

  // Insight generation
  let insight: string;
  let insightType: DigestResult["insightType"];

  if (expenseChange < -15) {
    insight = `Gastos caíram ${Math.abs(expenseChange).toFixed(0)}% vs semana passada. Excelente controle!`;
    insightType = "positive";
  } else if (expenseChange > 30) {
    insight = `Gastos subiram ${expenseChange.toFixed(0)}%. Maior gasto: ${thisWeek.topExpenses[0]?.description ?? "—"} (${thisWeek.topExpenses[0] ? formatCurrency(thisWeek.topExpenses[0].amount) : ""})`;
    insightType = "warning";
  } else if (thisWeek.dailyAvg < lastWeek.dailyAvg) {
    insight = `Média diária melhorou: ${formatCurrency(thisWeek.dailyAvg)} vs ${formatCurrency(lastWeek.dailyAvg)} na semana passada.`;
    insightType = "positive";
  } else {
    insight = `Semana regular. ${thisWeek.topCategory} foi a categoria principal (${formatCurrency(thisWeek.topCategoryAmount)}).`;
    insightType = "neutral";
  }

  return {
    thisWeek,
    lastWeek,
    expenseChange,
    incomeChange,
    weekLabel,
    insight,
    insightType,
    savingsThisWeek: thisWeek.totalIncome - thisWeek.totalExpense,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

export const WeeklyDigest = () => {
  const { allTransactions: transactions } = useTransactions("personal");

  const digest = useMemo(() => buildDigest(transactions), [transactions]);

  if (!digest) {
    return (
      <EmptyIntelligence
        icon={Newspaper}
        emoji="📰"
        title="Resumo Semanal"
        description="Registre transações esta semana para gerar seu digest financeiro."
        compact
        color="#06B6D4"
      />
    );
  }

  const changeColor = digest.expenseChange > 10 ? "text-rose-400" : digest.expenseChange < -5 ? "text-emerald-400" : "text-white/40";
  const insightColors = { positive: "bg-emerald-500/5 border-emerald-500/15 text-emerald-400/80", warning: "bg-amber-500/5 border-amber-500/15 text-amber-400/80", neutral: "bg-white/[0.02] border-white/[0.05] text-white/40" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#040E14] to-[#030810] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
            <Newspaper size={15} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-cyan-400">Resumo Semanal</div>
            <div className="text-[9px] text-white/30 flex items-center gap-1">
              <Calendar size={8} /> {digest.weekLabel}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-[14px] font-black font-mono ${changeColor}`}>
            {digest.expenseChange > 0 ? "+" : ""}{digest.expenseChange.toFixed(0)}%
          </div>
          <div className="text-[8px] text-white/20">vs semana anterior</div>
        </div>
      </div>

      {/* This Week vs Last Week */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1">Esta Semana</div>
          <div className="text-[16px] font-black font-mono text-rose-400">{formatCurrency(digest.thisWeek.totalExpense)}</div>
          <div className="flex items-center justify-between mt-1 text-[8px] text-white/20">
            <span>{digest.thisWeek.txCount} transações</span>
            <span>{formatCurrency(digest.thisWeek.dailyAvg)}/dia</span>
          </div>
        </div>
        <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1">Semana Anterior</div>
          <div className="text-[16px] font-black font-mono text-white/40">{formatCurrency(digest.lastWeek.totalExpense)}</div>
          <div className="flex items-center justify-between mt-1 text-[8px] text-white/20">
            <span>{digest.lastWeek.txCount} transações</span>
            <span>{formatCurrency(digest.lastWeek.dailyAvg)}/dia</span>
          </div>
        </div>
      </div>

      {/* Top 3 Expenses */}
      {digest.thisWeek.topExpenses.length > 0 && (
        <div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 px-1 mb-1.5">
            Maiores Gastos da Semana
          </div>
          {digest.thisWeek.topExpenses.map((e, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/15 w-3">{i + 1}.</span>
                <span className="text-[10px] text-white/50 truncate max-w-[160px]">{e.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-white/20">{e.category}</span>
                <span className="text-[10px] font-black font-mono text-white/60">{formatCurrency(e.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Savings */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <DollarSign size={11} className={digest.savingsThisWeek >= 0 ? "text-emerald-400" : "text-rose-400"} />
        <div className="flex-1">
          <div className={`text-[10px] font-black ${digest.savingsThisWeek >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            Saldo semanal: {digest.savingsThisWeek >= 0 ? "+" : ""}{formatCurrency(digest.savingsThisWeek)}
          </div>
        </div>
        {digest.savingsThisWeek >= 0 ? (
          <TrendingUp size={12} className="text-emerald-400/50" />
        ) : (
          <TrendingDown size={12} className="text-rose-400/50" />
        )}
      </div>

      {/* Insight */}
      <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${insightColors[digest.insightType]}`}>
        <ArrowRight size={10} className="flex-shrink-0 mt-0.5" />
        <div className="text-[10px] leading-relaxed">{digest.insight}</div>
      </div>
    </motion.div>
  );
};
