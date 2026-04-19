/**
 * IncomeDiversification.tsx — Phase 37
 * ──────────────────────────────────────
 * Income source dependency risk analyzer.
 * Shows concentration risk (HHI Index), income stability,
 * and actionable diversification recommendations.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Shield, AlertTriangle, TrendingUp,
  Briefcase, Wallet
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IncomeSource {
  name: string;
  total: number;
  monthlyAvg: number;
  pctOfTotal: number;
  monthCount: number;      // how many months it appeared
  consistency: number;     // 0-100 (100 = appears every month)
  trend: "growing" | "stable" | "declining";
  color: string;
}

interface DiversificationResult {
  sources: IncomeSource[];
  hhi: number;               // Herfindahl–Hirschman Index (0-10000)
  hhiLabel: string;
  riskLevel: "low" | "moderate" | "high" | "extreme";
  topSourcePct: number;
  stability: number;          // 0-100 income stability score
  monthlyVolatility: number;  // coefficient of variation %
}

const SOURCE_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#EC4899", "#06B6D4", "#F43F5E", "#84CC16",
];

// ── Engine ────────────────────────────────────────────────────────────────────

function analyzeDiversification(
  transactions: { type: string; category: string; description: string; amount: number; date: string }[],
): DiversificationResult | null {
  const incomes = transactions.filter(t => t.type === "income");
  if (incomes.length < 3) return null;

  // Group by source (use category or description)
  const sourceMap: Record<string, { amounts: number[]; months: Set<string> }> = {};
  incomes.forEach(t => {
    const key = t.category || t.description.slice(0, 30);
    if (!sourceMap[key]) sourceMap[key] = { amounts: [], months: new Set() };
    sourceMap[key]!.amounts.push(t.amount);
    sourceMap[key]!.months.add(t.date.slice(0, 7));
  });

  // Count total months of data
  const allMonths = new Set(incomes.map(t => t.date.slice(0, 7)));
  const totalMonths = Math.max(1, allMonths.size);
  const grandTotal = incomes.reduce((s, t) => s + t.amount, 0);

  // Build sources
  const sources: IncomeSource[] = Object.entries(sourceMap)
    .map(([name, data], i) => {
      const total = data.amounts.reduce((s, a) => s + a, 0);
      const monthlyAvg = total / totalMonths;
      const pctOfTotal = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
      const consistency = (data.months.size / totalMonths) * 100;

      // Trend: compare last half vs first half
      const sorted = data.amounts;
      const mid = Math.ceil(sorted.length / 2);
      const firstHalf = sorted.slice(0, mid);
      const secondHalf = sorted.slice(mid);
      const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / Math.max(1, firstHalf.length);
      const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / Math.max(1, secondHalf.length);
      const trendPct = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

      return {
        name,
        total,
        monthlyAvg,
        pctOfTotal,
        monthCount: data.months.size,
        consistency: Math.round(consistency),
        trend: trendPct > 10 ? "growing" as const : trendPct < -10 ? "declining" as const : "stable" as const,
        color: SOURCE_COLORS[i % SOURCE_COLORS.length]!,
      };
    })
    .sort((a, b) => b.total - a.total);

  // HHI (Herfindahl-Hirschman Index)
  const hhi = Math.round(sources.reduce((s, src) => s + Math.pow(src.pctOfTotal, 2), 0));

  let hhiLabel: string;
  let riskLevel: DiversificationResult["riskLevel"];
  if (hhi > 8000) { hhiLabel = "Monopólio"; riskLevel = "extreme"; }
  else if (hhi > 5000) { hhiLabel = "Altamente Concentrado"; riskLevel = "high"; }
  else if (hhi > 2500) { hhiLabel = "Moderadamente Concentrado"; riskLevel = "moderate"; }
  else { hhiLabel = "Diversificado"; riskLevel = "low"; }

  // Monthly income volatility
  const monthlyIncomes: Record<string, number> = {};
  incomes.forEach(t => {
    const m = t.date.slice(0, 7);
    monthlyIncomes[m] = (monthlyIncomes[m] || 0) + t.amount;
  });
  const monthlyValues = Object.values(monthlyIncomes);
  const avgMonthly = monthlyValues.reduce((s, v) => s + v, 0) / Math.max(1, monthlyValues.length);
  const variance = monthlyValues.reduce((s, v) => s + Math.pow(v - avgMonthly, 2), 0) / Math.max(1, monthlyValues.length);
  const stdDev = Math.sqrt(variance);
  const monthlyVolatility = avgMonthly > 0 ? (stdDev / avgMonthly) * 100 : 0;

  // Stability score (inverse of volatility, capped)
  const stability = Math.max(0, Math.round(100 - monthlyVolatility * 2));

  return {
    sources,
    hhi,
    hhiLabel,
    riskLevel,
    topSourcePct: sources[0]?.pctOfTotal ?? 0,
    stability,
    monthlyVolatility,
  };
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

const MiniDonut = ({ sources }: { sources: IncomeSource[] }) => {
  const R = 40; const W = 10; const cx = 50; const cy = 50;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {sources.map(src => {
        const len = (src.pctOfTotal / 100) * circ;
        const el = (
          <circle key={src.name} cx={cx} cy={cy} r={R} fill="none"
            stroke={src.color} strokeWidth={W} strokeLinecap="butt"
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="16" fontWeight="900"
        fill="#F0F4FF" fontFamily="monospace">
        {sources.length}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">
        fontes
      </text>
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const IncomeDiversification = () => {
  const { allTransactions: transactions } = useTransactions("personal");

  const result = useMemo(() => analyzeDiversification(transactions), [transactions]);

  if (!result) {
    return (
      <EmptyIntelligence
        icon={PieChart}
        emoji="💼"
        title="Diversificação de Renda"
        description="Registre pelo menos 3 receitas para analisar a dependência de fonte única."
        compact
        color="#8B5CF6"
      />
    );
  }

  const riskColors = {
    low: { bg: "bg-emerald-500/5", border: "border-emerald-500/15", text: "text-emerald-400" },
    moderate: { bg: "bg-blue-500/5", border: "border-blue-500/15", text: "text-blue-400" },
    high: { bg: "bg-amber-500/5", border: "border-amber-500/15", text: "text-amber-400" },
    extreme: { bg: "bg-rose-500/5", border: "border-rose-500/15", text: "text-rose-400" },
  };

  const rc = riskColors[result.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#0A0A1E] to-[#050512] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
          <Briefcase size={15} className="text-purple-400" />
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-purple-400">Diversificação de Renda</div>
          <div className="text-[9px] text-white/30">Risco de dependência de fonte única</div>
        </div>
      </div>

      {/* Donut + HHI */}
      <div className="flex items-center gap-5">
        <MiniDonut sources={result.sources} />
        <div className="flex-1 space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${rc.bg} border ${rc.border}`}>
            {result.riskLevel === "extreme" || result.riskLevel === "high"
              ? <AlertTriangle size={11} className={rc.text} />
              : <Shield size={11} className={rc.text} />}
            <span className={`text-[10px] font-black ${rc.text}`}>{result.hhiLabel}</span>
          </div>
          <div className="text-[9px] text-white/30">
            HHI: <span className="font-mono font-bold text-white/50">{result.hhi.toLocaleString()}</span>/10.000
            {" "}· Fonte principal: <span className="font-bold text-white/50">{result.topSourcePct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-1.5">
        {result.sources.map(src => (
          <div key={src.name} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: src.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/70 truncate capitalize">{src.name}</span>
                <span className="text-[10px] font-black font-mono text-white/50">{src.pctOfTotal.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${src.pctOfTotal}%`, backgroundColor: src.color }} />
                </div>
                <span className="text-[8px] text-white/25">{formatCurrency(src.monthlyAvg)}/mês</span>
                {src.trend === "growing" && <TrendingUp size={8} className="text-emerald-400" />}
                {src.trend === "declining" && <TrendingUp size={8} className="text-rose-400 rotate-180" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stability KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="text-[7px] font-bold uppercase tracking-widest text-white/20 mb-1">Estabilidade</div>
          <div className={`text-[16px] font-black font-mono ${result.stability >= 70 ? "text-emerald-400" : result.stability >= 40 ? "text-amber-400" : "text-rose-400"}`}>
            {result.stability}%
          </div>
          <div className="text-[8px] text-white/20">previsibilidade mensal</div>
        </div>
        <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="text-[7px] font-bold uppercase tracking-widest text-white/20 mb-1">Volatilidade</div>
          <div className={`text-[16px] font-black font-mono ${result.monthlyVolatility < 15 ? "text-emerald-400" : result.monthlyVolatility < 30 ? "text-amber-400" : "text-rose-400"}`}>
            ±{result.monthlyVolatility.toFixed(0)}%
          </div>
          <div className="text-[8px] text-white/20">variação mensal</div>
        </div>
      </div>

      {/* Risk Advisory */}
      {result.riskLevel === "extreme" && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
          <AlertTriangle size={11} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-rose-400/80 leading-relaxed">
            <strong>Risco extremo:</strong> {result.topSourcePct.toFixed(0)}% da renda vem de uma única fonte.
            Se essa fonte desaparecer, seu índice de sobrevivência cai para {Math.round((100 - result.topSourcePct) / 100 * 30)} dias.
            Considere freelancing, investimentos com renda passiva ou side projects.
          </div>
        </div>
      )}
      {result.riskLevel === "low" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Wallet size={11} className="text-emerald-400" />
          <div className="text-[10px] text-emerald-400/80">
            <strong>Diversificada!</strong> Suas fontes de renda estão bem distribuídas. Continue mantendo múltiplos fluxos.
          </div>
        </div>
      )}
    </motion.div>
  );
};
