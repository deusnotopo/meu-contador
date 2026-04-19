/**
 * DebtOptimizer.tsx — Phase 29
 * ─────────────────────────────
 * Debt liquidation strategies: Avalanche vs Snowball,
 * payoff simulator, total interest comparison, visual timeline.
 * All pure computation from useDebts — zero API calls.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Snowflake,
  Zap,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Award,
} from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { formatCurrency } from "@/lib/formatters";
import type { Debt } from "@/types";

// ── Simulation Engine ─────────────────────────────────────────────────────────

interface PayoffStep {
  month: number;
  debtName: string;
  payment: number;
  remainingBalance: number;
  interestPaid: number;
}

interface SimResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
  order: string[]; // liquidation order
  steps: PayoffStep[]; // first debt liquidation events
  monthlyBreakdown: { month: number; totalRemaining: number }[];
}

function simulate(
  debts: Debt[],
  extra: number,
  strategy: "avalanche" | "snowball",
): SimResult {
  if (!debts.length)
    return {
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      order: [],
      steps: [],
      monthlyBreakdown: [],
    };

  // Clone & sort
  const pool = debts.map((d) => ({
    name: d.name,
    balance: d.balance,
    rate: d.interestRate / 100, // convert from % to decimal
    minPay: d.minPayment ?? 0,
  }));

  if (strategy === "avalanche") {
    pool.sort((a, b) => b.rate - a.rate); // highest interest first
  } else {
    pool.sort((a, b) => a.balance - b.balance); // smallest balance first
  }

  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  const order: string[] = [];
  const steps: PayoffStep[] = [];
  const monthlyBreakdown: { month: number; totalRemaining: number }[] = [];
  const MAX_MONTHS = 600; // 50-year safety cap

  while (pool.some((d) => d.balance > 0.01) && month < MAX_MONTHS) {
    month++;

    // Apply interest
    pool.forEach((d) => {
      if (d.balance > 0.01) {
        const interest = d.balance * d.rate;
        d.balance += interest;
        totalInterest += interest;
      }
    });

    // Total available payment: sum of minimums + extra
    const totalMinimums = pool
      .filter((d) => d.balance > 0.01)
      .reduce((s, d) => s + d.minPay, 0);
    let available = totalMinimums + extra;

    // Pay minimums first
    pool.forEach((d) => {
      if (d.balance > 0.01) {
        const pay = Math.min(d.minPay, d.balance);
        d.balance -= pay;
        totalPaid += pay;
        available -= pay;
      }
    });

    // Throw remaining at target debt (first in sorted order with balance > 0)
    for (const d of pool) {
      if (d.balance > 0.01 && available > 0) {
        const pay = Math.min(available, d.balance);
        d.balance -= pay;
        totalPaid += pay;
        available -= pay;

        if (d.balance <= 0.01) {
          d.balance = 0;
          order.push(d.name);
          steps.push({
            month,
            debtName: d.name,
            payment: pay,
            remainingBalance: 0,
            interestPaid: totalInterest,
          });
        }
        break; // only target first eligible
      }
    }

    // Record remaining
    const totalRemaining = pool.reduce((s, d) => s + d.balance, 0);
    if (month % 3 === 0 || totalRemaining < 0.01) {
      monthlyBreakdown.push({
        month,
        totalRemaining: Math.max(0, totalRemaining),
      });
    }
  }

  return {
    months: month,
    totalInterest,
    totalPaid,
    order,
    steps,
    monthlyBreakdown,
  };
}

// ── Timeline Visualization ────────────────────────────────────────────────────

const PayoffTimeline = ({ result }: { result: SimResult }) => {
  if (!result.monthlyBreakdown.length) return null;
  const maxBal = result.monthlyBreakdown[0]?.totalRemaining || 1;

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/25">
        Evolução do Saldo Total
      </div>
      <div className="flex items-end gap-[2px] h-20">
        {result.monthlyBreakdown.map((m, i) => {
          const h = maxBal > 0 ? (m.totalRemaining / maxBal) * 100 : 0;
          const isLast = i === result.monthlyBreakdown.length - 1;
          return (
            <motion.div
              key={m.month}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="flex-1 rounded-t-sm min-w-[3px]"
              style={{
                backgroundColor: isLast
                  ? "#10B981"
                  : h > 60
                    ? "#F43F5E"
                    : h > 30
                      ? "#F59E0B"
                      : "#3B82F6",
                opacity: 0.7,
              }}
              title={`Mês ${m.month}: ${formatCurrency(m.totalRemaining)}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] text-white/20">
        <span>Mês 1</span>
        <span>Mês {result.months}</span>
      </div>
    </div>
  );
};

// ── Strategy Card ─────────────────────────────────────────────────────────────

const StrategyCard = ({
  label,
  icon: Icon,
  color,
  result,
  isRecommended,
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  result: SimResult;
  isRecommended: boolean;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 rounded-2xl p-4 text-left transition-all border ${
      active
        ? `border-[${color}] bg-white/[0.04] shadow-lg`
        : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03]"
    }`}
    style={
      active ? { borderColor: color, boxShadow: `0 0 30px ${color}15` } : {}
    }
  >
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: `${color}15`,
          border: `1px solid ${color}25`,
        }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div className="text-[11px] font-black text-white/90">{label}</div>
        {isRecommended && (
          <span
            className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}15` }}
          >
            Recomendado
          </span>
        )}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
          Meses
        </div>
        <div className="text-[16px] font-black font-mono text-white">
          {result.months}
        </div>
      </div>
      <div>
        <div className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
          Juros Totais
        </div>
        <div className="text-[13px] font-black font-mono text-rose-400">
          {formatCurrency(result.totalInterest)}
        </div>
      </div>
    </div>
  </button>
);

// ── Liquidation Order List ────────────────────────────────────────────────────

const LiquidationOrder = ({ result }: { result: SimResult }) => {
  if (!result.order.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/25">
        Ordem de Liquidação
      </div>
      {result.order.map((name, i) => {
        const step = result.steps.find((s) => s.debtName === name);
        return (
          <div
            key={name}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-black text-emerald-400">
                {i + 1}
              </span>
            </div>
            <span className="text-[11px] font-bold text-white/80 flex-1 truncate">
              {name}
            </span>
            {step && (
              <span className="text-[10px] font-mono text-white/30 flex-shrink-0">
                mês {step.month}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const DebtOptimizer = () => {
  const { debts } = useDebts();
  const [extra, setExtra] = useState(200);
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">(
    "avalanche",
  );
  const [expanded, setExpanded] = useState(false);

  const activeDebts = useMemo(
    () => debts.filter((d) => d.balance > 0),
    [debts],
  );

  const avalanche = useMemo(
    () => simulate(activeDebts, extra, "avalanche"),
    [activeDebts, extra],
  );
  const snowball = useMemo(
    () => simulate(activeDebts, extra, "snowball"),
    [activeDebts, extra],
  );

  const recommended =
    avalanche.totalInterest <= snowball.totalInterest
      ? "avalanche"
      : "snowball";
  const current = strategy === "avalanche" ? avalanche : snowball;

  const savings = Math.abs(avalanche.totalInterest - snowball.totalInterest);
  const totalDebt = activeDebts.reduce((s, d) => s + d.balance, 0);

  if (!activeDebts.length) return null;

  return (
    <div className="space-y-4 mt-6">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-1"
      >
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-rose-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/50">
            Debt Optimizer
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {activeDebts.length} dívida{activeDebts.length > 1 ? "s" : ""} ·{" "}
            {formatCurrency(totalDebt)}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-white/30" />
        ) : (
          <ChevronDown size={14} className="text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-5">
              {/* Extra Payment Slider */}
              <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Pagamento Extra/Mês
                    </span>
                  </div>
                  <span className="text-[16px] font-black font-mono text-emerald-400">
                    {formatCurrency(extra)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(2000, totalDebt * 0.15)}
                  step={50}
                  value={extra}
                  onChange={(e) => setExtra(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-white/20 mt-1">
                  <span>R$ 0</span>
                  <span>Apenas mínimos</span>
                  <span>
                    {formatCurrency(Math.max(2000, totalDebt * 0.15))}
                  </span>
                </div>
              </div>

              {/* Strategy Toggle */}
              <div className="flex gap-3">
                <StrategyCard
                  label="Avalanche"
                  icon={Flame}
                  color="#F43F5E"
                  result={avalanche}
                  isRecommended={recommended === "avalanche"}
                  active={strategy === "avalanche"}
                  onClick={() => setStrategy("avalanche")}
                />
                <StrategyCard
                  label="Bola de Neve"
                  icon={Snowflake}
                  color="#3B82F6"
                  result={snowball}
                  isRecommended={recommended === "snowball"}
                  active={strategy === "snowball"}
                  onClick={() => setStrategy("snowball")}
                />
              </div>

              {/* Savings insight */}
              {savings > 10 && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <Award size={12} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-[10px] text-emerald-400/80">
                    {recommended === "avalanche" ? "Avalanche" : "Bola de Neve"}{" "}
                    economiza{" "}
                    <span className="font-black">
                      {formatCurrency(savings)}
                    </span>{" "}
                    em juros vs. a outra estratégia.
                  </span>
                </div>
              )}

              {/* Results for selected strategy */}
              <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05] space-y-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                  Resultado —{" "}
                  {strategy === "avalanche" ? "Avalanche" : "Bola de Neve"}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
                      Prazo
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar size={11} className="text-blue-400" />
                      <span className="text-[14px] font-black text-white font-mono">
                        {current.months}m
                      </span>
                    </div>
                    <div className="text-[9px] text-white/25">
                      ~{(current.months / 12).toFixed(1)} anos
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
                      Juros Totais
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingDown size={11} className="text-rose-400" />
                      <span className="text-[14px] font-black text-rose-400 font-mono">
                        {formatCurrency(current.totalInterest)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
                      Total Pago
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <DollarSign size={11} className="text-amber-400" />
                      <span className="text-[14px] font-black text-white font-mono">
                        {formatCurrency(current.totalPaid)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline chart */}
                <PayoffTimeline result={current} />

                {/* Liquidation Order */}
                <LiquidationOrder result={current} />
              </div>

              {/* Strategy explainer */}
              <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
                {strategy === "avalanche" ? (
                  <div className="flex items-start gap-2">
                    <Flame
                      size={12}
                      className="text-rose-400 flex-shrink-0 mt-0.5"
                    />
                    <div className="text-[10px] text-white/40 leading-relaxed">
                      <span className="text-rose-400 font-bold">
                        Avalanche:
                      </span>{" "}
                      Paga primeiro a dívida com maior taxa de juros. Minimiza o
                      total de juros pagos — matematicamente ótimo.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Snowflake
                      size={12}
                      className="text-blue-400 flex-shrink-0 mt-0.5"
                    />
                    <div className="text-[10px] text-white/40 leading-relaxed">
                      <span className="text-blue-400 font-bold">
                        Bola de Neve:
                      </span>{" "}
                      Paga primeiro a menor dívida. Dá vitórias psicológicas
                      rápidas — ótimo para motivação e disciplina.
                    </div>
                  </div>
                )}
              </div>

              {/* Warning for no-extra scenario */}
              {extra === 0 && current.months > 120 && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <AlertTriangle
                    size={12}
                    className="text-amber-400 flex-shrink-0"
                  />
                  <span className="text-[10px] text-amber-400/80">
                    Sem pagamento extra, a quitação levará mais de 10 anos.
                    Considere aumentar os pagamentos.
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
