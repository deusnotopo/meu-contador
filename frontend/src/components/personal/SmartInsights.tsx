import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { detectPatterns } from "@/lib/recurring-detector";
import type { Pattern } from "@/lib/recurring-detector";
import type { UseRemindersReturn } from "@/hooks/useReminders";
import { showSuccess } from "@/lib/toast";
import type { SavingsGoal, Transaction } from "@/types";
import type { TabType } from "@/types/navigation";
import { motion } from "framer-motion";
import { PieChart, Sparkles, TrendingUp, Zap } from "lucide-react";
import { PrivacyValue } from "../ui/PrivacyValue";
import { EmptyState } from "../ui/EmptyState";
import { useIntelligence } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  transactions: Transaction[];
  goals: SavingsGoal[];
  onNavigate?: (tab: TabType) => void;
  /** Shared reminders context from parent — avoids double API call */
  remindersCtx: UseRemindersReturn;
}

export const SmartInsights = ({
  transactions,
  goals,
  onNavigate,
  remindersCtx,
}: Props) => {
  const { reminders, addReminder } = remindersCtx;
  const { intelligence, loading } = useIntelligence();

  const patterns = detectPatterns(transactions, reminders);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl bg-white/5" />
        <Skeleton className="h-40 w-full rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="Insights Congelados ❄️"
        description="A inteligência artificial precisa de dados. Registre movimentos financeiros para que possamos traçar seus padrões, linha do tempo de riqueza e metas FIRE."
      />
    );
  }

  const handleAddReminder = async (p: Pattern) => {
    // Set next month as default due date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await addReminder({
      name: p.description,
      amount: p.amount,
      category: p.category ?? "Outros",
      dueDate: nextMonth.toISOString().split("T")[0] || "",
      recurring: "monthly",
      isPaid: false,
      type: "payment",
      priority: "medium",
      completed: false,
    });

    showSuccess(`${p.description} adicionado aos lembretes!`);
  };

  const {
    wealthSurvivalDays = 0,
    fireProgress = 0,
    yearsToFire = 0,
    monthlyAvgExpenses = 0,
    monthlyAvgSurplus = 0,
    opportunityCost10yr = 0,
  } = intelligence || {};

  return (
    <div className="space-y-8 pb-10">
      {/* Patterns Section */}
      {patterns.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Zap size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
              Padrões <span className="text-white">Detectados</span> 🕵️‍♂️
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {patterns.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bento-card p-5 hover:bg-white/[0.06] transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">
                      {p.description}
                    </h4>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Detectado {p.frequency}x • Média{" "}
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAddReminder(p)}
                    className="h-10 px-4 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-indigo-500/20"
                  >
                    Agendar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Wealth Timeline Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
            Linha do Tempo <span className="text-white">de Riqueza</span> ⏳
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {goals.map((goal) => {
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsToGoal =
              monthlyAvgSurplus > 0
                ? Math.ceil(remaining / (monthlyAvgSurplus * 0.5))
                : Infinity; // Assume 50% of surplus goes to this goal

            return (
              <div key={goal.id} className="bento-card p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {goal.name}
                  </span>
                  <Sparkles size={14} className="text-indigo-400/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-neutral-500 font-medium">
                    Estimativa para conclusão:
                  </p>
                  <p className="text-2xl font-black text-white">
                    {monthsToGoal === Infinity || monthsToGoal === null
                      ? "???"
                      : monthsToGoal > 12
                        ? `${Math.floor(monthsToGoal / 12)}a ${
                            monthsToGoal % 12
                          }m`
                        : `${monthsToGoal} meses`}
                  </p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${
                        (goal.currentAmount / goal.targetAmount) * 100
                      }%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-neutral-700 font-bold uppercase">
                  Baseado no seu superavit atual
                </p>
              </div>
            );
          })}

          <div
            className="bento-card p-5 flex flex-col justify-between"
            style={{
              background: "rgba(0,217,145,0.05)",
              borderColor: "rgba(0,217,145,0.2)",
            }}
          >
            <div>
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">
                Poder de Liberdade
              </h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                Com seus investimentos atuais, você poderia viver por:
              </p>
            </div>
            <div className="py-4">
              <p className="text-4xl font-black text-white">
                {wealthSurvivalDays}{" "}
                <span className="text-lg text-neutral-500">dias</span>
              </p>
            </div>
            <p className="text-[8px] text-neutral-700 font-bold uppercase italic">
              Fator de Sobrevivência (Baseado no custo de vida atual)
            </p>
          </div>

          <div
            className="bento-card p-5 flex flex-col justify-between"
            style={{
              background: "rgba(99,102,241,0.08)",
              borderColor: "rgba(99,102,241,0.25)",
            }}
          >
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">
                Aposentadoria (FIRE)
              </h4>
              <p className="text-[10px] text-neutral-500">
                Progresso para viver de renda (Regra dos 4%)
              </p>
            </div>
            <div className="py-4 space-y-2">
              <p className="text-4xl font-black text-white">
                {fireProgress.toFixed(1)}%
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fireProgress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase">
              <span>
                Faltam:{" "}
                {yearsToFire >= 999
                  ? "???"
                  : yearsToFire > 50
                    ? "+50 anos"
                    : `${yearsToFire.toFixed(1)} anos`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Tips */}
      <div
        className="bento-card p-6 overflow-hidden relative"
        style={{
          background: "rgba(99,102,241,0.06)",
          borderColor: "rgba(99,102,241,0.18)",
        }}
      >
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <PieChart size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Auditoria de <span className="text-indigo-400">Desejos</span>
            </h3>
            <p className="text-sm text-neutral-500 max-w-md font-medium">
              Você classificou uma média de{" "}
              <span className="text-white font-bold">
                {formatCurrency(monthlyAvgExpenses)}
              </span>{" "}
              como gastos mensais, com oportunidades de otimização detectadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase">
                  Custo de Oportunidade (10 anos)
                </p>
                <p className="text-2xl font-black text-indigo-400">
                  <PrivacyValue value={opportunityCost10yr} />
                </p>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                *Este é o valor que você teria se investisse o total gasto em
                desejos a uma taxa conservadora.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => onNavigate?.("ai")}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs uppercase tracking-widest"
              >
                Otimizar Gastos Agora
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate?.("budget")}
                className="w-full text-neutral-500 font-bold text-[10px] uppercase"
              >
                Ver Categoria por Categoria
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
