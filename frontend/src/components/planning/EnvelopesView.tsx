import React, { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useTour } from "@/hooks/useTour";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { showSuccess, showError } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";
import { ArrowLeft, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import {
  BUDGET_GROUP_ORDER,
  buildSpentByCategory,
  getBudgetGroup,
  mapBudgetsWithInsights,
  normalizeBudgetCategory,
} from "@/features/budgets/budget-utils";
import { AreaTutorialButton } from "@/components/ui/AreaTutorialButton";
import { motion, AnimatePresence } from "framer-motion";
import { BudgetService } from "@/services/BudgetService";
import { EnvelopeCard } from "./EnvelopeCard";
import { EnvelopeDetail } from "./EnvelopeDetail";

interface EnvelopesViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

export const EnvelopesView = ({ onBack, onNavigate }: EnvelopesViewProps) => {
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createCategory, setCreateCategory] = useState("");
  const [createLimit, setCreateLimit] = useState("");

  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { startTour } = useTour();

  React.useEffect(() => {
    if (!selectedEnvelope && budgets.length > 0) {
      startTour('budgets');
    }
  }, [startTour, selectedEnvelope, budgets.length]);

  const currentMonth = BudgetService.getCurrentLocalMonth();
  
  const spentByCategory = useMemo(() => {
    return buildSpentByCategory(transactions, currentMonth);
  }, [transactions, currentMonth]);

  const mappedEnvelopes = useMemo(
    () => mapBudgetsWithInsights(budgets, spentByCategory),
    [budgets, spentByCategory],
  );

  const totalLimit = mappedEnvelopes.reduce((acc, e) => acc + e.limit, 0);
  const totalSpent = mappedEnvelopes.reduce((acc, e) => acc + e.spent, 0);
  const totalAvail = Math.max(0, totalLimit - totalSpent);
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const handleDelete = async (id: string) => {
    if (!await confirmAction('Remover este envelope?')) return;
    // Fix critical delete bug: Desfazer a renderização de detalhes ANTES de realizar a mutação da API
    setSelectedEnvelope(null);
    // Wait for layout to settle (React batched state update)
    setTimeout(async () => {
      await deleteBudget(id);
    }, 0);
  };

  const handleCreate = async () => {
    if (!createCategory || !createLimit) return;
    const catFormatted = normalizeBudgetCategory(createCategory);
    if (budgets.some(b => normalizeBudgetCategory(b.category) === catFormatted)) {
      showError('Envelope para esta categoria já existe!');
      return;
    }
    await addBudget({ category: catFormatted, limit: Number(createLimit), month: currentMonth, period: "monthly", priority: "medium" });
    setIsCreating(false);
    setCreateCategory("");
    setCreateLimit("");
  };

  const handleReallocate = async (sourceId: string, targetId: string, amountNeeded: number) => {
    const sourceEnv = mappedEnvelopes.find(e => e.id === sourceId);
    const targetEnv = mappedEnvelopes.find(e => e.id === targetId);
    if (!sourceEnv || !targetEnv) return;

    const sourceAvail = sourceEnv.limit - sourceEnv.spent;
    const amountToTransfer = Math.min(sourceAvail, amountNeeded);

    if (amountToTransfer <= 0) return;

    await updateBudget(sourceId, { limit: sourceEnv.limit - amountToTransfer });
    await updateBudget(targetId, { limit: targetEnv.limit + amountToTransfer });
    showSuccess(`R$ ${amountToTransfer} realocados com sucesso!`);
  };

  if (selectedEnvelope) {
    const env = mappedEnvelopes.find(e => e.id === selectedEnvelope);
    // Tratar se env for apagado por outro device ou corrupção
    if (!env) {
      setSelectedEnvelope(null);
      return null;
    }

    const catTransactions = transactions
      .filter(t => t.type === "expense" && t.date.startsWith(currentMonth) && normalizeBudgetCategory(t.category) === env.category)
      .sort((a,b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return (
      <EnvelopeDetail
        env={env}
        transactions={catTransactions}
        mappedEnvelopes={mappedEnvelopes}
        onClose={() => setSelectedEnvelope(null)}
        onDelete={handleDelete}
        onUpdateLimit={(id: string, newLimit: number) => updateBudget(id, { limit: newLimit })}
        onReallocate={handleReallocate}
      />
    );
  }

  // --- MAIN VIEW ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-8 pb-32 pt-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={() => onBack()} className="rounded-xl w-10 h-10 bg-white/5 hover:bg-white/10 text-[var(--t2)]">
              <ArrowLeft size={18} />
            </Button>
          )}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Planejamento Zero-Based</p>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              Orçamentos
              <HelpButton tooltipText="Crie 'envelopes' virtuais para dividir sua renda. Cada envelope representa o limite máximo que você pode gastar em cada categoria no mês." />
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400" onClick={() => setIsCreating(true)}>
            <Plus size={18} />
          </Button>
          <AreaTutorialButton area="budget" onNavigate={onNavigate} />
        </div>
      </div>

      <div className="premium-card p-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <MapPin size={100} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-400/80 mb-2">
                Disponível para alocar
              </p>
              <div className="text-4xl font-black text-emerald-400 tracking-tight">
                {formatCurrency(totalAvail)}
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-emerald-400 to-indigo-500"
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--t4)]">
            <span>Consumido: {formatCurrency(totalSpent)}</span>
            <span>Teto: {formatCurrency(totalLimit)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="premium-card p-6 bg-indigo-500/10 border-indigo-500/30"
          >
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Novo Envelope</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-[var(--t4)]"
                  placeholder="Nome (ex: Supermercado)"
                  value={createCategory}
                  onChange={e => setCreateCategory(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <input
                  type="number"
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-[var(--t4)]"
                  placeholder="Limite R$"
                  value={createLimit}
                  onChange={e => setCreateLimit(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl" onClick={handleCreate}>
                Criar Envelope
              </Button>
              <Button variant="ghost" className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--t2)] font-bold" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {budgets.length === 0 && !isCreating ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="premium-card p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10"
        >
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 text-4xl">
            ✉️
          </div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">Nenhum envelope definido</h3>
          <p className="text-[var(--t3)] text-sm font-medium max-w-sm mb-8 leading-relaxed">
            Divida sua renda em "envelopes" (categorias) para criar limites e controlar para onde seu dinheiro vai no mês.
          </p>
          <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-indigo-500/20" onClick={() => setIsCreating(true)}>
            Criar meu primeiro envelope
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {BUDGET_GROUP_ORDER.map(groupName => {
            const envsInGroup = mappedEnvelopes.filter(e => e.group === groupName);
            if (envsInGroup.length === 0) return null;
            
            return (
              <div key={groupName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--t3)]">{groupName}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {envsInGroup.map(env => (
                    <EnvelopeCard key={env.id} env={env} onClick={setSelectedEnvelope} />
                  ))}
                </div>
              </div>
            );
          })}

          {mappedEnvelopes.filter(e => !BUDGET_GROUP_ORDER.includes(getBudgetGroup(e.category))).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--t4)]" />
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--t3)]">Outros Destinos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mappedEnvelopes.filter(e => !BUDGET_GROUP_ORDER.includes(getBudgetGroup(e.category))).map(env => (
                  <EnvelopeCard key={env.id} env={env} onClick={setSelectedEnvelope} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};