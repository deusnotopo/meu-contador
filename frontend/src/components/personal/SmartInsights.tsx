import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { detectPatterns } from "@/lib/recurring-detector";
import {
  addReminder,
  loadInvestments,
  loadReminders,
  loadTransactions,
} from "@/lib/storage";
import { showSuccess } from "@/lib/toast";
import type { SavingsGoal, Transaction } from "@/types";
import { motion } from "framer-motion";
import { PieChart, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

interface Props {
  transactions: Transaction[];
  goals: SavingsGoal[];
}

export const SmartInsights = ({ transactions, goals }: Props) => {
  const [reminders, setReminders] = useState(() => loadReminders());
  const patterns = detectPatterns(transactions, reminders);

  const handleAddReminder = (p: any) => {
    // Set next month as default due date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    addReminder({
      name: p.description,
      amount: p.amount,
      category: p.category,
      dueDate: nextMonth.toISOString().split("T")[0],
      recurring: "monthly",
    });

    setReminders(loadReminders());
    showSuccess(`${p.description} adicionado aos lembretes!`);
  };

  const assets = loadInvestments();
  const totalInvested = assets.reduce(
    (acc, a) => acc + a.amount * a.currentPrice,
    0
  );

  // Basic Wealth Timeline Logic
  const allTransactions = loadTransactions();
  const monthlyExpenses =
    allTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0) /
    (allTransactions.length > 30 ? 3 : 1); // rough monthly avg

  const monthlySurplus =
    allTransactions.reduce(
      (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
      0
    ) / (allTransactions.length > 30 ? 3 : 1);

  // FIRE Calculation (4% Rule)
  // Required Capital = Monthly Expenses * 12 / 0.04
  const annualExpenses = monthlyExpenses * 12;
  const fireTarget = annualExpenses / 0.04;
  const firePercentage = Math.min((totalInvested / fireTarget) * 100, 100);

  // Years to FIRE (Simplified simple interest/no growth for conservative estimate)
  const monthlySaving = Math.max(monthlySurplus, 0);
  const yearsToFire =
    monthlySaving > 0
      ? (fireTarget - totalInvested) / (monthlySaving * 12)
      : Infinity;

  // Expense Optimization logic
  const wantTotal = allTransactions
    .filter((t) => t.type === "expense" && t.classification === "want")
    .reduce((acc, t) => acc + t.amount, 0);

  const potentialSavings10yr = wantTotal * 12 * 10 * 1.5; // Roughly 50% growth total for teaser math

  return (
    <div className="space-y-8 pb-10">
      {/* Patterns Section */}
      {patterns.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Zap size={20} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Padrões <span className="text-white">Detectados</span> 🕵️‍♂️
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">
                      {p.description}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Linha do Tempo <span className="text-white">de Riqueza</span> ⏳
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {goals.map((goal, i) => {
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsToGoal =
              monthlySurplus > 0
                ? Math.ceil(remaining / (monthlySurplus * 0.5))
                : Infinity; // Assume 50% of surplus goes to this goal

            return (
              <div key={goal.id} className="premium-card p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {goal.name}
                  </span>
                  <Sparkles size={14} className="text-indigo-400/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 font-medium">
                    Estimativa para conclusão:
                  </p>
                  <p className="text-2xl font-black text-white">
                    {monthsToGoal === Infinity
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
                <p className="text-[10px] text-slate-600 font-bold uppercase">
                  Baseado no seu superavit atual
                </p>
              </div>
            );
          })}

          <div className="premium-card p-6 bg-emerald-500/5 border-emerald-500/20 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">
                Poder de Liberdade
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Com seus investimentos atuais, você poderia viver por:
              </p>
            </div>
            <div className="py-4">
              <p className="text-4xl font-black text-white">
                128 <span className="text-lg text-slate-500">dias</span>
              </p>
            </div>
            <p className="text-[8px] text-slate-600 font-bold uppercase italic">
              Fator de Sobrevivência (Cesta Básica + Fixos)
            </p>
          </div>

          <div className="premium-card p-6 bg-indigo-500/10 border-indigo-500/30 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">
                Aposentadoria (FIRE)
              </h4>
              <p className="text-[10px] text-slate-400">
                Progresso para viver de renda (Regra dos 4%)
              </p>
            </div>
            <div className="py-4 space-y-2">
              <p className="text-4xl font-black text-white">
                {firePercentage.toFixed(1)}%
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${firePercentage}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
              <span>
                Faltam:{" "}
                {yearsToFire === Infinity
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
      <div className="premium-card p-8 bg-indigo-600/10 border-indigo-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <PieChart size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Auditoria de <span className="text-indigo-400">Desejos</span>
            </h3>
            <p className="text-sm text-slate-400 max-w-md font-medium">
              Você classificou{" "}
              <span className="text-white font-bold">
                {formatCurrency(wantTotal)}
              </span>{" "}
              como "Desejos" (não-essenciais) em seu histórico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Custo de Oportunidade (10 anos)
                </p>
                <p className="text-2xl font-black text-indigo-400">
                  <PrivacyValue value={potentialSavings10yr} />
                </p>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                *Este é o valor que você teria se investisse o total gasto em
                desejos a uma taxa conservadora.
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs uppercase tracking-widest">
                Otimizar Gastos Agora
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-500 font-bold text-[10px] uppercase"
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
