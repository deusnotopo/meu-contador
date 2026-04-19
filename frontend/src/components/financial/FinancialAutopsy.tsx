/**
 * FinancialAutopsy.tsx — Phase 34
 * ─────────────────────────────────
 * Deep spending pattern analyzer ("Raio-X Financeiro"):
 * 1. Phantom Subscriptions (forgot about them)
 * 2. Lifestyle Inflation Detector (spending growth > income growth)
 * 3. Wealth Drain Ranking (biggest destroyers)
 * 4. Opportunity Cost Engine (what if you invested instead?)
 * 5. Spending Velocity Alert (burn rate acceleration)
 * Pure computation from existing hooks.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ghost, TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, ChevronDown, ChevronUp, Flame, Eye,
  Clock, Sparkles, ArrowRight, Search
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PhantomSub {
  description: string;
  monthlyAmount: number;
  annualCost: number;
  lastSeen: string;
  daysSinceUsed: number;    // proxy: days since last appearance
  opportunity10yr: number;  // what it'd be worth invested over 10 years
}

interface WealthDrain {
  category: string;
  monthlyAvg: number;
  annualTotal: number;
  pctOfIncome: number;
  opportunity10yr: number;
  trend: "rising" | "stable" | "falling";
  emoji: string;
}

interface LifestyleInflation {
  incomeGrowth: number;     // % growth last 6m vs prior 6m
  expenseGrowth: number;    // % growth last 6m vs prior 6m
  gap: number;              // expense growth - income growth
  status: "healthy" | "warning" | "critical";
  monthlyCreep: number;     // extra monthly spend vs 6m ago
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Future value assuming monthly investment at 12% p.a. (1% p.m.) for N years */
const futureValue = (monthly: number, years: number): number => {
  const rate = 0.01; // 1% mensal (~12.68% a.a.)
  const months = years * 12;
  return monthly * ((Math.pow(1 + rate, months) - 1) / rate);
};

const EMOJI_MAP: Record<string, string> = {
  moradia: "🏠", mercado: "🛒", delivery: "🍕", transporte: "🚗",
  saúde: "💊", lazer: "🎮", educação: "📚", vestuário: "👕",
  assinaturas: "📱", restaurante: "🍽️", viagem: "✈️",
  pet: "🐾", beleza: "💅", tecnologia: "💻",
};

// ── Phantom Subscription Detection ────────────────────────────────────────────

function detectPhantomSubs(
  recurring: { description: string; averageAmount: number; lastPayment: string }[],
): PhantomSub[] {
  const now = Date.now();
  return recurring
    .filter(r => {
      // "phantom" = recurring charge that hasn't appeared recently
      // or that's very small (easy to forget)
      const lastDate = new Date(r.lastPayment).getTime();
      const daysSince = (now - lastDate) / (1000 * 60 * 60 * 24);
      return daysSince > 45 || r.averageAmount < 30; // > 45 days old OR < R$30
    })
    .map(r => {
      const lastDate = new Date(r.lastPayment).getTime();
      const daysSince = Math.round((now - lastDate) / (1000 * 60 * 60 * 24));
      const monthly = r.averageAmount;
      return {
        description: r.description,
        monthlyAmount: monthly,
        annualCost: monthly * 12,
        lastSeen: r.lastPayment,
        daysSinceUsed: daysSince,
        opportunity10yr: futureValue(monthly, 10),
      };
    })
    .sort((a: PhantomSub, b: PhantomSub) => b.opportunity10yr - a.opportunity10yr);
}

// ── Wealth Drain Ranking ──────────────────────────────────────────────────────

function rankWealthDrains(
  transactions: { type: string; category: string; amount: number; date: string }[],
  monthlyIncome: number,
): WealthDrain[] {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

  const cats: Record<string, { recent: number; older: number; total: number; count: number }> = {};

  transactions.filter(t => t.type === "expense").forEach(t => {
    const d = new Date(t.date);
    if (!cats[t.category]) cats[t.category] = { recent: 0, older: 0, total: 0, count: 0 };
    cats[t.category]!.total += t.amount;
    cats[t.category]!.count++;
    if (d >= sixMonthsAgo) cats[t.category]!.recent += t.amount;
    else if (d >= twelveMonthsAgo) cats[t.category]!.older += t.amount;
  });

  const months = Math.max(1, Math.min(12,
    (now.getTime() - new Date(transactions[transactions.length - 1]?.date ?? now.toISOString()).getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));

  return Object.entries(cats)
    .map(([category, data]) => {
      const monthlyAvg = data.total / months;
      const recentMonthly = data.recent / 6;
      const olderMonthly = data.older > 0 ? data.older / 6 : recentMonthly;
      const trendPct = olderMonthly > 0 ? ((recentMonthly - olderMonthly) / olderMonthly) * 100 : 0;

      return {
        category,
        monthlyAvg,
        annualTotal: monthlyAvg * 12,
        pctOfIncome: monthlyIncome > 0 ? (monthlyAvg / monthlyIncome) * 100 : 0,
        opportunity10yr: futureValue(monthlyAvg, 10),
        trend: trendPct > 5 ? "rising" as const : trendPct < -5 ? "falling" as const : "stable" as const,
        emoji: EMOJI_MAP[category.toLowerCase()] ?? "💸",
      };
    })
    .sort((a, b) => b.opportunity10yr - a.opportunity10yr)
    .slice(0, 8);
}

// ── Lifestyle Inflation ───────────────────────────────────────────────────────

function detectLifestyleInflation(
  monthlyTrend: { month: string; receitas: number; despesas: number }[],
): LifestyleInflation {
  if (monthlyTrend.length < 6) {
    return { incomeGrowth: 0, expenseGrowth: 0, gap: 0, status: "healthy", monthlyCreep: 0 };
  }

  const recent = monthlyTrend.slice(-3);
  const older  = monthlyTrend.slice(-6, -3);

  const recentIncome  = recent.reduce((s, m) => s + m.receitas, 0) / recent.length;
  const olderIncome   = older.reduce((s, m) => s + m.receitas, 0) / older.length;
  const recentExpense = recent.reduce((s, m) => s + m.despesas, 0) / recent.length;
  const olderExpense  = older.reduce((s, m) => s + m.despesas, 0) / older.length;

  const incomeGrowth  = olderIncome  > 0 ? ((recentIncome - olderIncome)   / olderIncome)  * 100 : 0;
  const expenseGrowth = olderExpense > 0 ? ((recentExpense - olderExpense) / olderExpense) * 100 : 0;
  const gap = expenseGrowth - incomeGrowth;
  const monthlyCreep = recentExpense - olderExpense;

  let status: LifestyleInflation["status"] = "healthy";
  if (gap > 10) status = "critical";
  else if (gap > 3) status = "warning";

  return { incomeGrowth, expenseGrowth, gap, status, monthlyCreep };
}

// ── Tab Component ─────────────────────────────────────────────────────────────

const TabButton = ({ active, label, icon: Icon, count, onClick }: {
  active: boolean; label: string; icon: React.ElementType; count?: number; onClick: () => void;
}) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
    active
      ? "bg-red-500/10 text-red-400 border-red-500/25"
      : "bg-white/[0.02] text-white/30 border-white/[0.05] hover:bg-white/[0.04]"
  }`}>
    <Icon size={10} />
    {label}
    {count !== undefined && count > 0 && (
      <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-black">{count}</span>
    )}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const FinancialAutopsy = () => {
  const { totals, allTransactions: transactions, monthlyTrend } = useTransactions("personal");
  const { recurringExpenses, summary: recurringSummary } = useRecurringExpenses();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"phantoms" | "drains" | "inflation">("phantoms");

  const phantoms = useMemo(() => detectPhantomSubs(recurringExpenses), [recurringExpenses]);
  const drains = useMemo(
    () => rankWealthDrains(transactions, totals?.income ?? 0),
    [transactions, totals]
  );
  const inflation = useMemo(() => detectLifestyleInflation(monthlyTrend), [monthlyTrend]);

  // Summary stats
  const totalPhantomAnnual = phantoms.reduce((s, p) => s + p.annualCost, 0);
  const totalDrainOpportunity = drains.slice(0, 3).reduce((s, d) => s + d.opportunity10yr, 0);
  const hasIssues = phantoms.length > 0 || drains.length > 0 || inflation.status !== "healthy";

  if (!totals || transactions.length < 5) {
    return (
      <EmptyIntelligence
        icon={Search}
        emoji="🔍"
        title="Raio-X Financeiro"
        description="Registre pelo menos 5 transações para revelar oportunidades de economia e otimização."
        compact
        color="#818CF8"
      />
    );
  }

  const severityColor = inflation.status === "critical"
    ? "text-rose-400"
    : inflation.status === "warning" ? "text-amber-400" : "text-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#100A0A] to-[#080508] overflow-hidden"
    >
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Search size={15} className="text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Raio-X Financeiro</div>
            <div className="text-[9px] text-white/30">
              {phantoms.length} assinatura{phantoms.length !== 1 ? "s" : ""} fantasma · {drains.length} drenos · {inflation.status === "healthy" ? "Sem inflação" : "Inflação detectada"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasIssues && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle size={9} />
              {phantoms.length + drains.filter(d => d.trend === "rising").length} alertas
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4">

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <TabButton active={activeTab === "phantoms"} label="Fantasmas" icon={Ghost} count={phantoms.length} onClick={() => setActiveTab("phantoms")} />
                <TabButton active={activeTab === "drains"} label="Drenos" icon={Flame} count={drains.filter(d => d.trend === "rising").length} onClick={() => setActiveTab("drains")} />
                <TabButton active={activeTab === "inflation"} label="Inflação" icon={TrendingUp} onClick={() => setActiveTab("inflation")} />
              </div>

              {/* ── TAB: Phantom Subscriptions ─────────────────────────── */}
              {activeTab === "phantoms" && (
                <div className="space-y-3">
                  {phantoms.length === 0 ? (
                    <div className="text-center py-6">
                      <Eye size={24} className="text-emerald-400 mx-auto mb-2" />
                      <div className="text-[11px] font-bold text-emerald-400">Nenhuma assinatura fantasma detectada</div>
                      <div className="text-[9px] text-white/25 mt-1">Todas as recorrências estão ativas e visíveis</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">
                          Cobranças esquecidas ou dormentes
                        </span>
                        <span className="text-[10px] font-black text-rose-400">
                          {formatCurrency(totalPhantomAnnual)}/ano
                        </span>
                      </div>
                      {phantoms.map((p, i) => (
                        <div key={i} className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.05] hover:border-rose-500/15 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Ghost size={12} className="text-rose-400/60" />
                              <span className="text-[11px] font-bold text-white/80 capitalize">{p.description}</span>
                            </div>
                            <span className="text-[11px] font-black text-rose-400 font-mono">
                              {formatCurrency(p.monthlyAmount)}/mês
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] text-white/30">
                            <span className="flex items-center gap-1">
                              <Clock size={8} />
                              {p.daysSinceUsed}d sem uso
                            </span>
                            <span>
                              {formatCurrency(p.annualCost)}/ano
                            </span>
                            <span className="flex items-center gap-1 text-amber-400/60">
                              <Sparkles size={8} />
                              {formatCurrency(p.opportunity10yr)} em 10 anos
                            </span>
                          </div>
                        </div>
                      ))}
                      {/* Total opportunity */}
                      <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                        <DollarSign size={13} className="text-rose-400 flex-shrink-0" />
                        <div>
                          <div className="text-[10px] font-black text-rose-400">
                            Custo de oportunidade: {formatCurrency(phantoms.reduce((s, p) => s + p.opportunity10yr, 0))} em 10 anos
                          </div>
                          <div className="text-[9px] text-white/30 mt-0.5">
                            Se canceladas e o valor investido a 12% a.a. (juros compostos)
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── TAB: Wealth Drains ──────────────────────────────────── */}
              {activeTab === "drains" && (
                <div className="space-y-3">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1">
                    Top categorias com maior impacto no patrimônio
                  </div>
                  {drains.map((d, i) => {
                    const barW = drains[0]?.opportunity10yr ? (d.opportunity10yr / drains[0].opportunity10yr) * 100 : 0;
                    return (
                      <div key={d.category} className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{d.emoji}</span>
                            <span className="text-[11px] font-bold text-white/80 capitalize">{d.category}</span>
                            {d.trend === "rising" && (
                              <span className="flex items-center gap-0.5 text-[8px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                                <TrendingUp size={7} /> subindo
                              </span>
                            )}
                            {d.trend === "falling" && (
                              <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                <TrendingDown size={7} /> caindo
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-black text-white/70 font-mono">{formatCurrency(d.monthlyAvg)}/mês</span>
                        </div>
                        {/* Progress bar */}
                        <div className="relative h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(barW, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{
                              background: i === 0 ? "linear-gradient(90deg, #F43F5E, #FB923C)"
                                : i === 1 ? "linear-gradient(90deg, #FB923C, #FBBF24)"
                                : "rgba(255,255,255,0.15)"
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-white/25">
                          <span>{d.pctOfIncome.toFixed(1)}% da renda</span>
                          <span className="flex items-center gap-1">
                            <ArrowRight size={7} className="text-amber-400/50" />
                            <span className="text-amber-400/60 font-bold">
                              {formatCurrency(d.opportunity10yr)} se investido 10 anos
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Total */}
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <Flame size={13} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-black text-amber-400">
                        Top 3 drenos → {formatCurrency(totalDrainOpportunity)} de oportunidade em 10 anos
                      </div>
                      <div className="text-[9px] text-white/30 mt-0.5">
                        Reduzir 10% nesses 3 = {formatCurrency(totalDrainOpportunity * 0.1)} extras investidos
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Lifestyle Inflation ────────────────────────────── */}
              {activeTab === "inflation" && (
                <div className="space-y-3">
                  {/* Status Card */}
                  <div className={`rounded-2xl p-5 border text-center ${
                    inflation.status === "critical"
                      ? "bg-rose-500/5 border-rose-500/15"
                      : inflation.status === "warning"
                      ? "bg-amber-500/5 border-amber-500/15"
                      : "bg-emerald-500/5 border-emerald-500/15"
                  }`}>
                    <div className="text-3xl mb-2">
                      {inflation.status === "critical" ? "🚨" : inflation.status === "warning" ? "⚠️" : "✅"}
                    </div>
                    <div className={`text-[14px] font-black mb-1 ${severityColor}`}>
                      {inflation.status === "critical"
                        ? "Inflação de Lifestyle Detectada"
                        : inflation.status === "warning"
                        ? "Lifestyle Creep em Curso"
                        : "Gastos Sob Controle"}
                    </div>
                    <div className="text-[10px] text-white/35">
                      {inflation.status !== "healthy"
                        ? `Seus gastos cresceram ${inflation.expenseGrowth.toFixed(1)}% enquanto a renda ${inflation.incomeGrowth > 0 ? "subiu" : "caiu"} ${Math.abs(inflation.incomeGrowth).toFixed(1)}%`
                        : "Crescimento de gastos proporcional ou menor que o da renda"}
                    </div>
                  </div>

                  {/* Comparison Bars */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-2">Renda (3m vs 3m)</div>
                      <div className={`text-[18px] font-black font-mono ${inflation.incomeGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {inflation.incomeGrowth >= 0 ? "+" : ""}{inflation.incomeGrowth.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-2">Gastos (3m vs 3m)</div>
                      <div className={`text-[18px] font-black font-mono ${inflation.expenseGrowth <= 0 ? "text-emerald-400" : inflation.expenseGrowth > inflation.incomeGrowth ? "text-rose-400" : "text-amber-400"}`}>
                        {inflation.expenseGrowth >= 0 ? "+" : ""}{inflation.expenseGrowth.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Monthly Creep */}
                  {inflation.monthlyCreep !== 0 && (
                    <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl ${
                      inflation.monthlyCreep > 0 ? "bg-rose-500/5 border border-rose-500/15" : "bg-emerald-500/5 border border-emerald-500/15"
                    }`}>
                      {inflation.monthlyCreep > 0 ? (
                        <TrendingUp size={13} className="text-rose-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown size={13} className="text-emerald-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className={`text-[10px] font-black ${inflation.monthlyCreep > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {inflation.monthlyCreep > 0 ? "+" : ""}{formatCurrency(inflation.monthlyCreep)}/mês vs. 6 meses atrás
                        </div>
                        <div className="text-[9px] text-white/30 mt-0.5">
                          {inflation.monthlyCreep > 0
                            ? `Em 10 anos investido: ${formatCurrency(futureValue(inflation.monthlyCreep, 10))} de patrimônio perdido`
                            : `Economia inteligente! ${formatCurrency(futureValue(Math.abs(inflation.monthlyCreep), 10))} de valor potencial em 10 anos`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recurring Cost Summary */}
                  <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock size={10} className="text-indigo-400" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">Custos Fixos Automáticos</span>
                    </div>
                    <div className="text-[16px] font-black font-mono text-indigo-400">
                      {formatCurrency(recurringSummary.totalMonthly)}/mês
                    </div>
                    <div className="text-[9px] text-white/30 mt-1">
                      {recurringSummary.itemCount} cobranças recorrentes · {formatCurrency(recurringSummary.totalAnnual)}/ano
                    </div>
                    {recurringSummary.potentialSavings > 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-400/70 mt-1.5">
                        <Sparkles size={8} />
                        Potencial de economia: {formatCurrency(recurringSummary.potentialSavings)}/mês
                      </div>
                    )}
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
