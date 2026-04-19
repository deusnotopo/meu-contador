/**
 * SpendingPersonality.tsx — Phase 38
 * ────────────────────────────────────
 * Financial behavioral archetype engine.
 * Classifies user into one of 8 archetypes based on real
 * spending patterns, savings rate, investment behavior,
 * and debt management. Like MBTI but for money.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Fingerprint, TrendingUp, Shield, Sparkles } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Archetypes ────────────────────────────────────────────────────────────────

interface Archetype {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  risks: string[];
  color: string;
  gradient: string;
}

const ARCHETYPES: Archetype[] = [
  {
    id: "builder", name: "Construtor", emoji: "🏗️",
    tagline: "Patrimônio é o jogo",
    description: "Alta taxa de poupança, investimentos ativos, dívidas controladas. Você prioriza acumulação de longo prazo acima de gratificação imediata.",
    strengths: ["Disciplina financeira excepcional", "Foco em patrimônio", "Bom uso de juros compostos"],
    risks: ["Pode sacrificar qualidade de vida", "Burnout financeiro", "Rigidez excessiva"],
    color: "#10B981", gradient: "from-emerald-500/10 to-emerald-900/5",
  },
  {
    id: "optimizer", name: "Otimizador", emoji: "⚙️",
    tagline: "Cada centavo tem propósito",
    description: "Orçamento bem estruturado, gastos intencionais, busca pelo melhor custo-benefício em tudo. Você maximiza valor por real gasto.",
    strengths: ["Eficiência de gastos", "Pesquisa antes de comprar", "Controle de recorrentes"],
    risks: ["Analysis paralysis", "Pode perder oportunidades por ser conservador demais"],
    color: "#3B82F6", gradient: "from-blue-500/10 to-blue-900/5",
  },
  {
    id: "explorer", name: "Explorador", emoji: "🧭",
    tagline: "Experiências acima de coisas",
    description: "Gastos concentrados em viagens, lazer e experiências. Poupança moderada mas investimento em qualidade de vida.",
    strengths: ["Equilíbrio vida/dinheiro", "Investimento em memórias", "Flexibilidade"],
    risks: ["Poupança inconsistente", "Gastos impulsivos em 'oportunidades'", "Reserva frágil"],
    color: "#8B5CF6", gradient: "from-purple-500/10 to-purple-900/5",
  },
  {
    id: "guardian", name: "Guardião", emoji: "🛡️",
    tagline: "Segurança em primeiro lugar",
    description: "Reserva de emergência robusta, seguros em dia, aversão a dívidas. Você só gasta quando se sente completamente seguro.",
    strengths: ["Reserva sólida", "Resiliência a crises", "Zero dívidas tóxicas"],
    risks: ["Retorno sub-ótimo por excesso de conservadorismo", "Pode perder para a inflação"],
    color: "#06B6D4", gradient: "from-cyan-500/10 to-cyan-900/5",
  },
  {
    id: "sprinter", name: "Sprinter", emoji: "🚀",
    tagline: "Vive intensamente",
    description: "Gastos altos relativos à renda, alta rotatividade de dinheiro, pouca reserva. Você vive no presente com alta intensidade.",
    strengths: ["Qualidade de vida imediata", "Networking social", "Flexibilidade de estilo"],
    risks: ["Vulnerabilidade a imprevistos", "Ciclos de abundância/escassez", "Dívidas potenciais"],
    color: "#F59E0B", gradient: "from-amber-500/10 to-amber-900/5",
  },
  {
    id: "warrior", name: "Guerreiro", emoji: "⚔️",
    tagline: "Lutando para sair do vermelho",
    description: "Dívidas significativas com esforço ativo de quitação. Você está numa batalha financeira e cada mês é uma conquista.",
    strengths: ["Resiliência", "Consciência do problema", "Disciplina crescente"],
    risks: ["Fadiga emocional", "Recaída em dívidas", "Uso de crédito emergencial"],
    color: "#F43F5E", gradient: "from-rose-500/10 to-rose-900/5",
  },
  {
    id: "investor", name: "Investidor", emoji: "📈",
    tagline: "Dinheiro trabalhando por você",
    description: "Carteira de investimentos diversificada, foco em renda passiva, reinvestimento de dividendos. Você está construindo a máquina.",
    strengths: ["Diversificação", "Pensamento de longo prazo", "Renda passiva crescente"],
    risks: ["Over-trading", "Concentração excessiva em um tipo", "Negligenciar gastos do presente"],
    color: "#84CC16", gradient: "from-lime-500/10 to-lime-900/5",
  },
  {
    id: "minimalist", name: "Minimalista", emoji: "🍃",
    tagline: "Menos é mais",
    description: "Poucos gastos, poucas categorias, alta taxa de poupança passiva. Você naturalmente gasta pouco porque não quer muito.",
    strengths: ["Baixa necessidade material", "Alta margem de poupança", "Liberdade financeira natural"],
    risks: ["Pode sub-investir em saúde/educação", "Sacrifício desnecessário"],
    color: "#22C55E", gradient: "from-green-500/10 to-green-900/5",
  },
];

// ── Classification Engine ─────────────────────────────────────────────────────

function classifyPersonality(params: {
  savingsRate: number;
  expenseCategories: number;
  topCategoryPct: number;
  hasInvestments: boolean;
  investmentDiversity: number;
  debtToIncome: number;
  isPayingDebt: boolean;
  recurringPct: number;
  weekendPremium: number;
  experiencePct: number; // % spent on travel/leisure/restaurants
}): { primary: Archetype; secondary: Archetype | null; scores: { archetype: Archetype; score: number }[] } {
  const scores = ARCHETYPES.map(arch => {
    let score = 0;
    const p = params;

    switch (arch.id) {
      case "builder":
        if (p.savingsRate > 25) score += 30;
        else if (p.savingsRate > 15) score += 15;
        if (p.hasInvestments) score += 20;
        if (p.debtToIncome < 0.1) score += 15;
        if (p.investmentDiversity >= 3) score += 10;
        break;
      case "optimizer":
        if (p.recurringPct > 40) score += 20; // lots of planned recurring
        if (p.savingsRate > 10 && p.savingsRate < 30) score += 15;
        if (p.expenseCategories > 6) score += 10;
        if (p.weekendPremium < 10) score += 15; // disciplined weekends
        break;
      case "explorer":
        if (p.experiencePct > 20) score += 30;
        if (p.weekendPremium > 20) score += 15;
        if (p.savingsRate > 5 && p.savingsRate < 20) score += 10;
        break;
      case "guardian":
        if (p.savingsRate > 20) score += 15;
        if (p.debtToIncome < 0.05) score += 25;
        if (p.recurringPct > 50) score += 10; // predictable spending
        if (!p.hasInvestments || p.investmentDiversity < 2) score += 10; // conservative
        break;
      case "sprinter":
        if (p.savingsRate < 5) score += 25;
        if (p.weekendPremium > 30) score += 20;
        if (p.topCategoryPct > 30) score += 10;
        break;
      case "warrior":
        if (p.debtToIncome > 0.3) score += 30;
        if (p.isPayingDebt) score += 20;
        if (p.savingsRate < 10) score += 10;
        break;
      case "investor":
        if (p.hasInvestments && p.investmentDiversity >= 3) score += 30;
        if (p.savingsRate > 15) score += 15;
        if (p.debtToIncome < 0.15) score += 10;
        break;
      case "minimalist":
        if (p.expenseCategories <= 5) score += 20;
        if (p.savingsRate > 30) score += 20;
        if (p.recurringPct < 30) score += 10;
        if (p.topCategoryPct < 25) score += 10;
        break;
    }

    return { archetype: arch, score };
  }).sort((a, b) => b.score - a.score);

  return {
    primary: scores[0]!.archetype,
    secondary: scores[1]!.score > 15 ? scores[1]!.archetype : null,
    scores,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

export const SpendingPersonality = () => {
  const { totals, allTransactions: transactions } = useTransactions("personal");
  const { assets } = useInvestments();
  const { totals: debtTotals, debts } = useDebts();
  const { summary: recurringSummary } = useRecurringExpenses();

  const result = useMemo(() => {
    const income = totals?.income ?? 0;
    const expense = totals?.expense ?? 0;
    if (income === 0 && expense === 0) return null;

    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Count unique expense categories
    const cats = new Set(transactions.filter(t => t.type === "expense").map(t => t.category));

    // Top category %
    const catTotals: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const topCatAmt = Math.max(...Object.values(catTotals), 0);
    const topCategoryPct = expense > 0 ? (topCatAmt / expense) * 100 : 0;

    // Experience spending (travel + leisure + restaurants)
    const expKeywords = ["viagem", "lazer", "restaurante", "cinema", "bar", "delivery", "entretenimento", "hobby"];
    const expTotal = transactions
      .filter(t => t.type === "expense" && expKeywords.some(k => (t.category + t.description).toLowerCase().includes(k)))
      .reduce((s, t) => s + t.amount, 0);
    const experiencePct = expense > 0 ? (expTotal / expense) * 100 : 0;

    // Weekend premium (simplified)
    const weekdayExp = transactions
      .filter(t => t.type === "expense" && [1,2,3,4,5].includes(new Date(t.date).getDay()))
      .reduce((s, t) => s + t.amount, 0);
    const weekendExp = transactions
      .filter(t => t.type === "expense" && [0,6].includes(new Date(t.date).getDay()))
      .reduce((s, t) => s + t.amount, 0);
    const wdCount = transactions.filter(t => t.type === "expense" && [1,2,3,4,5].includes(new Date(t.date).getDay())).length || 1;
    const weCount = transactions.filter(t => t.type === "expense" && [0,6].includes(new Date(t.date).getDay())).length || 1;
    const avgWD = weekdayExp / wdCount;
    const avgWE = weekendExp / weCount;
    const weekendPremium = avgWD > 0 ? ((avgWE - avgWD) / avgWD) * 100 : 0;

    // Investment diversity
    const investTypes = new Set(assets.filter(a => a.amount > 0).map(a => a.type));

    // Is paying debt
    const isPayingDebt = debts.length > 0 && debts.some(d => d.balance > 0);

    return classifyPersonality({
      savingsRate,
      expenseCategories: cats.size,
      topCategoryPct,
      hasInvestments: assets.length > 0,
      investmentDiversity: investTypes.size,
      debtToIncome: income > 0 ? (debtTotals.totalBalance / (income * 12)) : 0,
      isPayingDebt,
      recurringPct: expense > 0 ? (recurringSummary.totalMonthly / expense) * 100 : 0,
      weekendPremium,
      experiencePct,
    });
  }, [totals, transactions, assets, debtTotals, debts, recurringSummary.totalMonthly]);

  if (!result) {
    return (
      <EmptyIntelligence
        icon={Fingerprint}
        emoji="🧬"
        title="Perfil Financeiro"
        description="Registre transações para descobrir seu arquétipo comportamental financeiro."
        compact
        color="#8B5CF6"
      />
    );
  }

  const { primary, secondary, scores } = result;
  const topScores = scores.slice(0, 4);
  const maxScore = topScores[0]?.score ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b ${primary.gradient} overflow-hidden p-5 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center border"
          style={{ backgroundColor: `${primary.color}15`, borderColor: `${primary.color}30` }}>
          <Fingerprint size={15} style={{ color: primary.color }} />
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: primary.color }}>
            Seu Perfil Financeiro
          </div>
          <div className="text-[9px] text-white/30">Baseado em padrões reais de comportamento</div>
        </div>
      </div>

      {/* Primary Archetype */}
      <div className="rounded-2xl p-5 border text-center"
        style={{ backgroundColor: `${primary.color}08`, borderColor: `${primary.color}20` }}>
        <div className="text-4xl mb-2">{primary.emoji}</div>
        <div className="text-[18px] font-black mb-0.5" style={{ color: primary.color }}>
          {primary.name}
        </div>
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
          "{primary.tagline}"
        </div>
        <div className="text-[11px] text-white/50 leading-relaxed max-w-md mx-auto">
          {primary.description}
        </div>
      </div>

      {/* Strengths & Risks */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp size={9} className="text-emerald-400" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Forças</span>
          </div>
          {primary.strengths.map((s, i) => (
            <div key={i} className="text-[9px] text-emerald-400/70 leading-relaxed mb-1 flex items-start gap-1.5">
              <span className="text-emerald-400/40 mt-px">✓</span> {s}
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-1 mb-2">
            <Shield size={9} className="text-amber-400" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Riscos</span>
          </div>
          {primary.risks.map((r, i) => (
            <div key={i} className="text-[9px] text-amber-400/70 leading-relaxed mb-1 flex items-start gap-1.5">
              <span className="text-amber-400/40 mt-px">⚠</span> {r}
            </div>
          ))}
        </div>
      </div>

      {/* Secondary */}
      {secondary && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <span className="text-xl">{secondary.emoji}</span>
          <div>
            <div className="text-[10px] font-bold text-white/50">
              Traço secundário: <span style={{ color: secondary.color }} className="font-black">{secondary.name}</span>
            </div>
            <div className="text-[8px] text-white/25">"{secondary.tagline}"</div>
          </div>
        </div>
      )}

      {/* Archetype Radar */}
      <div className="space-y-1.5">
        <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 px-1 flex items-center gap-1">
          <Sparkles size={8} className="text-indigo-400/50" /> Compatibilidade com Arquétipos
        </div>
        {topScores.map(({ archetype, score }) => (
          <div key={archetype.id} className="flex items-center gap-2 px-1">
            <span className="text-sm w-6 text-center">{archetype.emoji}</span>
            <span className="text-[9px] font-bold text-white/40 w-20 truncate">{archetype.name}</span>
            <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(score / maxScore) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: archetype.color }}
              />
            </div>
            <span className="text-[9px] font-black font-mono w-6 text-right" style={{ color: archetype.color }}>
              {score}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
