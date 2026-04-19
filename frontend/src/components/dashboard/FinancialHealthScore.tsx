/**
 * FinancialHealthScore.tsx — Phase 40
 * ─────────────────────────────────────
 * Single composite score (0-1000) measuring overall financial health.
 * Like a credit score but for your entire financial life.
 * Components: Savings Rate, Debt Ratio, Emergency Fund, Investment,
 * Spending Control, Income Stability.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Heart, Shield, Wallet, TrendingUp,
  PiggyBank, Activity
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScorePillar {
  id: string;
  label: string;
  icon: React.ElementType;
  score: number;       // 0-100
  weight: number;      // contribution weight
  color: string;
  status: string;
  tip: string;
}

interface HealthResult {
  totalScore: number;  // 0-1000
  grade: string;       // A+ to F
  gradeColor: string;
  pillars: ScorePillar[];
  trend: "improving" | "stable" | "declining";
  headline: string;
}

// ── Scoring Engine ────────────────────────────────────────────────────────────

function calculateHealthScore(params: {
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
  totalInvested: number;
  totalDebt: number;
  debtMinPayment: number;
  recurringTotal: number;
  monthlyVolatility: number; // CV of monthly income
  categoryCount: number;
}): HealthResult {
  const p = params;
  const pillars: ScorePillar[] = [];

  // 1. SAVINGS RATE (weight 25%)
  const savingsRate = p.monthlyIncome > 0
    ? ((p.monthlyIncome - p.monthlyExpense) / p.monthlyIncome) * 100
    : 0;
  let savingsScore = 0;
  if (savingsRate >= 30) savingsScore = 100;
  else if (savingsRate >= 20) savingsScore = 80;
  else if (savingsRate >= 10) savingsScore = 60;
  else if (savingsRate >= 5) savingsScore = 40;
  else if (savingsRate > 0) savingsScore = 20;
  else savingsScore = 0;

  pillars.push({
    id: "savings", label: "Taxa de Poupança", icon: PiggyBank,
    score: savingsScore, weight: 25, color: "#10B981",
    status: savingsRate >= 20 ? "Excelente" : savingsRate >= 10 ? "Bom" : savingsRate > 0 ? "Baixo" : "Zero",
    tip: savingsRate < 20
      ? `Meta: poupar pelo menos 20% da renda (${formatCurrency(p.monthlyIncome * 0.2)}/mês)`
      : "Continue mantendo sua disciplina de poupança!",
  });

  // 2. DEBT RATIO (weight 20%)
  const debtToIncome = p.monthlyIncome > 0
    ? (p.debtMinPayment / p.monthlyIncome) * 100
    : (p.totalDebt > 0 ? 100 : 0);
  let debtScore = 100;
  if (debtToIncome > 50) debtScore = 0;
  else if (debtToIncome > 35) debtScore = 20;
  else if (debtToIncome > 20) debtScore = 50;
  else if (debtToIncome > 10) debtScore = 70;
  else if (debtToIncome > 0) debtScore = 85;

  pillars.push({
    id: "debt", label: "Controle de Dívidas", icon: Shield,
    score: debtScore, weight: 20, color: "#3B82F6",
    status: debtToIncome === 0 ? "Livre" : debtToIncome < 20 ? "Controlado" : debtToIncome < 35 ? "Atenção" : "Crítico",
    tip: debtToIncome > 20
      ? `Dívidas consomem ${debtToIncome.toFixed(0)}% da renda. Meta: abaixo de 20%`
      : debtToIncome > 0 ? "Dívidas sob controle. Priorize quitar as de juros altos." : "Zero dívidas — excelente!",
  });

  // 3. EMERGENCY FUND (weight 20%)
  const monthsCovered = p.monthlyExpense > 0
    ? (p.balance + p.totalInvested * 0.3) / p.monthlyExpense // 30% of investments as liquid
    : 0;
  let emergencyScore = 0;
  if (monthsCovered >= 12) emergencyScore = 100;
  else if (monthsCovered >= 6) emergencyScore = 80;
  else if (monthsCovered >= 3) emergencyScore = 55;
  else if (monthsCovered >= 1) emergencyScore = 30;
  else emergencyScore = 5;

  pillars.push({
    id: "emergency", label: "Reserva de Emergência", icon: Wallet,
    score: emergencyScore, weight: 20, color: "#8B5CF6",
    status: monthsCovered >= 6 ? "Seguro" : monthsCovered >= 3 ? "Mínimo" : "Insuficiente",
    tip: monthsCovered < 6
      ? `Você tem ${monthsCovered.toFixed(1)} meses de reserva. Meta: 6 meses (${formatCurrency(p.monthlyExpense * 6)})`
      : `${monthsCovered.toFixed(1)} meses de cobertura — acima do recomendado!`,
  });

  // 4. INVESTMENT (weight 15%)
  const investRatio = p.monthlyIncome > 0
    ? (p.totalInvested / (p.monthlyIncome * 12)) * 100
    : 0;
  let investScore = 0;
  if (investRatio >= 200) investScore = 100; // 2+ years income invested
  else if (investRatio >= 100) investScore = 80;
  else if (investRatio >= 50) investScore = 60;
  else if (investRatio >= 20) investScore = 40;
  else if (investRatio > 0) investScore = 20;

  pillars.push({
    id: "invest", label: "Investimentos", icon: TrendingUp,
    score: investScore, weight: 15, color: "#F59E0B",
    status: investRatio >= 100 ? "Sólido" : investRatio >= 50 ? "Crescendo" : investRatio > 0 ? "Iniciando" : "Ausente",
    tip: investRatio < 50
      ? "Aumente contribuições mensais. Consistência supera timing."
      : "Portfólio crescendo. Foque em diversificação.",
  });

  // 5. SPENDING CONTROL (weight 10%)
  const recurringPct = p.monthlyExpense > 0 ? (p.recurringTotal / p.monthlyExpense) * 100 : 0;
  const controlScore = Math.min(100, Math.round(
    (recurringPct > 70 ? 30 : recurringPct > 50 ? 60 : 80) +
    (p.categoryCount > 3 && p.categoryCount < 10 ? 20 : 10)
  ));

  pillars.push({
    id: "control", label: "Controle de Gastos", icon: Activity,
    score: controlScore, weight: 10, color: "#EC4899",
    status: controlScore >= 70 ? "Organizado" : controlScore >= 40 ? "Regular" : "Desorganizado",
    tip: recurringPct > 60
      ? "Gastos fixos muito altos. Renegocie assinaturas e contratos."
      : "Boa distribuição entre fixo e variável.",
  });

  // 6. INCOME STABILITY (weight 10%)
  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - p.monthlyVolatility * 2)));

  pillars.push({
    id: "stability", label: "Estabilidade de Renda", icon: Heart,
    score: stabilityScore, weight: 10, color: "#06B6D4",
    status: stabilityScore >= 70 ? "Estável" : stabilityScore >= 40 ? "Variável" : "Instável",
    tip: stabilityScore < 70
      ? "Alta variação na renda. Mantenha reserva maior e diversifique fontes."
      : "Renda previsível — facilita planejamento.",
  });

  // TOTAL SCORE (weighted)
  const totalScore = Math.round(
    pillars.reduce((sum, p) => sum + (p.score * p.weight) / 100, 0) * 10
  );

  // Grade
  let grade: string;
  let gradeColor: string;
  if (totalScore >= 900) { grade = "A+"; gradeColor = "#10B981"; }
  else if (totalScore >= 800) { grade = "A"; gradeColor = "#10B981"; }
  else if (totalScore >= 700) { grade = "B+"; gradeColor = "#3B82F6"; }
  else if (totalScore >= 600) { grade = "B"; gradeColor = "#3B82F6"; }
  else if (totalScore >= 500) { grade = "C+"; gradeColor = "#F59E0B"; }
  else if (totalScore >= 400) { grade = "C"; gradeColor = "#F59E0B"; }
  else if (totalScore >= 300) { grade = "D"; gradeColor = "#F97316"; }
  else { grade = "F"; gradeColor = "#F43F5E"; }

  // Headline
  let headline: string;
  if (totalScore >= 800) headline = "Saúde financeira excepcional. Você está no top 5%.";
  else if (totalScore >= 600) headline = "Boa saúde financeira. Foque nos pilares mais fracos.";
  else if (totalScore >= 400) headline = "Saúde financeira regular. Priorize poupança e reduza dívidas.";
  else headline = "Saúde financeira preocupante. Comece pela reserva de emergência.";

  return {
    totalScore,
    grade,
    gradeColor,
    pillars: pillars.sort((a, b) => a.score - b.score), // weakest first
    trend: "stable",
    headline,
  };
}

// ── Score Ring ─────────────────────────────────────────────────────────────────

const ScoreRing = ({ score, grade, gradeColor }: { score: number; grade: string; gradeColor: string }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = score / 1000;
  const offset = circ * (1 - pct);

  return (
    <div className="relative w-[140px] h-[140px] mx-auto">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="health-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradeColor} />
            <stop offset="100%" stopColor={gradeColor} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <motion.circle
          cx="70" cy="70" r={r} fill="none" stroke="url(#health-grad)" strokeWidth="8"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "easeOut" }}
          transform="rotate(-90 70 70)" strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[32px] font-black font-mono leading-none" style={{ color: gradeColor }}>
          {score}
        </div>
        <div className="text-[10px] text-white/25 font-bold mt-0.5">/1000</div>
        <div className="text-[16px] font-black mt-1" style={{ color: gradeColor }}>{grade}</div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const FinancialHealthScore = () => {
  const { totals, allTransactions: transactions, monthlyTrend } = useTransactions("personal");
  const { totals: investTotals } = useInvestments();
  const { totals: debtTotals } = useDebts();
  const { summary: recurringSummary } = useRecurringExpenses();

  const result = useMemo(() => {
    if (!totals || (totals.income === 0 && totals.expense === 0)) return null;

    // Monthly volatility
    const monthlyIncomes = monthlyTrend.map(m => m.receitas);
    const avgIncome = monthlyIncomes.length > 0
      ? monthlyIncomes.reduce((s, v) => s + v, 0) / monthlyIncomes.length : 0;
    const variance = monthlyIncomes.reduce((s, v) => s + Math.pow(v - avgIncome, 2), 0) / Math.max(1, monthlyIncomes.length);
    const cv = avgIncome > 0 ? (Math.sqrt(variance) / avgIncome) * 100 : 0;

    // Category count
    const cats = new Set(transactions.filter(t => t.type === "expense").map(t => t.category));

    return calculateHealthScore({
      monthlyIncome: totals.income,
      monthlyExpense: totals.expense,
      balance: Math.max(0, totals.balance),
      totalInvested: investTotals.currentValue,
      totalDebt: debtTotals.totalBalance,
      debtMinPayment: debtTotals.totalMinPayment,
      recurringTotal: recurringSummary.totalMonthly,
      monthlyVolatility: cv,
      categoryCount: cats.size,
    });
  }, [totals, transactions, monthlyTrend, investTotals, debtTotals, recurringSummary.totalMonthly]);

  if (!result) {
    return (
      <EmptyIntelligence
        icon={Heart}
        emoji="💚"
        title="Score de Saúde Financeira"
        description="Registre transações para calcular seu score de 0 a 1000."
        compact
        color="#10B981"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#040F0A] to-[#030808] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
          <Heart size={15} className="text-emerald-400" />
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Score de Saúde Financeira</div>
          <div className="text-[9px] text-white/30">6 pilares · Atualizado com seus dados reais</div>
        </div>
      </div>

      {/* Score Ring */}
      <ScoreRing score={result.totalScore} grade={result.grade} gradeColor={result.gradeColor} />

      {/* Headline */}
      <div className="text-center text-[11px] text-white/40 font-medium leading-relaxed px-4">
        {result.headline}
      </div>

      {/* Pillars */}
      <div className="space-y-2">
        <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 px-1">
          Pilares (do mais fraco ao mais forte)
        </div>
        {result.pillars.map(pillar => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.id} className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon size={11} style={{ color: pillar.color }} />
                  <span className="text-[10px] font-bold text-white/60">{pillar.label}</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}>
                    {pillar.status}
                  </span>
                </div>
                <span className="text-[12px] font-black font-mono" style={{ color: pillar.color }}>
                  {pillar.score}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pillar.score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: pillar.color }}
                />
              </div>
              <div className="text-[8px] text-white/25 leading-relaxed">{pillar.tip}</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
