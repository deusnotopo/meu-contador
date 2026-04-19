/**
 * WealthSurvival.tsx — Phase 35
 * ──────────────────────────────
 * "If income stops today, how many days can you survive?"
 * Cross-references bank balance, investments (by liquidity),
 * recurring expenses, and debt obligations to produce a
 * survival timeline with visual countdown.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Timer, Shield, Droplets, Flame, TrendingDown,
  AlertTriangle, Zap
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LiquidityBucket {
  label: string;
  emoji: string;
  amount: number;
  daysAdded: number;      // days of survival this bucket adds
  cumulativeDays: number;
  color: string;
}

interface SurvivalResult {
  totalDays: number;
  totalMonths: number;
  dailyBurn: number;
  monthlyBurn: number;
  buckets: LiquidityBucket[];
  status: "critical" | "warning" | "safe" | "fortress";
  statusLabel: string;
  statusEmoji: string;
  debtDrain: number;         // monthly debt obligations
  recurringDrain: number;    // monthly recurring expenses
  discretionaryBurn: number; // monthly discretionary spending
}

// ── Liquidity Classification ──────────────────────────────────────────────────

const LIQUID_TYPES = new Set(["fixed_income", "savings", "emergency", "cdb", "lci", "lca", "tesouro"]);
const SEMI_LIQUID_TYPES = new Set(["fii", "etf", "stock", "reit"]);
// everything else is illiquid (crypto, real_estate, business, etc.)

// ── Survival Engine ───────────────────────────────────────────────────────────

function calculateSurvival(params: {
  bankBalance: number;
  monthlyExpense: number;
  assets: { type: string; currentPrice: number; amount: number }[];
  monthlyDebtPayment: number;
  monthlyRecurring: number;
}): SurvivalResult {
  const { bankBalance, monthlyExpense, assets, monthlyDebtPayment, monthlyRecurring } = params;

  // Daily burn rate = total monthly expenses / 30
  const monthlyBurn = Math.max(1, monthlyExpense);
  const dailyBurn = monthlyBurn / 30;

  // Categorize assets by liquidity
  let liquid = 0;
  let semiLiquid = 0;
  let illiquid = 0;

  assets.forEach(a => {
    const value = a.currentPrice * a.amount;
    const t = a.type.toLowerCase();
    if (LIQUID_TYPES.has(t)) liquid += value;
    else if (SEMI_LIQUID_TYPES.has(t)) semiLiquid += value;
    else illiquid += value;
  });

  // Build buckets in liquidation order
  const buckets: LiquidityBucket[] = [];
  let cumulativeDays = 0;

  // 1. Cash/Bank Balance (instant access)
  if (bankBalance > 0) {
    const days = bankBalance / dailyBurn;
    cumulativeDays += days;
    buckets.push({
      label: "Saldo Bancário",
      emoji: "💳",
      amount: bankBalance,
      daysAdded: Math.round(days),
      cumulativeDays: Math.round(cumulativeDays),
      color: "#10B981",
    });
  }

  // 2. Liquid investments (1-3 day withdrawal)
  if (liquid > 0) {
    const days = liquid / dailyBurn;
    cumulativeDays += days;
    buckets.push({
      label: "Investimentos Líquidos",
      emoji: "💧",
      amount: liquid,
      daysAdded: Math.round(days),
      cumulativeDays: Math.round(cumulativeDays),
      color: "#3B82F6",
    });
  }

  // 3. Semi-liquid (stocks, FIIs — 3-5 day liquidation)
  if (semiLiquid > 0) {
    const days = semiLiquid / dailyBurn;
    cumulativeDays += days;
    buckets.push({
      label: "Renda Variável",
      emoji: "📊",
      amount: semiLiquid,
      daysAdded: Math.round(days),
      cumulativeDays: Math.round(cumulativeDays),
      color: "#8B5CF6",
    });
  }

  // 4. Illiquid (crypto, real estate — weeks to months)
  if (illiquid > 0) {
    const days = illiquid / dailyBurn;
    cumulativeDays += days;
    buckets.push({
      label: "Ativos Ilíquidos",
      emoji: "🔒",
      amount: illiquid,
      daysAdded: Math.round(days),
      cumulativeDays: Math.round(cumulativeDays),
      color: "#F59E0B",
    });
  }

  const totalDays = Math.round(cumulativeDays);
  const totalMonths = totalDays / 30;

  // Status classification
  let status: SurvivalResult["status"];
  let statusLabel: string;
  let statusEmoji: string;

  if (totalMonths >= 12) {
    status = "fortress"; statusLabel = "Fortaleza"; statusEmoji = "🏰";
  } else if (totalMonths >= 6) {
    status = "safe"; statusLabel = "Seguro"; statusEmoji = "🛡️";
  } else if (totalMonths >= 3) {
    status = "warning"; statusLabel = "Atenção"; statusEmoji = "⚠️";
  } else {
    status = "critical"; statusLabel = "Crítico"; statusEmoji = "🚨";
  }

  return {
    totalDays,
    totalMonths,
    dailyBurn,
    monthlyBurn,
    buckets,
    status,
    statusLabel,
    statusEmoji,
    debtDrain: monthlyDebtPayment,
    recurringDrain: monthlyRecurring,
    discretionaryBurn: Math.max(0, monthlyBurn - monthlyRecurring - monthlyDebtPayment),
  };
}

// ── Visual: Survival Ring ─────────────────────────────────────────────────────

const SurvivalRing = ({ days, status }: { days: number; status: SurvivalResult["status"] }) => {
  const maxDays = 365;
  const pct = Math.min(1, days / maxDays);
  const r = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const colors = {
    critical: "#F43F5E",
    warning: "#F59E0B",
    safe: "#3B82F6",
    fortress: "#10B981",
  };
  const c = colors[status];

  return (
    <svg width="130" height="130" viewBox="0 0 130 130" className="mx-auto">
      <defs>
        <linearGradient id="sv-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c} />
          <stop offset="100%" stopColor={c} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="url(#sv-grad)" strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 65 65)" strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
      />
      <text x="65" y="58" textAnchor="middle" fontSize="28" fontWeight="900" fill="#F0F4FF" fontFamily="monospace">
        {days > 999 ? "999+" : days}
      </text>
      <text x="65" y="73" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)" fontWeight="700">
        DIAS
      </text>
      <text x="65" y="88" textAnchor="middle" fontSize="8" fill={c} fontWeight="800">
        {(days / 30).toFixed(1)} MESES
      </text>
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const WealthSurvival = () => {
  const { totals } = useTransactions("personal");
  const { assets } = useInvestments();
  const { totals: debtTotals } = useDebts();
  const { summary: recurringSummary } = useRecurringExpenses();

  const result = useMemo((): SurvivalResult | null => {
    if (!totals || totals.expense === 0) return null;

    const bankBalance = Math.max(0, totals.balance);

    return calculateSurvival({
      bankBalance,
      monthlyExpense: totals.expense,
      assets: assets.map(a => ({ type: a.type, currentPrice: a.currentPrice, amount: a.amount })),
      monthlyDebtPayment: debtTotals.totalMinPayment ?? 0,
      monthlyRecurring: recurringSummary.totalMonthly,
    });
  }, [totals, assets, debtTotals, recurringSummary.totalMonthly]);

  if (!result) {
    return (
      <EmptyIntelligence
        icon={Timer}
        emoji="⏱️"
        title="Índice de Sobrevivência"
        description="Registre despesas para calcular quantos dias você sobrevive se a renda parar hoje."
        compact
        color="#F43F5E"
      />
    );
  }

  const statusColors = {
    critical: { bg: "bg-rose-500/5", border: "border-rose-500/15", text: "text-rose-400" },
    warning: { bg: "bg-amber-500/5", border: "border-amber-500/15", text: "text-amber-400" },
    safe: { bg: "bg-blue-500/5", border: "border-blue-500/15", text: "text-blue-400" },
    fortress: { bg: "bg-emerald-500/5", border: "border-emerald-500/15", text: "text-emerald-400" },
  };

  const sc = statusColors[result.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#060D1E] to-[#030712] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
          <Timer size={15} className="text-orange-400" />
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-orange-400">Índice de Sobrevivência</div>
          <div className="text-[9px] text-white/30">Se sua renda parar HOJE</div>
        </div>
      </div>

      {/* Ring + Status */}
      <div className="flex items-center justify-between">
        <SurvivalRing days={result.totalDays} status={result.status} />
        <div className="flex-1 pl-4 space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${sc.bg} border ${sc.border}`}>
            <span className="text-lg">{result.statusEmoji}</span>
            <span className={`text-[11px] font-black ${sc.text}`}>{result.statusLabel}</span>
          </div>
          <div className="text-[10px] text-white/35 leading-relaxed">
            {result.status === "critical" && "Menos de 3 meses. Priorize reserva de emergência antes de qualquer investimento."}
            {result.status === "warning" && "3-6 meses. Adequado para CLT, mas arriscado para autônomo. Aumente a liquidez."}
            {result.status === "safe" && "6-12 meses. Nível recomendado para a maioria dos perfis. Mantenha!"}
            {result.status === "fortress" && "Mais de 1 ano. Excelente resiliência. Foque em otimizar retornos."}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-white/25">
            <Flame size={9} className="text-orange-400/60" />
            <span>Burn rate: {formatCurrency(result.dailyBurn)}/dia</span>
          </div>
        </div>
      </div>

      {/* Liquidity Buckets */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1">
          Ordem de Liquidação
        </div>
        {result.buckets.map((b, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-base">{b.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/70">{b.label}</span>
                <span className="text-[10px] font-black font-mono text-white/50">{formatCurrency(b.amount)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (b.daysAdded / Math.max(1, result.totalDays)) * 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                </div>
                <span className="text-[9px] font-black font-mono" style={{ color: b.color }}>
                  +{b.daysAdded}d
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Burn Decomposition */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap size={8} className="text-rose-400" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Recorrente</span>
          </div>
          <div className="text-[12px] font-black font-mono text-rose-400">{formatCurrency(result.recurringDrain)}</div>
        </div>
        <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown size={8} className="text-amber-400" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Dívidas</span>
          </div>
          <div className="text-[12px] font-black font-mono text-amber-400">{formatCurrency(result.debtDrain)}</div>
        </div>
        <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Droplets size={8} className="text-blue-400" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Variável</span>
          </div>
          <div className="text-[12px] font-black font-mono text-blue-400">{formatCurrency(result.discretionaryBurn)}</div>
        </div>
      </div>

      {/* Warning for critical */}
      {result.status === "critical" && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
          <AlertTriangle size={12} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-rose-400/80 leading-relaxed">
            <strong>Ação urgente:</strong> com {result.totalDays} dias de reserva, qualquer imprevisto médico, demissão ou emergência pode gerar dívida cara. Priorize acumular pelo menos 90 dias antes de investir.
          </div>
        </div>
      )}

      {/* Safe milestone */}
      {result.status === "fortress" && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Shield size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-emerald-400/80 leading-relaxed">
            <strong>Parabéns!</strong> Com {result.totalMonths.toFixed(1)} meses de autonomia, você tem mais resiliência que 95% dos brasileiros. Foque em otimizar retornos e diversificar.
          </div>
        </div>
      )}
    </motion.div>
  );
};
