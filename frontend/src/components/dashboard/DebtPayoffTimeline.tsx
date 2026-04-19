/**
 * DebtPayoffTimeline.tsx — Phase 44
 * ───────────────────────────────────
 * Visual debt payoff timeline comparing Avalanche vs Snowball strategies.
 * Pure local calculation — no API calls.
 *
 * - Avalanche: highest interest rate first (mathematically optimal)
 * - Snowball: smallest balance first (psychologically optimal)
 * Shows months to payoff, total interest paid, and monthly side-by-side.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  TrendingDown,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DebtSim {
  id: string;
  name: string;
  balance: number;
  rate: number; // monthly interest rate (%)
  minPayment: number;
}

interface PayoffResult {
  strategy: "avalanche" | "snowball";
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
  order: string[]; // debt names in payoff order
  timeline: { month: number; remaining: number }[];
}

// ── Simulation Engine ─────────────────────────────────────────────────────────

function simulatePayoff(
  debts: DebtSim[],
  strategy: "avalanche" | "snowball",
  extraPayment: number = 0,
): PayoffResult {
  if (debts.length === 0)
    return {
      strategy,
      totalMonths: 0,
      totalInterest: 0,
      totalPaid: 0,
      order: [],
      timeline: [],
    };

  // Sort order
  const sorted = [...debts].sort(
    (a, b) =>
      strategy === "avalanche"
        ? b.rate - a.rate // highest rate first
        : a.balance - b.balance, // lowest balance first
  );

  // Mutable state
  let remaining = sorted.map((d) => ({ ...d, bal: d.balance }));
  let totalInterest = 0;
  let month = 0;
  const maxMonths = 600; // 50 years cap
  const timeline: { month: number; remaining: number }[] = [];
  const payoffOrder: string[] = [];

  while (remaining.some((d) => d.bal > 0.01) && month < maxMonths) {
    month++;
    let availableExtra = extraPayment;

    // Apply interest + min payments
    remaining = remaining.map((d) => {
      if (d.bal <= 0) return d;
      const interest = d.bal * (d.rate / 100);
      totalInterest += interest;
      const newBal = Math.max(0, d.bal + interest - d.minPayment);
      return { ...d, bal: newBal };
    });

    // Apply extra payment to first non-zero debt (per strategy order)
    for (const d of remaining) {
      if (d.bal <= 0) continue;
      const pay = Math.min(availableExtra, d.bal);
      d.bal = Math.max(0, d.bal - pay);
      availableExtra -= pay;
      if (availableExtra <= 0) break;
    }

    // Track payoffs
    remaining.forEach((d) => {
      if (d.bal <= 0.01 && !payoffOrder.includes(d.name)) {
        payoffOrder.push(d.name);
        d.bal = 0;
      }
    });

    const totalRemaining = remaining.reduce((s, d) => s + d.bal, 0);
    if (month % 3 === 0 || totalRemaining < 1000) {
      timeline.push({ month, remaining: totalRemaining });
    }
  }

  const totalPaid = debts.reduce((s, d) => s + d.balance, 0) + totalInterest;

  return {
    strategy,
    totalMonths: month,
    totalInterest,
    totalPaid,
    order: payoffOrder,
    timeline,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DebtPayoffTimeline = () => {
  const { debts } = useDebts();
  const [extraPayment, setExtraPayment] = useState(200);
  const [expanded, setExpanded] = useState(false);

  const debtSims: DebtSim[] = useMemo(
    () =>
      debts
        .filter((d) => d.balance > 0)
        .map((d) => ({
          id: d.id,
          name: d.name,
          balance: d.balance,
          rate: d.interestRate ?? 2.5, // monthly %
          minPayment: d.minPayment ?? 0,
        })),
    [debts],
  );

  const { avalanche, snowball } = useMemo(
    () => ({
      avalanche: simulatePayoff(debtSims, "avalanche", extraPayment),
      snowball: simulatePayoff(debtSims, "snowball", extraPayment),
    }),
    [debtSims, extraPayment],
  );

  if (debtSims.length === 0) {
    return (
      <EmptyIntelligence
        icon={CreditCard}
        emoji="💳"
        title="Cronograma de Quitação"
        description="Cadastre suas dívidas para ver o plano de quitação Avalanche vs Snowball."
        compact
        color="#F43F5E"
      />
    );
  }

  const saving =
    avalanche.totalInterest < snowball.totalInterest
      ? snowball.totalInterest - avalanche.totalInterest
      : avalanche.totalInterest - snowball.totalInterest;
  const avalancheWins = avalanche.totalInterest <= snowball.totalInterest;

  const monthLabel = (m: number) =>
    m >= 12 ? `${Math.floor(m / 12)}a ${m % 12}m` : `${m}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#120409] to-[#08020A] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
            <CreditCard size={15} className="text-rose-400" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-rose-400">
              Cronograma de Quitação
            </div>
            <div className="text-[9px] text-white/30">
              {debtSims.length} dívida{debtSims.length > 1 ? "s" : ""} ·
              Avalanche vs Snowball
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-emerald-400 font-black">
            Economize
          </div>
          <div className="text-[13px] font-black font-mono text-emerald-400">
            {formatCurrency(saving)}
          </div>
        </div>
      </div>

      {/* Extra Payment Slider */}
      <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
            Pagamento Extra
          </span>
          <span className="text-[11px] font-black font-mono text-indigo-400">
            {formatCurrency(extraPayment)}/mês
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={50}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full accent-indigo-500 h-1"
        />
        <div className="flex justify-between text-[8px] text-white/15 mt-1">
          <span>R$ 0</span>
          <span>R$ 5.000</span>
        </div>
      </div>

      {/* Strategy Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Avalanche */}
        <div
          className={`rounded-xl p-3.5 border ${avalancheWins ? "bg-emerald-500/[0.04] border-emerald-500/20" : "bg-white/[0.02] border-white/[0.04]"}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Zap
              size={10}
              className={avalancheWins ? "text-emerald-400" : "text-white/30"}
            />
            <span
              className={`text-[9px] font-black uppercase tracking-widest ${avalancheWins ? "text-emerald-400" : "text-white/30"}`}
            >
              Avalanche {avalancheWins ? "★" : ""}
            </span>
          </div>
          <div className="text-[18px] font-black font-mono text-white mb-0.5">
            {monthLabel(avalanche.totalMonths)}
          </div>
          <div className="text-[8px] text-white/20">para quitar tudo</div>
          <div className="mt-2 pt-2 border-t border-white/[0.04]">
            <div className="text-[9px] text-rose-400/70 font-mono">
              {formatCurrency(avalanche.totalInterest)}
            </div>
            <div className="text-[8px] text-white/20">juros totais</div>
          </div>
        </div>

        {/* Snowball */}
        <div
          className={`rounded-xl p-3.5 border ${!avalancheWins ? "bg-emerald-500/[0.04] border-emerald-500/20" : "bg-white/[0.02] border-white/[0.04]"}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown
              size={10}
              className={!avalancheWins ? "text-emerald-400" : "text-white/30"}
            />
            <span
              className={`text-[9px] font-black uppercase tracking-widest ${!avalancheWins ? "text-emerald-400" : "text-white/30"}`}
            >
              Snowball {!avalancheWins ? "★" : ""}
            </span>
          </div>
          <div className="text-[18px] font-black font-mono text-white mb-0.5">
            {monthLabel(snowball.totalMonths)}
          </div>
          <div className="text-[8px] text-white/20">para quitar tudo</div>
          <div className="mt-2 pt-2 border-t border-white/[0.04]">
            <div className="text-[9px] text-rose-400/70 font-mono">
              {formatCurrency(snowball.totalInterest)}
            </div>
            <div className="text-[8px] text-white/20">juros totais</div>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="px-3 py-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-indigo-400/80 leading-relaxed">
        <strong>Avalanche</strong> economiza {formatCurrency(saving)} em juros.{" "}
        <strong>Snowball</strong> dá mais motivação (primeira dívida quitada em{" "}
        {monthLabel(snowball.totalMonths)}). Escolha baseado no seu perfil
        comportamental.
      </div>

      {/* Payoff Order toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors px-1"
      >
        <span>Ordem de Quitação (Avalanche)</span>
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-1">
              {avalanche.order.map((name, i) => (
                <div key={name} className="flex items-center gap-2 text-[10px]">
                  <span className="w-4 h-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[8px] font-black text-rose-400 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-white/50 truncate">{name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
