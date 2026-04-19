/**
 * FIRECountdown.tsx — Phase 39
 * ──────────────────────────────
 * Financial Independence countdown timer.
 * Calculates years/months until passive income covers expenses,
 * based on current savings rate, investment returns, and burn rate.
 * Shows acceleration levers: "save 10% more → arrive 3 years sooner".
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame, Clock, Zap, Calculator
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FIREResult {
  yearsToFIRE: number;
  monthsToFIRE: number;
  targetDate: string;
  fireNumber: number;         // 25x annual expenses (4% rule)
  currentNetWorth: number;
  monthlySavings: number;
  savingsRate: number;
  monthlyExpense: number;
  annualReturn: number;
  progress: number;           // 0-100%
  accelerators: Accelerator[];
  status: "achieved" | "close" | "on_track" | "long" | "unreachable";
}

interface Accelerator {
  label: string;
  emoji: string;
  yearsReduced: number;
  description: string;
}

// ── FIRE Calculator ───────────────────────────────────────────────────────────

function calculateFIRE(params: {
  monthlyIncome: number;
  monthlyExpense: number;
  currentPortfolio: number;
  annualReturn: number;  // decimal, e.g. 0.08
}): FIREResult | null {
  const { monthlyIncome, monthlyExpense, currentPortfolio, annualReturn } = params;

  if (monthlyIncome <= 0 || monthlyExpense <= 0) return null;

  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense);
  const savingsRate = (monthlySavings / monthlyIncome) * 100;
  const annualExpense = monthlyExpense * 12;
  const fireNumber = annualExpense * 25; // 4% safe withdrawal rate

  // Already FIRE?
  if (currentPortfolio >= fireNumber) {
    return {
      yearsToFIRE: 0, monthsToFIRE: 0,
      targetDate: "Agora!",
      fireNumber, currentNetWorth: currentPortfolio,
      monthlySavings, savingsRate, monthlyExpense,
      annualReturn: annualReturn * 100,
      progress: 100,
      accelerators: [],
      status: "achieved",
    };
  }

  // Calculate months to FIRE using future value formula
  // FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r = fireNumber
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;

  let months = 0;
  let portfolio = currentPortfolio;

  if (monthlySavings <= 0) {
    // Can't save = unreachable (unless portfolio grows enough)
    if (annualReturn > 0 && currentPortfolio > 0) {
      // How many months until portfolio alone reaches FIRE number?
      months = Math.ceil(Math.log(fireNumber / currentPortfolio) / Math.log(1 + monthlyReturn));
      if (months > 1200) { // > 100 years
        return {
          yearsToFIRE: 999, monthsToFIRE: 0,
          targetDate: "—",
          fireNumber, currentNetWorth: currentPortfolio,
          monthlySavings: 0, savingsRate: 0, monthlyExpense,
          annualReturn: annualReturn * 100,
          progress: (currentPortfolio / fireNumber) * 100,
          accelerators: buildAccelerators(monthlyIncome, monthlyExpense, currentPortfolio, annualReturn, months),
          status: "unreachable",
        };
      }
    } else {
      return {
        yearsToFIRE: 999, monthsToFIRE: 0,
        targetDate: "—",
        fireNumber, currentNetWorth: currentPortfolio,
        monthlySavings: 0, savingsRate: 0, monthlyExpense,
        annualReturn: annualReturn * 100,
        progress: (currentPortfolio / fireNumber) * 100,
        accelerators: buildAccelerators(monthlyIncome, monthlyExpense, currentPortfolio, annualReturn, 9999),
        status: "unreachable",
      };
    }
  } else {
    // Simulate month by month (handles compound returns + contributions)
    while (portfolio < fireNumber && months < 1200) {
      portfolio = portfolio * (1 + monthlyReturn) + monthlySavings;
      months++;
    }
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);
  const targetStr = targetDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  let status: FIREResult["status"];
  if (years <= 5) status = "close";
  else if (years <= 15) status = "on_track";
  else if (years <= 40) status = "long";
  else status = "unreachable";

  return {
    yearsToFIRE: years,
    monthsToFIRE: remainingMonths,
    targetDate: targetStr,
    fireNumber,
    currentNetWorth: currentPortfolio,
    monthlySavings,
    savingsRate,
    monthlyExpense,
    annualReturn: annualReturn * 100,
    progress: Math.min(100, (currentPortfolio / fireNumber) * 100),
    accelerators: buildAccelerators(monthlyIncome, monthlyExpense, currentPortfolio, annualReturn, months),
    status,
  };
}

function buildAccelerators(
  income: number, expense: number, portfolio: number,
  annualReturn: number, currentMonths: number
): Accelerator[] {
  const accs: Accelerator[] = [];
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const fireNumber = expense * 12 * 25;

  // 1. Save 10% more
  const extra10 = income * 0.10;
  const newSavings10 = Math.max(0, income - expense) + extra10;
  let m10 = 0;
  let p10 = portfolio;
  while (p10 < fireNumber && m10 < 1200) { p10 = p10 * (1 + monthlyReturn) + newSavings10; m10++; }
  const saved10 = Math.max(0, currentMonths - m10);
  if (saved10 > 6) {
    accs.push({
      label: "Poupe +10% da renda",
      emoji: "💰",
      yearsReduced: Math.round(saved10 / 12 * 10) / 10,
      description: `+${formatCurrency(extra10)}/mês acelera ${(saved10 / 12).toFixed(1)} anos`,
    });
  }

  // 2. Reduce expenses 15%
  const reducedExp = expense * 0.85;
  const newSavingsRed = Math.max(0, income - reducedExp);
  const fireReduced = reducedExp * 12 * 25; // lower FIRE number too!
  let mR = 0;
  let pR = portfolio;
  while (pR < fireReduced && mR < 1200) { pR = pR * (1 + monthlyReturn) + newSavingsRed; mR++; }
  const savedR = Math.max(0, currentMonths - mR);
  if (savedR > 6) {
    accs.push({
      label: "Reduza gastos 15%",
      emoji: "✂️",
      yearsReduced: Math.round(savedR / 12 * 10) / 10,
      description: `Duplo efeito: mais poupança + FIRE number menor`,
    });
  }

  // 3. Side income R$1000/month
  const sideIncome = 1000;
  const newSavingsSide = Math.max(0, income - expense) + sideIncome;
  let mS = 0;
  let pS = portfolio;
  while (pS < fireNumber && mS < 1200) { pS = pS * (1 + monthlyReturn) + newSavingsSide; mS++; }
  const savedS = Math.max(0, currentMonths - mS);
  if (savedS > 6) {
    accs.push({
      label: "Renda extra R$1.000/mês",
      emoji: "🔧",
      yearsReduced: Math.round(savedS / 12 * 10) / 10,
      description: `Freelance ou side project acelera ${(savedS / 12).toFixed(1)} anos`,
    });
  }

  return accs.sort((a, b) => b.yearsReduced - a.yearsReduced);
}

// ── Main Component ────────────────────────────────────────────────────────────

export const FIRECountdown = () => {
  const { totals } = useTransactions("personal");
  const { totals: investTotals } = useInvestments();

  const result = useMemo(() => {
    if (!totals || totals.income <= 0) return null;
    return calculateFIRE({
      monthlyIncome: totals.income,
      monthlyExpense: totals.expense,
      currentPortfolio: investTotals.currentValue + Math.max(0, totals.balance),
      annualReturn: 0.08, // 8% real return assumption
    });
  }, [totals, investTotals.currentValue]);

  if (!result) {
    return (
      <EmptyIntelligence
        icon={Flame}
        emoji="🔥"
        title="F.I.R.E. Countdown"
        description="Registre receitas e despesas para calcular quando você atinge independência financeira."
        compact
        color="#F59E0B"
      />
    );
  }

  const statusConfig = {
    achieved: { color: "#10B981", emoji: "🎉", label: "CONQUISTADO!" },
    close: { color: "#3B82F6", emoji: "🏁", label: "Quase lá" },
    on_track: { color: "#8B5CF6", emoji: "🚀", label: "No caminho" },
    long: { color: "#F59E0B", emoji: "🏃", label: "Longo prazo" },
    unreachable: { color: "#F43F5E", emoji: "⚠️", label: "Ajuste necessário" },
  };

  const sc = statusConfig[result.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#0F0A04] to-[#080504] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
          <Flame size={15} className="text-orange-400" />
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-orange-400">F.I.R.E. Countdown</div>
          <div className="text-[9px] text-white/30">Independência Financeira · Aposentadoria Antecipada</div>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="text-center py-2">
        {result.status === "achieved" ? (
          <div>
            <div className="text-4xl mb-1">🎉</div>
            <div className="text-[20px] font-black text-emerald-400">FIRE Conquistado!</div>
            <div className="text-[10px] text-white/30 mt-1">Seu patrimônio cobre 25x suas despesas anuais</div>
          </div>
        ) : result.status === "unreachable" ? (
          <div>
            <div className="text-4xl mb-1">⚠️</div>
            <div className="text-[16px] font-black text-rose-400">Taxa de poupança insuficiente</div>
            <div className="text-[10px] text-white/30 mt-1">Aumente receita ou reduza despesas para ativar o countdown</div>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[48px] font-black font-mono leading-none" style={{ color: sc.color }}>
                {result.yearsToFIRE}
              </span>
              <span className="text-[14px] font-bold text-white/30">anos</span>
              {result.monthsToFIRE > 0 && (
                <>
                  <span className="text-[28px] font-black font-mono leading-none" style={{ color: sc.color }}>
                    {result.monthsToFIRE}
                  </span>
                  <span className="text-[12px] font-bold text-white/30">meses</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-white/30">
              <Clock size={9} />
              <span>Previsão: {result.targetDate}</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Progresso FIRE</span>
          <span className="text-[10px] font-black font-mono" style={{ color: sc.color }}>
            {result.progress.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${sc.color}80, ${sc.color})` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-[8px] text-white/20">
          <span>{formatCurrency(result.currentNetWorth)}</span>
          <span>Meta: {formatCurrency(result.fireNumber)}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="text-[7px] font-bold uppercase tracking-widest text-white/20 mb-0.5">FIRE Number</div>
          <div className="text-[12px] font-black font-mono text-orange-400">{formatCurrency(result.fireNumber)}</div>
          <div className="text-[7px] text-white/15">25x despesas anuais</div>
        </div>
        <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="text-[7px] font-bold uppercase tracking-widest text-white/20 mb-0.5">Poupança</div>
          <div className={`text-[12px] font-black font-mono ${result.savingsRate >= 20 ? "text-emerald-400" : result.savingsRate >= 10 ? "text-amber-400" : "text-rose-400"}`}>
            {result.savingsRate.toFixed(0)}%
          </div>
          <div className="text-[7px] text-white/15">{formatCurrency(result.monthlySavings)}/mês</div>
        </div>
        <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.04] text-center">
          <div className="text-[7px] font-bold uppercase tracking-widest text-white/20 mb-0.5">Retorno</div>
          <div className="text-[12px] font-black font-mono text-blue-400">{result.annualReturn.toFixed(0)}% a.a.</div>
          <div className="text-[7px] text-white/15">retorno real estimado</div>
        </div>
      </div>

      {/* Accelerators */}
      {result.accelerators.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-white/20 px-1">
            <Zap size={8} className="text-amber-400" /> Aceleradores
          </div>
          {result.accelerators.map((acc, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-lg">{acc.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-white/70">{acc.label}</div>
                <div className="text-[8px] text-white/25">{acc.description}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[12px] font-black text-emerald-400 font-mono">
                  -{acc.yearsReduced}a
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Methodology */}
      <div className="flex items-center gap-1.5 px-2 text-[8px] text-white/15">
        <Calculator size={7} />
        <span>Regra 4% (Trinity Study) · Retorno real 8% a.a. · Simulação mensal composta</span>
      </div>
    </motion.div>
  );
};
