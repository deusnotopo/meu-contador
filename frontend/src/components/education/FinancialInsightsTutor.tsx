/**
 * FinancialInsightsTutor.tsx — Phase 30
 * ──────────────────────────────────────
 * Contextual financial tutor that generates personalized real-time
 * insights based on the user's actual financial data (transactions,
 * investments, debts, goals, budgets) and links each insight to a
 * relevant education lesson. Purely client-side computation.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronRight, Lightbulb, AlertTriangle, TrendingUp,
  Target, Shield, PiggyBank, CreditCard, Flame,
  ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useGoals } from "@/hooks/useGoals";
import { useBudgets } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/formatters";
import type { Currency } from "@/types";
import { useCurrency } from "@/context/CurrencyContext";

// ── Insight Type ──────────────────────────────────────────────────────────────

interface FinancialInsight {
  id: string;
  icon: React.ElementType;
  emoji: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical" | "positive";
  lessonHint: string;    // suggested lesson topic
  lessonId?: string;     // direct lesson id if known
  category: string;
}

const SEVERITY_COLORS = {
  info:     { bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.15)", text: "#818CF8", badge: "rgba(99,102,241,0.12)" },
  warning:  { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)", text: "#FBBF24", badge: "rgba(245,158,11,0.12)" },
  critical: { bg: "rgba(244,63,94,0.06)",  border: "rgba(244,63,94,0.15)",  text: "#FB7185", badge: "rgba(244,63,94,0.12)" },
  positive: { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.15)", text: "#34D399", badge: "rgba(16,185,129,0.12)" },
};

const SEVERITY_LABELS = {
  info: "Dica",
  warning: "Atenção",
  critical: "Urgente",
  positive: "Parabéns",
};

// ── Insight Engine ────────────────────────────────────────────────────────────

function generateInsights(params: {
  income: number;
  expense: number;
  topCategories: { name: string; value: number }[];
  totalInvested: number;
  totalInvestmentValue: number;
  investmentReturn: number;
  assetCount: number;
  stockPct: number;
  cryptoPct: number;
  fixedIncomePct: number;
  totalDebt: number;
  highestDebtRate: number;
  highestDebtName: string;
  goalCount: number;
  goalsBehindPace: number;
  savingsRate: number;
  budgetOverspend: number;
  emergencyFundMonths: number;
}): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // ── 1. Savings Rate ─────────────────────────────────────────────────────
  if (params.income > 0 && params.savingsRate < 10) {
    insights.push({
      id: "low_savings", icon: PiggyBank, emoji: "🐷",
      title: `Sua taxa de poupança é apenas ${params.savingsRate.toFixed(0)}%`,
      body: `Dos ${formatCurrency(params.income)} que entram, sobram ${formatCurrency(params.income - params.expense)}. O recomendado mínimo é 20%. Cada 1% a mais investido agora vale exponencialmente mais em 10 anos via juros compostos.`,
      severity: params.savingsRate < 5 ? "critical" : "warning",
      lessonHint: "Reserva de Emergência", lessonId: "br_reserva",
      category: "Poupança",
    });
  } else if (params.income > 0 && params.savingsRate >= 30) {
    insights.push({
      id: "great_savings", icon: TrendingUp, emoji: "🚀",
      title: `Taxa de poupança excepcional: ${params.savingsRate.toFixed(0)}%`,
      body: `Você está guardando ${formatCurrency(params.income - params.expense)}/mês. Com esse ritmo e juros compostos, ${formatCurrency((params.income - params.expense) * 12 * 0.12)} extras em 1 ano a 12% a.a.`,
      severity: "positive", lessonHint: "Juros Compostos",
      category: "Poupança",
    });
  }

  // ── 2. Debt vs Investment conflict ──────────────────────────────────────
  if (params.totalDebt > 0 && params.totalInvested > 0 && params.highestDebtRate > 1.5) {
    insights.push({
      id: "debt_vs_invest", icon: AlertTriangle, emoji: "⚠️",
      title: `Dívida a ${params.highestDebtRate.toFixed(1)}% a.m. + investimentos simultâneos`,
      body: `"${params.highestDebtName}" cobra ${params.highestDebtRate.toFixed(1)}% ao mês (${(Math.pow(1 + params.highestDebtRate/100, 12) * 100 - 100).toFixed(0)}% ao ano). Nenhum investimento rende isso. Matematicamente, quitar primeiro é mais rentável que investir com dívida cara.`,
      severity: "critical", lessonHint: "Priorização de Dívidas", lessonId: "br_dividas_prioridade",
      category: "Dívidas",
    });
  }

  // ── 3. Portfolio concentration ─────────────────────────────────────────
  if (params.assetCount > 0 && params.cryptoPct > 30) {
    insights.push({
      id: "high_crypto", icon: Shield, emoji: "₿",
      title: `${params.cryptoPct.toFixed(0)}% da carteira em crypto`,
      body: `Criptomoedas têm volatilidade anualizada de ~60%. Com ${params.cryptoPct.toFixed(0)}% de exposição, uma queda de 40% no mercado crypto significaria uma perda de ${(params.cryptoPct * 0.4).toFixed(0)}% do seu patrimônio total. Diversifique.`,
      severity: params.cryptoPct > 50 ? "critical" : "warning",
      lessonHint: "Diversificação", category: "Investimentos",
    });
  }

  if (params.assetCount > 0 && params.stockPct > 70) {
    insights.push({
      id: "high_stock", icon: Shield, emoji: "📊",
      title: `${params.stockPct.toFixed(0)}% concentrado em ações`,
      body: `Alta concentração em renda variável aumenta o drawdown potencial. Em 2020, o IBOV caiu 47% em semanas. Considere pelo menos 20-30% em renda fixa como amortecedor.`,
      severity: "warning", lessonHint: "Renda Fixa e CDI",
      category: "Investimentos",
    });
  }

  if (params.assetCount > 0 && params.fixedIncomePct > 80) {
    insights.push({
      id: "too_conservative", icon: TrendingUp, emoji: "🏦",
      title: `${params.fixedIncomePct.toFixed(0)}% em renda fixa — potencial sub-utilizado`,
      body: `Renda fixa é segura, mas historicamente rende 2-4% acima da inflação. Uma pequena exposição a FIIs ou ETFs pode aumentar o rendimento real sem risco excessivo.`,
      severity: "info", lessonHint: "Introdução a Investimentos",
      category: "Investimentos",
    });
  }

  // ── 4. Investment performance ──────────────────────────────────────────
  if (params.totalInvested > 0 && params.investmentReturn < 0) {
    insights.push({
      id: "negative_return", icon: AlertTriangle, emoji: "📉",
      title: `Carteira no vermelho: ${params.investmentReturn.toFixed(1)}%`,
      body: `Seu patrimônio investido vale ${formatCurrency(params.totalInvestmentValue)} mas custou ${formatCurrency(params.totalInvested)}. Perdas fazem parte, mas verifique se os fundamentos dos ativos mudaram ou se é hora de rebalancear.`,
      severity: "warning", lessonHint: "Análise de Carteira",
      category: "Investimentos",
    });
  }

  // ── 5. Emergency fund ──────────────────────────────────────────────────
  if (params.emergencyFundMonths < 3 && params.income > 0) {
    insights.push({
      id: "no_emergency", icon: Shield, emoji: "🛡️",
      title: `Reserva de emergência: apenas ${params.emergencyFundMonths.toFixed(1)} meses`,
      body: `O recomendado é 6-12 meses de despesas guardados em liquidez. Você tem cobertura para ${params.emergencyFundMonths.toFixed(1)} meses. Qualquer imprevisto médico ou perda de renda pode virar uma espiral de dívidas sem essa base.`,
      severity: params.emergencyFundMonths < 1 ? "critical" : "warning",
      lessonHint: "Reserva de Emergência", lessonId: "br_reserva",
      category: "Proteção",
    });
  }

  // ── 6. Budget overspend ────────────────────────────────────────────────
  if (params.budgetOverspend > 0) {
    insights.push({
      id: "budget_overspend", icon: CreditCard, emoji: "💸",
      title: `${params.budgetOverspend} orçamento${params.budgetOverspend > 1 ? "s" : ""} estourado${params.budgetOverspend > 1 ? "s" : ""}`,
      body: `Você ultrapassou o limite em ${params.budgetOverspend} categoria${params.budgetOverspend > 1 ? "s" : ""}. Estourar orçamentos consistentemente é um sinal de que os limites precisam ser recalibrados ou os hábitos de gasto revistos.`,
      severity: params.budgetOverspend > 3 ? "critical" : "warning",
      lessonHint: "Controle de Orçamento",
      category: "Orçamento",
    });
  }

  // ── 7. Goals at risk ───────────────────────────────────────────────────
  if (params.goalsBehindPace > 0) {
    insights.push({
      id: "goals_behind", icon: Target, emoji: "🎯",
      title: `${params.goalsBehindPace} meta${params.goalsBehindPace > 1 ? "s" : ""} em risco de atraso`,
      body: `Pelo ritmo atual de poupança, ${params.goalsBehindPace} meta${params.goalsBehindPace > 1 ? "s" : ""} pode${params.goalsBehindPace > 1 ? "m" : ""} não ser atingida${params.goalsBehindPace > 1 ? "s" : ""} no prazo. Use o Simulador de Aceleração (tab Metas) para recalcular.`,
      severity: "warning", lessonHint: "Planejamento de Metas",
      category: "Metas",
    });
  }

  // ── 8. Top spending category ───────────────────────────────────────────
  if (params.topCategories.length > 0 && params.income > 0) {
    const top = params.topCategories[0]!;
    const pct = (top.value / params.income) * 100;
    if (pct > 30) {
      insights.push({
        id: "top_spending", icon: Flame, emoji: "🔥",
        title: `${top.name}: ${pct.toFixed(0)}% da sua renda`,
        body: `A categoria "${top.name}" consome ${formatCurrency(top.value)}/mês — mais de 30% da renda. Micro-reduções de 10% nessa categoria economizariam ${formatCurrency(top.value * 0.1)}/mês → ${formatCurrency(top.value * 0.1 * 12)}/ano.`,
        severity: pct > 50 ? "critical" : "warning",
        lessonHint: "Custo Oculto de Hábitos",
        category: "Gastos",
      });
    }
  }

  // ── 9. Positive: fully funded goals ────────────────────────────────────
  if (params.goalCount > 0 && params.goalsBehindPace === 0) {
    insights.push({
      id: "goals_on_track", icon: Target, emoji: "✅",
      title: "Todas as metas no ritmo!",
      body: `Suas ${params.goalCount} meta${params.goalCount > 1 ? "s" : ""} est${params.goalCount > 1 ? "ão" : "á"} dentro do prazo. Continue o ritmo atual e considere criar novas metas mais ambiciosas.`,
      severity: "positive", lessonHint: "Metas Avançadas",
      category: "Metas",
    });
  }

  // Sort: critical → warning → info → positive
  const order = { critical: 0, warning: 1, info: 2, positive: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ── Insight Card ──────────────────────────────────────────────────────────────

const InsightCard = ({
  insight, onOpenLesson
}: { insight: FinancialInsight; onOpenLesson?: (id: string) => void }) => {
  const colors = SEVERITY_COLORS[insight.severity];
  const Icon = insight.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 border transition-all hover:translate-y-[-1px]"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: colors.badge, border: `1px solid ${colors.border}` }}>
          <Icon size={14} style={{ color: colors.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ color: colors.text, backgroundColor: colors.badge }}>
              {SEVERITY_LABELS[insight.severity]}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">{insight.category}</span>
          </div>
          <div className="text-[12px] font-black text-white/90 mb-1.5">{insight.title}</div>
          <div className="text-[10px] text-white/45 leading-relaxed">{insight.body}</div>
          {insight.lessonId && onOpenLesson && (
            <button
              onClick={() => onOpenLesson(insight.lessonId!)}
              className="mt-2.5 flex items-center gap-1, text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80"
              style={{ color: colors.text }}
            >
              <Lightbulb size={9} />
              <span className="ml-1">Aprender: {insight.lessonHint}</span>
              <ChevronRight size={9} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const FinancialInsightsTutor = ({
  onOpenLesson
}: { onOpenLesson?: (lessonId: string) => void }) => {
  const { totals: personalTotals, transactions: personalTx } = useTransactions("personal");
  const { assets } = useInvestments();
  const { debts } = useDebts();
  const { goals } = useGoals();
  const { budgets } = useBudgets();
  const currencyCtx = useCurrency();
  const convert = currencyCtx?.convert || ((v: number) => v);

  const [expanded, setExpanded] = useState(true);

  const insights = useMemo(() => {
    const income  = personalTotals?.income ?? 0;
    const expense = personalTotals?.expense ?? 0;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Top categories from expenses
    const catMap: Record<string, number> = {};
    personalTx.filter(t => t.type === "expense").forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCategories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Investment aggregates
    const totalInvested = assets.reduce(
      (s, a) => s + convert(a.amount * a.averagePrice, (a.currency || "BRL") as Currency, "BRL"), 0
    );
    const totalInvestmentValue = assets.reduce(
      (s, a) => s + convert(a.amount * a.currentPrice, (a.currency || "BRL") as Currency, "BRL"), 0
    );
    const investmentReturn = totalInvested > 0 ? ((totalInvestmentValue - totalInvested) / totalInvested) * 100 : 0;

    // Portfolio composition
    const byType: Record<string, number> = {};
    assets.forEach(a => {
      const val = convert(a.amount * a.currentPrice, (a.currency || "BRL") as Currency, "BRL");
      byType[a.type] = (byType[a.type] || 0) + val;
    });
    const stockPct  = totalInvestmentValue > 0 ? ((byType.stock || 0) / totalInvestmentValue) * 100 : 0;
    const cryptoPct = totalInvestmentValue > 0 ? ((byType.crypto || 0) / totalInvestmentValue) * 100 : 0;
    const fixedIncomePct = totalInvestmentValue > 0 ? ((byType.fixed_income || 0) / totalInvestmentValue) * 100 : 0;

    // Debts
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    const highestRateDebt = debts.reduce((worst, d) => d.interestRate > (worst?.interestRate || 0) ? d : worst, debts[0]);

    // Goals at risk (simplified: check if monthly savings covers required pace)
    const monthlySavings = Math.max(0, income - expense);
    const goalsBehindPace = goals.filter(g => {
      if (g.currentAmount >= g.targetAmount) return false;
      const remaining = g.targetAmount - g.currentAmount;
      const deadlineMs = g.deadline ? new Date(g.deadline).getTime() - Date.now() : null;
      if (!deadlineMs || deadlineMs <= 0) return true; // overdue
      const monthsLeft = deadlineMs / (1000 * 60 * 60 * 24 * 30);
      const required = remaining / monthsLeft;
      const perGoalMonthly = monthlySavings / Math.max(1, goals.length);
      return perGoalMonthly < required;
    }).length;

    // Budget overspend
    const budgetOverspend = budgets.filter(b => b.spent > b.limit).length;

    // Emergency fund estimate
    const monthlyExpense = expense || 1;
    const liquidAssets = (byType.fixed_income || 0); // simplified
    const emergencyFundMonths = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 0;

    return generateInsights({
      income, expense, topCategories,
      totalInvested, totalInvestmentValue, investmentReturn,
      assetCount: assets.length, stockPct, cryptoPct, fixedIncomePct,
      totalDebt,
      highestDebtRate: highestRateDebt?.interestRate ?? 0,
      highestDebtName: highestRateDebt?.name ?? "",
      goalCount: goals.length, goalsBehindPace,
      savingsRate, budgetOverspend, emergencyFundMonths,
    });
  }, [personalTotals, personalTx, assets, debts, goals, budgets, convert]);

  if (insights.length === 0) return null;

  const criticalCount = insights.filter(i => i.severity === "critical").length;
  const warningCount  = insights.filter(i => i.severity === "warning").length;

  return (
    <div className="col-span-6 rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-[#0A0E1A] to-[#060912] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center relative">
            <Brain size={15} className="text-indigo-400" />
            {criticalCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">{criticalCount}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">AI Financial Tutor</span>
              <Sparkles size={10} className="text-indigo-400/50" />
            </div>
            <div className="text-[9px] text-white/30 font-medium">
              {insights.length} insight{insights.length > 1 ? "s" : ""} baseado{insights.length > 1 ? "s" : ""} nos seus dados reais
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {criticalCount} urgente{criticalCount > 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {warningCount} atenção
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-3">
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} onOpenLesson={onOpenLesson} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
