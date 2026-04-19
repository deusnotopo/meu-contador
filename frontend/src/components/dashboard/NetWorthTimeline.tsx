/**
 * NetWorthTimeline.tsx — Phase 32
 * ────────────────────────────────
 * Historical net worth evolution with milestone badges,
 * growth decomposition, and rate-of-change velocity.
 * Computes from monthly transaction trends + investments + debts.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Award, ChevronDown, ChevronUp,
  Layers, Zap, Target
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MonthlySnapshot {
  month: string;      // "2025-12"
  label: string;      // "Dez 2025"
  netWorth: number;
  savings: number;     // cumulative savings (income - expense)
  investments: number; // portfolio value at that point
  liabilities: number;
}

interface Milestone {
  amount: number;
  emoji: string;
  label: string;
  reached: boolean;
  reachedMonth?: string;
}

interface TimelineProps {
  monthlyTrend: { month: string; receitas: number; despesas: number }[];
  currentNetWorth: number;
  currentAssets: number;
  currentLiabilities: number;
  investmentValue: number;
}

// ── Milestone Definitions ─────────────────────────────────────────────────────

const MILESTONE_DEFS: { amount: number; emoji: string; label: string }[] = [
  { amount: 1_000,     emoji: "🌱", label: "Primeiro Mil" },
  { amount: 5_000,     emoji: "🌿", label: "Primavera Financeira" },
  { amount: 10_000,    emoji: "💪", label: "Cinco Dígitos" },
  { amount: 25_000,    emoji: "⚡", label: "Reserva Sólida" },
  { amount: 50_000,    emoji: "🔥", label: "Meio Caminho para 100k" },
  { amount: 100_000,   emoji: "💎", label: "Patrimônio Seis Dígitos" },
  { amount: 250_000,   emoji: "🏆", label: "Quarter Million" },
  { amount: 500_000,   emoji: "👑", label: "Meio Milhão" },
  { amount: 1_000_000, emoji: "🎯", label: "Milionário" },
];

// ── Chart Component ───────────────────────────────────────────────────────────

const AreaChart = ({ data, color }: { data: { value: number; label: string }[]; color: string }) => {
  if (data.length < 2) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const W = 320;
  const H = 80;
  const PAD = 4;
  const usableW = W - PAD * 2;
  const usableH = H - PAD * 2;
  const step = usableW / (data.length - 1);

  const points = data.map((d, i) => {
    const x = PAD + i * step;
    const y = PAD + usableH - ((d.value - min) / range) * usableH;
    return { x, y };
  });

  const lineStr = points.map(p => `${p.x},${p.y}`).join(" ");
  const areaStr = `${PAD},${H - PAD} ${lineStr} ${PAD + (data.length - 1) * step},${H - PAD}`;

  // Zero line position
  const zeroY = PAD + usableH - ((0 - min) / range) * usableH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="rounded-xl">
      <defs>
        <linearGradient id="nw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaStr} fill="url(#nw-grad)" />
      <polyline points={lineStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Zero line */}
      {min < 0 && (
        <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />
      )}
      {/* Endpoint dot */}
      {points.length > 0 && (
        <circle cx={points[points.length - 1]!.x} cy={points[points.length - 1]!.y} r="4" fill={color} stroke="#0A0E1A" strokeWidth="2" />
      )}
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const NetWorthTimeline = ({
  monthlyTrend, currentNetWorth, currentAssets: _currentAssets, currentLiabilities, investmentValue
}: TimelineProps) => {
  const [expanded, setExpanded] = useState(false);

  const snapshots = useMemo((): MonthlySnapshot[] => {
    if (monthlyTrend.length === 0) return [];

    // Build cumulative savings from monthly trends
    let cumSavings = 0;
    const snaps: MonthlySnapshot[] = monthlyTrend.map(m => {
      const net = m.receitas - m.despesas;
      cumSavings += net;

      const d = new Date(`${m.month}-01T00:00:00Z`);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");

      return {
        month: m.month,
        label,
        netWorth: cumSavings, // will be adjusted relative to current
        savings: cumSavings,
        investments: 0,
        liabilities: 0,
      };
    });

    // Adjust snapshots relative to current net worth
    // The last snapshot's cumulative savings tells us the "bank account" portion
    // Real net worth = savings + investments - debts
    // But we only have current investment/debt values, so we project backward
    const lastSavings = snaps[snaps.length - 1]?.savings ?? 0;
    const delta = currentNetWorth - lastSavings;

    snaps.forEach(s => {
      // Scale investment/liability contribution proportionally
      const progress = lastSavings !== 0 ? s.savings / lastSavings : 0;
      s.investments = investmentValue * Math.max(0, progress);
      s.liabilities = currentLiabilities * Math.max(0, progress);
      s.netWorth = s.savings + delta * Math.max(0, progress);
    });

    // Ensure last snapshot matches current
    if (snaps.length > 0) {
      snaps[snaps.length - 1]!.netWorth = currentNetWorth;
      snaps[snaps.length - 1]!.investments = investmentValue;
      snaps[snaps.length - 1]!.liabilities = currentLiabilities;
    }

    return snaps;
  }, [monthlyTrend, currentNetWorth, investmentValue, currentLiabilities]);

  const milestones = useMemo((): Milestone[] => {
    return MILESTONE_DEFS.map(def => {
      const reachedSnap = snapshots.find(s => s.netWorth >= def.amount);
      return {
        ...def,
        reached: currentNetWorth >= def.amount,
        reachedMonth: reachedSnap?.label,
      };
    });
  }, [snapshots, currentNetWorth]);

  // Growth rate (last 3 months)
  const growthRate = useMemo(() => {
    if (snapshots.length < 4) return { monthly: 0, annualized: 0 };
    const recent = snapshots.slice(-3);
    const older  = snapshots.slice(-4, -1);
    const recentAvg = recent.reduce((s, x) => s + x.netWorth, 0) / recent.length;
    const olderAvg  = older.reduce((s, x) => s + x.netWorth, 0) / older.length;
    const monthly = olderAvg !== 0 ? ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100 : 0;
    const annualized = monthly * 12;
    return { monthly, annualized };
  }, [snapshots]);

  // Decomposition
  const decomposition = useMemo(() => {
    if (snapshots.length < 2) return { savings: 0, investment: 0, savingsPct: 0, investmentPct: 0 };
    const totalSavings = snapshots[snapshots.length - 1]?.savings ?? 0;
    const investGain = investmentValue > 0 ? currentNetWorth - totalSavings : 0;
    const total = Math.abs(totalSavings) + Math.abs(investGain) || 1;
    return {
      savings: totalSavings,
      investment: investGain,
      savingsPct: (Math.abs(totalSavings) / total) * 100,
      investmentPct: (Math.abs(investGain) / total) * 100,
    };
  }, [snapshots, investmentValue, currentNetWorth]);

  if (snapshots.length < 2) {
    return (
      <EmptyIntelligence
        icon={Layers}
        emoji="📈"
        title="Timeline Patrimonial"
        description="Registre transações em pelo menos 2 meses para ver a evolução do seu patrimônio com milestones."
        compact
        color="#818CF8"
      />
    );
  }

  const nextMilestone = milestones.find(m => !m.reached);
  const reachedCount = milestones.filter(m => m.reached).length;
  const isGrowing = growthRate.monthly > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#060D1E] to-[#030712] overflow-hidden"
    >
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Layers size={15} className="text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Net Worth Timeline</div>
            <div className="text-[9px] text-white/30">
              {snapshots.length} meses · {reachedCount} milestone{reachedCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${
            isGrowing
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}>
            {isGrowing ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {isGrowing ? "+" : ""}{growthRate.monthly.toFixed(1)}%/mês
          </span>
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4">

              {/* Chart */}
              <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Evolução Patrimonial</span>
                  <span className="text-[9px] font-mono text-white/20">
                    {snapshots[0]?.label} → {snapshots[snapshots.length - 1]?.label}
                  </span>
                </div>
                <AreaChart
                  data={snapshots.map(s => ({ value: s.netWorth, label: s.label }))}
                  color={isGrowing ? "#10B981" : "#F43F5E"}
                />
                <div className="flex justify-between mt-1.5 text-[8px] text-white/20">
                  <span>{snapshots[0]?.label}</span>
                  <span>{snapshots[snapshots.length - 1]?.label}</span>
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Zap size={9} className="text-emerald-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">Velocidade</span>
                  </div>
                  <div className={`text-[15px] font-black font-mono ${isGrowing ? "text-emerald-400" : "text-rose-400"}`}>
                    {isGrowing ? "+" : ""}{growthRate.monthly.toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-white/20 mt-0.5">
                    ~{isGrowing ? "+" : ""}{growthRate.annualized.toFixed(0)}%/ano
                  </div>
                </div>
                <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Layers size={9} className="text-blue-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">Por Poupança</span>
                  </div>
                  <div className="text-[15px] font-black font-mono text-blue-400">
                    {decomposition.savingsPct.toFixed(0)}%
                  </div>
                  <div className="text-[8px] text-white/20 mt-0.5">
                    {formatCurrency(decomposition.savings)}
                  </div>
                </div>
                <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingUp size={9} className="text-amber-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">Por Investimento</span>
                  </div>
                  <div className="text-[15px] font-black font-mono text-amber-400">
                    {decomposition.investmentPct.toFixed(0)}%
                  </div>
                  <div className="text-[8px] text-white/20 mt-0.5">
                    {formatCurrency(decomposition.investment)}
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1">
                  Milestones ({reachedCount}/{milestones.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {milestones.map(m => (
                    <div
                      key={m.amount}
                      className={`rounded-xl p-2.5 border text-center transition-all ${
                        m.reached
                          ? "border-amber-500/25 bg-amber-500/[0.05]"
                          : "border-white/[0.04] bg-white/[0.01] opacity-40"
                      }`}
                    >
                      <div className="text-lg mb-0.5">{m.emoji}</div>
                      <div className="text-[9px] font-black text-white/70 truncate">{m.label}</div>
                      <div className="text-[8px] font-mono text-white/30">{formatCurrency(m.amount)}</div>
                      {m.reached && m.reachedMonth && (
                        <div className="text-[7px] text-amber-400/60 mt-0.5 capitalize">{m.reachedMonth}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Milestone Target */}
              {nextMilestone && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-xl">
                    {nextMilestone.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-indigo-400">
                      Próximo: {nextMilestone.label}
                    </div>
                    <div className="text-[9px] text-white/35 mt-0.5">
                      Faltam {formatCurrency(nextMilestone.amount - currentNetWorth)} para {formatCurrency(nextMilestone.amount)}
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-1 rounded-full bg-white/[0.05] mt-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentNetWorth / nextMilestone.amount) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <Target size={14} className="text-indigo-400/50" />
                    <div className="text-[10px] font-black font-mono text-indigo-400 mt-1">
                      {Math.min(100, (currentNetWorth / nextMilestone.amount) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {/* All milestones reached */}
              {!nextMilestone && currentNetWorth >= 1_000_000 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <Award size={16} className="text-amber-400" />
                  <span className="text-[11px] font-black text-amber-400">
                    Todos os milestones conquistados! Patrimônio: {formatCurrency(currentNetWorth)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
