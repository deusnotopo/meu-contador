/**
 * InvestmentIntelligence.tsx — Phase 28
 * ─────────────────────────────────────
 * Advanced portfolio analytics: VaR, benchmark comparison,
 * dead-weight detection, ideal allocation gap analysis.
 * All computed client-side from already-loaded assets. Zero new API calls.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Shield, TrendingDown, TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, Target, Activity, BarChart3
} from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/formatters";
import type { Currency, Investment } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

// Annualized benchmark returns (2024-2025 reference)
const BENCHMARKS = {
  CDI:  { rate: 0.1165, label: "CDI",  color: "#10B981" },
  IPCA: { rate: 0.046,  label: "IPCA", color: "#F59E0B" },
  IBOV: { rate: 0.15,   label: "IBOV", color: "#3B82F6" },
};

// Asset type estimated annual volatility (σ)
const VOLATILITY: Record<string, number> = {
  fixed_income: 0.02,
  fii:          0.12,
  etf:          0.18,
  stock:        0.25,
  crypto:       0.60,
};

// Ideal allocation targets for moderate profile
const IDEAL_MODERATE: Record<string, number> = {
  fixed_income: 35,
  fii: 15,
  stock: 30,
  etf: 10,
  crypto: 10,
};

const TYPE_LABELS: Record<string, string> = {
  fixed_income: "Renda Fixa",
  fii: "FIIs",
  stock: "Ações",
  etf: "ETFs",
  crypto: "Crypto",
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ── VaR Gauge Ring ────────────────────────────────────────────────────────────

const VaRGauge = ({ varPct, portfolioValue }: { varPct: number; portfolioValue: number }) => {
  const r = 42; const size = 100;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.abs(varPct) * 4, 100); // scale 0-25% → 0-100%
  const color = pct > 60 ? "#F43F5E" : pct > 35 ? "#F59E0B" : "#10B981";

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={circ}
            animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
            transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-black font-mono" style={{ color }}>
            {varPct.toFixed(1)}%
          </span>
          <span className="text-[7px] text-white/30 font-bold uppercase tracking-widest">VaR 95</span>
        </div>
      </div>
      <div>
        <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-0.5">Perda Máxima Estimada (95%)</div>
        <div className="text-[18px] font-black font-mono text-white">
          {formatCurrency(portfolioValue * Math.abs(varPct / 100))}
        </div>
        <div className="text-[10px] text-white/40 mt-0.5">
          Em 95% dos cenários mensais, a perda não ultrapassa este valor.
        </div>
      </div>
    </div>
  );
};

// ── Benchmark Comparison Bar ──────────────────────────────────────────────────

const BenchmarkBar = ({
  label, benchReturn, portfolioReturn, color
}: { label: string; benchReturn: number; portfolioReturn: number; color: string }) => {
  const delta = portfolioReturn - benchReturn;
  const winning = delta >= 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-white/50 w-10 text-right">{label}</span>
      <div className="flex-1 relative h-5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.abs(benchReturn) * 3)}%` }}
          transition={{ duration: 0.8 }}
          className="absolute top-0 bottom-0 rounded-full opacity-30"
          style={{ backgroundColor: color }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.abs(portfolioReturn) * 3)}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-0 bottom-0 rounded-full"
          style={{ backgroundColor: winning ? "#10B981" : "#F43F5E", opacity: 0.7 }}
        />
      </div>
      <div className="flex items-center gap-1 w-24 justify-end">
        <span className={`text-[11px] font-black font-mono ${winning ? "text-emerald-400" : "text-rose-400"}`}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
        </span>
        {winning ? <TrendingUp size={10} className="text-emerald-400" /> : <TrendingDown size={10} className="text-rose-400" />}
      </div>
    </div>
  );
};

// ── Dead Weight Card ──────────────────────────────────────────────────────────

const DeadWeightCard = ({ asset, cdiRate, convert }: {
  asset: Investment; cdiRate: number; convert: (v: number, f: Currency, t: Currency) => number;
}) => {
  const cost = convert(asset.amount * asset.averagePrice, (asset.currency || "BRL") as Currency, "BRL");
  const value = convert(asset.amount * asset.currentPrice, (asset.currency || "BRL") as Currency, "BRL");
  const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
  const gap = returnPct - cdiRate * 100;

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
      <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
        <TrendingDown size={12} className="text-rose-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-black text-white/80 truncate">{asset.ticker || asset.name}</div>
        <div className="text-[9px] text-white/30">
          Retorno: <span className="text-rose-400 font-bold">{returnPct.toFixed(1)}%</span> · Gap CDI: <span className="text-rose-400 font-bold">{gap.toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-[12px] font-black font-mono text-rose-400 flex-shrink-0">
        {formatCurrency(value)}
      </div>
    </div>
  );
};

// ── Allocation Gap Bar ────────────────────────────────────────────────────────

const AllocationGapBar = ({ type, actual, ideal }: { type: string; actual: number; ideal: number }) => {
  const gap = actual - ideal;
  const color = Math.abs(gap) > 10 ? "#F43F5E" : Math.abs(gap) > 5 ? "#F59E0B" : "#10B981";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/60">{TYPE_LABELS[type] ?? type}</span>
        <span className="text-[9px] font-bold font-mono" style={{ color }}>
          {actual.toFixed(0)}% <span className="text-white/20">→</span> {ideal}%
          <span className="ml-1">({gap >= 0 ? "+" : ""}{gap.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="relative h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="absolute top-0 bottom-0 rounded-full bg-white/10" style={{ width: `${ideal}%` }} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, actual)}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute top-0 bottom-0 rounded-full"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const InvestmentIntelligence = () => {
  const { assets } = useInvestments();
  const currencyCtx = useCurrency();
  const convert = currencyCtx?.convert || ((v: number) => v);
  const [expanded, setExpanded] = useState(false);

  const analysis = useMemo(() => {
    if (!assets.length) return null;

    const totalValue = assets.reduce(
      (s, a) => s + convert(a.amount * a.currentPrice, (a.currency || "BRL") as Currency, "BRL"), 0
    );
    const totalCost = assets.reduce(
      (s, a) => s + convert(a.amount * a.averagePrice, (a.currency || "BRL") as Currency, "BRL"), 0
    );
    if (totalValue === 0) return null;

    const portfolioReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // ── VaR 95% (parametric, monthly) ──────────────────────────────────
    // Portfolio volatility = sqrt(sum(wi^2 * σi^2)) — simplified, no correlations
    let portfolioVariance = 0;
    assets.forEach(a => {
      const val = convert(a.amount * a.currentPrice, (a.currency || "BRL") as Currency, "BRL");
      const w = val / totalValue;
      const sigma = (VOLATILITY[a.type] || 0.15) / Math.sqrt(12); // monthly
      portfolioVariance += w * w * sigma * sigma;
    });
    const portfolioSigma = Math.sqrt(portfolioVariance);
    const varPct = portfolioSigma * 1.645 * 100; // 95% confidence, monthly

    // ── Dead weights: assets underperforming CDI ───────────────────────
    const deadWeights = assets
      .filter(a => {
        const cost = convert(a.amount * a.averagePrice, (a.currency || "BRL") as Currency, "BRL");
        const val  = convert(a.amount * a.currentPrice, (a.currency || "BRL") as Currency, "BRL");
        if (cost <= 0) return false;
        const ret = (val - cost) / cost;
        return ret < BENCHMARKS.CDI.rate && a.type !== "fixed_income";
      })
      .sort((a, b) => {
        const ra = a.averagePrice > 0 ? (a.currentPrice - a.averagePrice) / a.averagePrice : 0;
        const rb = b.averagePrice > 0 ? (b.currentPrice - b.averagePrice) / b.averagePrice : 0;
        return ra - rb;
      })
      .slice(0, 5);

    // ── Allocation gap vs. ideal ──────────────────────────────────────
    const byType: Record<string, number> = {};
    assets.forEach(a => {
      const val = convert(a.amount * a.currentPrice, (a.currency || "BRL") as Currency, "BRL");
      byType[a.type] = (byType[a.type] || 0) + val;
    });
    const allocGaps = Object.keys(IDEAL_MODERATE).map(t => ({
      type: t,
      actual: totalValue > 0 ? ((byType[t] || 0) / totalValue) * 100 : 0,
      ideal: IDEAL_MODERATE[t] ?? 0,
    }));

    // ── Risk label ───────────────────────────────────────────────────────
    const riskLevel = varPct > 15 ? "Alto" : varPct > 8 ? "Moderado" : "Baixo";
    const riskColor = varPct > 15 ? "#F43F5E" : varPct > 8 ? "#F59E0B" : "#10B981";

    return {
      totalValue, totalCost, portfolioReturn,
      varPct, portfolioSigma, riskLevel, riskColor,
      deadWeights, allocGaps,
    };
  }, [assets, convert]);

  if (!analysis) return null;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show"
      className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0A0E1A] to-[#060912] overflow-hidden">

      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Brain size={15} className="text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Investment Intelligence</div>
            <div className="text-[9px] text-white/30 font-medium">VaR · Benchmark · Pesos Mortos · Alocação Ideal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ color: analysis.riskColor, backgroundColor: `${analysis.riskColor}15`, border: `1px solid ${analysis.riskColor}25` }}>
            Risco {analysis.riskLevel}
          </span>
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">

              {/* ── Row 1: VaR + Benchmarks ─────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* VaR Card */}
                <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1.5 mb-4">
                    <Shield size={11} className="text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Value-at-Risk (Mensal, 95%)</span>
                  </div>
                  <VaRGauge varPct={analysis.varPct} portfolioValue={analysis.totalValue} />
                </div>

                {/* Benchmark Comparison */}
                <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-1.5 mb-4">
                    <BarChart3 size={11} className="text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">vs. Benchmarks</span>
                  </div>
                  <div className="space-y-3">
                    {Object.values(BENCHMARKS).map(b => (
                      <BenchmarkBar
                        key={b.label}
                        label={b.label}
                        benchReturn={b.rate * 100}
                        portfolioReturn={analysis.portfolioReturn}
                        color={b.color}
                      />
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <span className="text-[9px] text-white/25 font-bold">Retorno da Carteira</span>
                    <span className={`text-[14px] font-black font-mono ${analysis.portfolioReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {analysis.portfolioReturn >= 0 ? "+" : ""}{analysis.portfolioReturn.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Row 2: Dead Weights ──────────────────────────────────────── */}
              {analysis.deadWeights.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle size={11} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Pesos Mortos (abaixo do CDI)</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {analysis.deadWeights.length} ativo{analysis.deadWeights.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {analysis.deadWeights.map(a => (
                      <DeadWeightCard key={a.id} asset={a} cdiRate={BENCHMARKS.CDI.rate} convert={convert} />
                    ))}
                  </div>
                  <div className="text-[10px] text-white/25 mt-2 pl-1">
                    Esses ativos rendem menos que o CDI ({(BENCHMARKS.CDI.rate * 100).toFixed(1)}% a.a.). Considere realocar.
                  </div>
                </div>
              )}

              {/* ── Row 3: Allocation Gap ───────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Target size={11} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Gap de Alocação (Perfil Moderado)</span>
                </div>
                <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05] space-y-3">
                  {analysis.allocGaps.map(g => (
                    <AllocationGapBar key={g.type} type={g.type} actual={g.actual} ideal={g.ideal} />
                  ))}
                </div>
                <div className="text-[10px] text-white/25 mt-2 pl-1">
                  Barras mostram alocação real vs. ideal. Desvios {">"} 10% são sinalizados em vermelho.
                </div>
              </div>

              {/* ── Summary Insight ─────────────────────────────────────────── */}
              <div className="rounded-2xl p-4 bg-indigo-500/5 border border-indigo-500/15 flex items-start gap-3">
                <Activity size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-white/60 leading-relaxed">
                  <span className="text-indigo-400 font-bold">Resumo:</span>{" "}
                  Sua carteira tem risco {analysis.riskLevel.toLowerCase()} (VaR {analysis.varPct.toFixed(1)}%).
                  {analysis.portfolioReturn >= BENCHMARKS.CDI.rate * 100
                    ? ` Está batendo o CDI em ${(analysis.portfolioReturn - BENCHMARKS.CDI.rate * 100).toFixed(1)}pp. `
                    : ` Está abaixo do CDI em ${(BENCHMARKS.CDI.rate * 100 - analysis.portfolioReturn).toFixed(1)}pp. `}
                  {analysis.deadWeights.length > 0
                    ? `${analysis.deadWeights.length} ativo${analysis.deadWeights.length > 1 ? "s" : ""} rendendo abaixo do CDI pode${analysis.deadWeights.length > 1 ? "m" : ""} ser realocado${analysis.deadWeights.length > 1 ? "s" : ""}.`
                    : "Nenhum peso morto identificado."}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
