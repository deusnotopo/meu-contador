/**
 * SavingsChallenge.tsx — Phase 42
 * ─────────────────────────────────
 * Gamified monthly savings challenges.
 * Auto-generates challenges based on spending patterns,
 * tracks streaks, awards achievements, and shows
 * compound impact of small behavioral changes.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Flame, Star, Target, Zap,
  TrendingDown, Coffee, Utensils, ShoppingBag
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { EmptyIntelligence } from "@/components/ui/EmptyIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  icon: React.ElementType;
  target: number;          // target amount to save
  current: number;         // current progress
  progress: number;        // 0-100%
  difficulty: "easy" | "medium" | "hard";
  impactAnnual: number;    // annual savings if sustained
  impact10yr: number;      // 10-year compound value
  color: string;
  status: "active" | "completed" | "failed";
}

interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

// ── FV helper ─────────────────────────────────────────────────────────────────

const fv = (monthly: number, years: number): number => {
  const r = 0.01;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
};

// ── Challenge Generator ───────────────────────────────────────────────────────

function generateChallenges(
  transactions: { type: string; category: string; description: string; amount: number; date: string }[],
  _monthlyIncome: number,
): { challenges: Challenge[]; achievements: Achievement[]; streak: number } {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const expenses = transactions.filter(t => t.type === "expense");
  const thisMonthExp = expenses.filter(e => e.date.startsWith(currentMonth));
  const lastMonthExp = expenses.filter(e => e.date.startsWith(lastMonth));

  // Category analysis
  const catTotals = (txs: typeof expenses): Record<string, number> => {
    const m: Record<string, number> = {};
    txs.forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return m;
  };

  const lastCats = catTotals(lastMonthExp);
  const thisCats = catTotals(thisMonthExp);

  const challenges: Challenge[] = [];

  // 1. REDUCE TOP CATEGORY BY 10%
  const topCat = Object.entries(lastCats).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const target = topCat[1] * 0.1;
    const currentSpend = thisCats[topCat[0]] || 0;
    const saved = Math.max(0, topCat[1] - currentSpend);
    challenges.push({
      id: "reduce-top", title: `Corte 10% em ${topCat[0]}`,
      description: `Reduza de ${formatCurrency(topCat[1])} para ${formatCurrency(topCat[1] * 0.9)} este mês`,
      emoji: "✂️", icon: TrendingDown,
      target, current: Math.min(saved, target),
      progress: Math.min(100, (saved / Math.max(1, target)) * 100),
      difficulty: "medium",
      impactAnnual: target * 12,
      impact10yr: fv(target, 10),
      color: "#F59E0B",
      status: saved >= target ? "completed" : now.getDate() > 28 && saved < target * 0.5 ? "failed" : "active",
    });
  }

  // 2. NO-SPEND DAY CHALLENGE (5 days this month with zero spending)
  const daysWithSpend = new Set(thisMonthExp.map(e => e.date.slice(0, 10)));
  const daysPassed = now.getDate();
  const noSpendDays = daysPassed - daysWithSpend.size;
  const targetDays = 5;
  challenges.push({
    id: "no-spend", title: "5 Dias Sem Gastar",
    description: `${noSpendDays} de ${targetDays} dias sem nenhuma transação`,
    emoji: "🧘", icon: Star,
    target: targetDays, current: Math.min(noSpendDays, targetDays),
    progress: Math.min(100, (noSpendDays / targetDays) * 100),
    difficulty: "easy",
    impactAnnual: 0,
    impact10yr: 0,
    color: "#10B981",
    status: noSpendDays >= targetDays ? "completed" : "active",
  });

  // 3. COFFEE/DELIVERY CHALLENGE (reduce small daily expenses)
  const smallExpKeywords = ["café", "coffee", "starbucks", "padaria", "lanche", "salgado", "ifood", "delivery", "uber eats", "rappi"];
  const lastSmall = lastMonthExp
    .filter(e => smallExpKeywords.some(k => (e.description + e.category).toLowerCase().includes(k)))
    .reduce((s, e) => s + e.amount, 0);
  const thisSmall = thisMonthExp
    .filter(e => smallExpKeywords.some(k => (e.description + e.category).toLowerCase().includes(k)))
    .reduce((s, e) => s + e.amount, 0);

  if (lastSmall > 50) {
    const target = lastSmall * 0.3; // cut 30%
    const saved = Math.max(0, lastSmall - thisSmall);
    challenges.push({
      id: "small-cuts", title: "Latte Factor: -30%",
      description: `Reduza gastos pequenos (café, delivery, lanches) de ${formatCurrency(lastSmall)}`,
      emoji: "☕", icon: Coffee,
      target, current: Math.min(saved, target),
      progress: Math.min(100, (saved / Math.max(1, target)) * 100),
      difficulty: "medium",
      impactAnnual: target * 12,
      impact10yr: fv(target, 10),
      color: "#8B5CF6",
      status: saved >= target ? "completed" : "active",
    });
  }

  // 4. RESTAURANT CHALLENGE (cook at home more)
  const restaurantLast = lastMonthExp
    .filter(e => ["restaurante", "delivery", "ifood", "uber eats"].some(k => (e.description + e.category).toLowerCase().includes(k)))
    .reduce((s, e) => s + e.amount, 0);
  const restaurantThis = thisMonthExp
    .filter(e => ["restaurante", "delivery", "ifood", "uber eats"].some(k => (e.description + e.category).toLowerCase().includes(k)))
    .reduce((s, e) => s + e.amount, 0);

  if (restaurantLast > 200) {
    const target = restaurantLast * 0.2;
    const saved = Math.max(0, restaurantLast - restaurantThis);
    challenges.push({
      id: "cook-home", title: "Cozinhe em Casa",
      description: `Reduza refeições fora de ${formatCurrency(restaurantLast)} em 20%`,
      emoji: "🍳", icon: Utensils,
      target, current: Math.min(saved, target),
      progress: Math.min(100, (saved / Math.max(1, target)) * 100),
      difficulty: "hard",
      impactAnnual: target * 12,
      impact10yr: fv(target, 10),
      color: "#EC4899",
      status: saved >= target ? "completed" : "active",
    });
  }

  // 5. IMPULSE CONTROL (no purchases > R$200 without 48h wait)
  const impulseCount = thisMonthExp.filter(e => e.amount > 200 && !["moradia", "saúde", "educação"].includes(e.category.toLowerCase())).length;
  challenges.push({
    id: "impulse", title: "Controle de Impulso",
    description: `Máximo 2 compras > R$200 não essenciais este mês`,
    emoji: "🧠", icon: ShoppingBag,
    target: 2, current: Math.max(0, 2 - impulseCount),
    progress: impulseCount <= 2 ? 100 : Math.max(0, (1 - (impulseCount - 2) / 5) * 100),
    difficulty: "hard",
    impactAnnual: 0,
    impact10yr: 0,
    color: "#3B82F6",
    status: impulseCount <= 2 ? "completed" : "active",
  });

  // Streak (how many months user reduced spending vs prior month)
  const monthlySpends: Record<string, number> = {};
  expenses.forEach(e => {
    const m = e.date.slice(0, 7);
    monthlySpends[m] = (monthlySpends[m] || 0) + e.amount;
  });
  const sortedMonths = Object.entries(monthlySpends).sort((a, b) => b[0].localeCompare(a[0]));
  let streak = 0;
  for (let i = 0; i < sortedMonths.length - 1; i++) {
    if (sortedMonths[i]![1] <= sortedMonths[i + 1]![1]) streak++;
    else break;
  }

  // Achievements
  const completedCount = challenges.filter(c => c.status === "completed").length;
  const achievements: Achievement[] = [
    { id: "first", emoji: "🌟", title: "Primeiro Passo", description: "Complete 1 desafio", unlocked: completedCount >= 1 },
    { id: "triple", emoji: "🔥", title: "Trifecta", description: "Complete 3 desafios no mês", unlocked: completedCount >= 3 },
    { id: "all", emoji: "👑", title: "Mestre do Mês", description: "Complete todos os desafios", unlocked: completedCount === challenges.length },
    { id: "streak3", emoji: "⚡", title: "Streak de 3", description: "3 meses consecutivos melhorando", unlocked: streak >= 3 },
    { id: "frugal", emoji: "🍃", title: "Minimalista", description: "5+ dias sem gastar", unlocked: noSpendDays >= 5 },
  ];

  return { challenges, achievements, streak };
}

// ── Difficulty Badge ──────────────────────────────────────────────────────────

const DiffBadge = ({ d }: { d: Challenge["difficulty"] }) => {
  const c = { easy: "text-emerald-400 bg-emerald-500/10", medium: "text-amber-400 bg-amber-500/10", hard: "text-rose-400 bg-rose-500/10" };
  const l = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
  return <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${c[d]}`}>{l[d]}</span>;
};

// ── Main Component ────────────────────────────────────────────────────────────

export const SavingsChallenge = () => {
  const { totals, allTransactions: transactions } = useTransactions("personal");

  const { challenges, achievements, streak } = useMemo(
    () => generateChallenges(transactions, totals?.income ?? 0),
    [transactions, totals]
  );

  if (transactions.length < 10) {
    return (
      <EmptyIntelligence
        icon={Trophy}
        emoji="🏆"
        title="Desafios de Economia"
        description="Registre pelo menos 10 transações para desbloquear desafios personalizados."
        compact
        color="#F59E0B"
      />
    );
  }

  const completedCount = challenges.filter(c => c.status === "completed").length;
  const totalImpact = challenges.reduce((s, c) => s + c.impact10yr, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--r5)] border border-white/[0.06] bg-gradient-to-b from-[#0F0D04] to-[#080700] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
            <Trophy size={15} className="text-yellow-400" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-yellow-400">Desafios do Mês</div>
            <div className="text-[9px] text-white/30">{completedCount}/{challenges.length} completos</div>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame size={10} className="text-orange-400" />
            <span className="text-[10px] font-black text-orange-400">{streak} meses</span>
          </div>
        )}
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        {challenges.map((ch, i) => {
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl p-3.5 border transition-all ${
                ch.status === "completed"
                  ? "bg-emerald-500/[0.03] border-emerald-500/15"
                  : ch.status === "failed"
                  ? "bg-rose-500/[0.03] border-rose-500/10"
                  : "bg-white/[0.02] border-white/[0.05]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg">{ch.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-white/70">{ch.title}</span>
                    <DiffBadge d={ch.difficulty} />
                    {ch.status === "completed" && <span className="text-[8px] text-emerald-400 font-black">✓ Completo</span>}
                  </div>
                  <div className="text-[9px] text-white/30 mb-2">{ch.description}</div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ch.progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: ch.status === "completed" ? "#10B981" : ch.color }}
                      />
                    </div>
                    <span className="text-[9px] font-black font-mono text-white/40">
                      {ch.progress.toFixed(0)}%
                    </span>
                  </div>

                  {/* Impact */}
                  {ch.impact10yr > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-[8px] text-amber-400/50">
                      <Zap size={7} />
                      <span>Impacto: {formatCurrency(ch.impactAnnual)}/ano → {formatCurrency(ch.impact10yr)} em 10 anos</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Achievements Row */}
      <div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 px-1 mb-2 flex items-center gap-1">
          <Star size={8} className="text-yellow-400/50" /> Conquistas
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {achievements.map(a => (
            <div key={a.id} className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
              a.unlocked
                ? "bg-yellow-500/[0.05] border-yellow-500/15"
                : "bg-white/[0.01] border-white/[0.04] opacity-40"
            }`}>
              <span className="text-sm">{a.emoji}</span>
              <div>
                <div className={`text-[8px] font-black ${a.unlocked ? "text-yellow-400" : "text-white/30"}`}>{a.title}</div>
                <div className="text-[7px] text-white/20">{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Impact */}
      {totalImpact > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
          <Target size={11} className="text-yellow-400" />
          <div className="text-[10px] text-yellow-400/80">
            Completar todos os desafios = <strong>{formatCurrency(totalImpact)}</strong> de patrimônio extra em 10 anos
          </div>
        </div>
      )}
    </motion.div>
  );
};
