/**
 * SpendingHeatmap.tsx — Phase 36
 * ─────────────────────────────────
 * GitHub-style contribution heatmap for daily spending.
 * Reveals invisible patterns: weekday bias, end-of-month spikes,
 * payday correlation, spending streaks, and danger zones.
 * Pure SVG, zero dependencies beyond existing hooks.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Flame, TrendingUp, Sun, Moon,
  AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayData {
  date: string;      // YYYY-MM-DD
  amount: number;
  count: number;
  weekday: number;   // 0=Sun, 6=Sat
  isWeekend: boolean;
}

interface HeatmapStats {
  avgDaily: number;
  avgWeekday: number;
  avgWeekend: number;
  weekendPremium: number;       // % more spent on weekends
  dangerDay: string;            // day of week with highest avg
  dangerDayAvg: number;
  safestDay: string;
  safestDayAvg: number;
  longestStreak: number;        // consecutive days spending > avg
  currentStreak: number;
  topSpendDate: string;
  topSpendAmount: number;
  endOfMonthSpike: number;      // % more in last 5 days of month
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ── Color Scale ───────────────────────────────────────────────────────────────

function heatColor(amount: number, max: number): string {
  if (amount === 0) return "rgba(255,255,255,0.03)";
  const intensity = Math.min(1, amount / Math.max(1, max));
  if (intensity < 0.25) return "rgba(16,185,129,0.25)";   // green - low
  if (intensity < 0.50) return "rgba(59,130,246,0.35)";    // blue - moderate
  if (intensity < 0.75) return "rgba(245,158,11,0.45)";    // amber - high
  return "rgba(244,63,94,0.55)";                            // rose - danger
}

// ── Compute Stats ─────────────────────────────────────────────────────────────

function computeStats(days: DayData[]): HeatmapStats {
  const withSpend = days.filter(d => d.amount > 0);
  const avgDaily = withSpend.length > 0
    ? withSpend.reduce((s, d) => s + d.amount, 0) / days.length
    : 0;

  // Weekday averages
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  days.forEach(d => {
    weekdayTotals[d.weekday]! += d.amount;
    weekdayCounts[d.weekday]!++;
  });
  const weekdayAvgs = weekdayTotals.map((t, i) => weekdayCounts[i]! > 0 ? t / weekdayCounts[i]! : 0);

  const avgWeekday = weekdayAvgs.slice(1, 6).reduce((s, v) => s + v, 0) / 5;
  const avgWeekend = (weekdayAvgs[0]! + weekdayAvgs[6]!) / 2;
  const weekendPremium = avgWeekday > 0 ? ((avgWeekend - avgWeekday) / avgWeekday) * 100 : 0;

  // Danger/safest day
  const maxAvg = Math.max(...weekdayAvgs);
  const minAvg = Math.min(...weekdayAvgs.filter(v => v > 0), maxAvg);
  const dangerIdx = weekdayAvgs.indexOf(maxAvg);
  const safestIdx = weekdayAvgs.indexOf(minAvg);

  // Spending streaks (consecutive days above average)
  let longestStreak = 0;
  let currentStreak = 0;
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i]!.amount > avgDaily) {
      streak++;
      if (i === days.length - 1) currentStreak = streak;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  // Top spend day
  const topDay = withSpend.sort((a, b) => b.amount - a.amount)[0];

  // End of month spike
  const endDays = days.filter(d => {
    const day = parseInt(d.date.slice(8, 10));
    return day >= 26;
  });
  const midDays = days.filter(d => {
    const day = parseInt(d.date.slice(8, 10));
    return day >= 10 && day <= 20;
  });
  const avgEnd = endDays.length > 0 ? endDays.reduce((s, d) => s + d.amount, 0) / endDays.length : 0;
  const avgMid = midDays.length > 0 ? midDays.reduce((s, d) => s + d.amount, 0) / midDays.length : 0;
  const endOfMonthSpike = avgMid > 0 ? ((avgEnd - avgMid) / avgMid) * 100 : 0;

  return {
    avgDaily,
    avgWeekday,
    avgWeekend,
    weekendPremium,
    dangerDay: WEEKDAY_FULL[dangerIdx] ?? "—",
    dangerDayAvg: weekdayAvgs[dangerIdx] ?? 0,
    safestDay: WEEKDAY_FULL[safestIdx] ?? "—",
    safestDayAvg: weekdayAvgs[safestIdx] ?? 0,
    longestStreak,
    currentStreak,
    topSpendDate: topDay?.date ?? "—",
    topSpendAmount: topDay?.amount ?? 0,
    endOfMonthSpike,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

export const SpendingHeatmap = () => {
  const { allTransactions: transactions } = useTransactions("personal");
  const [expanded, setExpanded] = useState(false);

  // Build day map for last 90 days
  const { dayGrid, stats, weeks, monthHeaders, max } = useMemo(() => {
    const today = new Date();
    const daysBack = 90;
    const dayMap: Record<string, DayData> = {};

    // Initialize all days
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = {
        date: key,
        amount: 0,
        count: 0,
        weekday: d.getDay(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    }

    // Fill from transactions
    transactions.filter(t => t.type === "expense").forEach(t => {
      const key = t.date.slice(0, 10);
      if (dayMap[key]) {
        dayMap[key]!.amount += t.amount;
        dayMap[key]!.count++;
      }
    });

    const allDays = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    const maxAmt = Math.max(...allDays.map(d => d.amount), 1);
    const stats = computeStats(allDays);

    // Build week columns (for heatmap grid)
    // Each column = 1 week, each row = day of week (Sun=0 to Sat=6)
    const weekCols: (DayData | null)[][] = [];
    let currentWeek: (DayData | null)[] = new Array(7).fill(null);

    allDays.forEach(day => {
      currentWeek[day.weekday] = day;
      if (day.weekday === 6) {
        weekCols.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    });
    if (currentWeek.some(d => d !== null)) weekCols.push(currentWeek);

    // Month boundaries for labels
    const months: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    weekCols.forEach((week, wi) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const m = parseInt(firstDay.date.slice(5, 7)) - 1;
        if (m !== lastMonth) {
          months.push({ label: MONTH_LABELS[m] ?? "", weekIdx: wi });
          lastMonth = m;
        }
      }
    });

    return { dayGrid: allDays, stats, weeks: weekCols, monthHeaders: months, max: maxAmt };
  }, [transactions]);

  if (dayGrid.length < 7) {
    return (
      <EmptyIntelligence
        icon={CalendarDays}
        emoji="📅"
        title="Heatmap de Gastos"
        description="Registre despesas por pelo menos 7 dias para revelar padrões de consumo."
        compact
        color="#F59E0B"
      />
    );
  }

  const CELL = 11;
  const GAP = 2;
  const LABEL_W = 22;
  const gridW = LABEL_W + weeks.length * (CELL + GAP);
  const gridH = 7 * (CELL + GAP);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#0A0E1A] to-[#060912] overflow-hidden"
    >
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <CalendarDays size={15} className="text-amber-400" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-widest text-amber-400">Spending Heatmap</div>
            <div className="text-[9px] text-white/30">
              90 dias · Avg {formatCurrency(stats.avgDaily)}/dia · Pico: {stats.dangerDay}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.weekendPremium > 15 && (
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sun size={8} /> FDS +{stats.weekendPremium.toFixed(0)}%
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">

          {/* Heatmap Grid */}
          <div className="overflow-x-auto no-scrollbar">
            <svg width={gridW} height={gridH + 18} viewBox={`0 0 ${gridW} ${gridH + 18}`} className="min-w-full">
              {/* Month labels */}
              {monthHeaders.map((m, i) => (
                <text key={i} x={LABEL_W + m.weekIdx * (CELL + GAP)} y={9}
                  fontSize="7" fill="rgba(255,255,255,0.2)" fontWeight="700">
                  {m.label}
                </text>
              ))}
              {/* Day of week labels */}
              {[1, 3, 5].map(dayIdx => (
                <text key={dayIdx} x={0} y={16 + dayIdx * (CELL + GAP) + CELL / 2 + 2}
                  fontSize="7" fill="rgba(255,255,255,0.15)" fontWeight="700" dominantBaseline="middle">
                  {WEEKDAY_LABELS[dayIdx]}
                </text>
              ))}
              {/* Cells */}
              {weeks.map((week, wi) =>
                week.map((day, di) => {
                  if (!day) return null;
                  return (
                    <rect
                      key={day.date}
                      x={LABEL_W + wi * (CELL + GAP)}
                      y={16 + di * (CELL + GAP)}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={heatColor(day.amount, max * 0.7)}
                      stroke={day.isWeekend ? "rgba(245,158,11,0.08)" : "none"}
                      strokeWidth={0.5}
                    >
                      <title>{day.date}: {formatCurrency(day.amount)} ({day.count} transações)</title>
                    </rect>
                  );
                })
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[8px] text-white/20 font-bold">
              <span>Menos</span>
              {[0, 0.2, 0.45, 0.7, 0.95].map((v, i) => (
                <div key={i} className="w-[10px] h-[10px] rounded-sm"
                  style={{ background: heatColor(v * max, max * 0.7) }} />
              ))}
              <span>Mais</span>
            </div>
            <span className="text-[8px] text-white/15">Últimos 90 dias</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1 mb-1">
                <Flame size={8} className="text-rose-400" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Dia Perigoso</span>
              </div>
              <div className="text-[12px] font-black text-rose-400">{stats.dangerDay}</div>
              <div className="text-[8px] text-white/25 font-mono">{formatCurrency(stats.dangerDayAvg)}/avg</div>
            </div>
            <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1 mb-1">
                <Moon size={8} className="text-emerald-400" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Dia Seguro</span>
              </div>
              <div className="text-[12px] font-black text-emerald-400">{stats.safestDay}</div>
              <div className="text-[8px] text-white/25 font-mono">{formatCurrency(stats.safestDayAvg)}/avg</div>
            </div>
            <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1 mb-1">
                <Sun size={8} className="text-amber-400" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">FDS Premium</span>
              </div>
              <div className={`text-[12px] font-black ${stats.weekendPremium > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {stats.weekendPremium > 0 ? "+" : ""}{stats.weekendPremium.toFixed(0)}%
              </div>
              <div className="text-[8px] text-white/25">vs dias úteis</div>
            </div>
            <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={8} className="text-indigo-400" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Fim do Mês</span>
              </div>
              <div className={`text-[12px] font-black ${stats.endOfMonthSpike > 10 ? "text-rose-400" : "text-emerald-400"}`}>
                {stats.endOfMonthSpike > 0 ? "+" : ""}{stats.endOfMonthSpike.toFixed(0)}%
              </div>
              <div className="text-[8px] text-white/25">dias 26-31 vs médio</div>
            </div>
          </div>

          {/* Streak + Top spend */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1">Maior Streak</div>
              <div className="text-[14px] font-black font-mono text-orange-400">{stats.longestStreak} dias</div>
              <div className="text-[8px] text-white/20">consecutivos acima da média</div>
            </div>
            <div className="flex-1 rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1">Pico Absoluto</div>
              <div className="text-[14px] font-black font-mono text-rose-400">{formatCurrency(stats.topSpendAmount)}</div>
              <div className="text-[8px] text-white/20">{stats.topSpendDate}</div>
            </div>
          </div>

          {/* Behavioral Alerts */}
          {stats.weekendPremium > 30 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <AlertTriangle size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-400/80 leading-relaxed">
                <strong>Alerta FDS:</strong> Você gasta {stats.weekendPremium.toFixed(0)}% a mais nos fins de semana.
                Isso pode representar {formatCurrency(stats.avgWeekend * 8)}/mês em gastos impulsivos de lazer.
              </div>
            </div>
          )}
          {stats.endOfMonthSpike > 25 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
              <AlertTriangle size={11} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-rose-400/80 leading-relaxed">
                <strong>Spike de fim de mês:</strong> Gastos sobem {stats.endOfMonthSpike.toFixed(0)}% nos últimos 5 dias.
                Padrão clássico de "já que vai virar o mês mesmo..." — planeje compras grandes para início do mês.
              </div>
            </div>
          )}

        </div>
      )}
    </motion.div>
  );
};
