import React, { useState, useMemo } from "react";
import type { TabType } from "@/types/navigation";
import { useTour } from "@/hooks/useTour";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { showSuccess } from "@/lib/toast";
import { ArrowLeft, Plus, Edit2, Trash2, PieChart, Info, MapPin } from "lucide-react";
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

interface EnvelopesViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

export const EnvelopesView = ({ onBack, onNavigate }: EnvelopesViewProps) => {
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLimit, setEditLimit] = useState("");
  
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

  const currentMonth = new Date().toISOString().slice(0, 7);
  
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

  const handleSaveEdit = async (id: string) => {
    if (!editLimit) return;
    await updateBudget(id, { limit: Number(editLimit) });
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remover este envelope?")) {
      await deleteBudget(id);
      setSelectedEnvelope(null);
    }
  };

  const handleCreate = async () => {
    if (!createCategory || !createLimit) return;
    const catFormatted = normalizeBudgetCategory(createCategory);
    if (budgets.some(b => normalizeBudgetCategory(b.category) === catFormatted)) {
      alert("Envelope para esta categoria já existe!");
      return;
    }
    await addBudget({ category: catFormatted, limit: Number(createLimit), month: currentMonth });
    setIsCreating(false);
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

  const renderEnvelopeCard = (env: typeof mappedEnvelopes[0]) => {
    const pct = Math.min((env.spent / env.limit) * 100, 100);
    const isOver = env.spent > env.limit;

    return (
      <motion.div
        key={env.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedEnvelope(env.id)}
        className={`premium-card p-6 cursor-pointer border transition-all ${
          isOver
            ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
            : "bg-white/5 border-white/5 hover:bg-white/10"
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
              isOver ? "bg-rose-500/20" : "bg-white/10"
            }`}>
              {env.icon}
            </div>
            <div>
              <h4 className="font-bold text-white text-base leading-tight mb-1">{env.category}</h4>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isOver ? "text-rose-400" : "text-[var(--t3)]"}`}>
                {isOver ? `ESTOUROU +${formatCurrency(env.spent - env.limit).replace(',00','')}` : `Sobra ${formatCurrency(env.limit - env.spent).replace(',00','')}`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className={`text-xl font-black ${isOver ? "text-rose-400" : "text-white"}`}>
              {formatCurrency(env.spent).replace(',00','')}
            </span>
            <span className="text-xs font-medium text-[var(--t4)]">
              de {formatCurrency(env.limit).replace(',00','')}
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isOver ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : pct > 80 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  if (selectedEnvelope) {
    const env = mappedEnvelopes.find(e => e.id === selectedEnvelope);
    if (!env) { setSelectedEnvelope(null); return null; }

    const isOver = env.spent > env.limit;
    const pct = Math.min((env.spent / env.limit) * 100, 100);
    const catTransactions = transactions
      .filter(t => t.type === "expense" && t.date.startsWith(currentMonth) && normalizeBudgetCategory(t.category) === env.category)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="space-y-8 pb-32 pt-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedEnvelope(null); setIsEditing(false); }} className="rounded-xl w-10 h-10 bg-white/5 hover:bg-white/10 text-[var(--t2)]">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{env.icon}</span>
              <div>
                <h2 className="text-2xl font-black text-white">{env.category}</h2>
                {isOver && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/20">Estourou {formatCurrency(Math.abs(env.spent - env.limit))}</span>}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--t2)]" onClick={() => { setIsEditing(!isEditing); setEditLimit(env.limit.toString()); }}>
            <Edit2 size={16} />
          </Button>
        </div>

        <AnimatePresence>
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="premium-card p-6 bg-indigo-500/5 border-indigo-500/20"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--t3)] mb-2 block">Novo Limite (R$)</label>
                  <input
                    type="number"
                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    value={editLimit}
                    onChange={e => setEditLimit(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl" onClick={() => handleSaveEdit(env.id)}>
                    Salvar Mudanças
                  </Button>
                  <Button variant="ghost" className="h-12 px-6 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => handleDelete(env.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div className="premium-card p-6 bg-white/5 border-white/10" layoutId={`env-${env.id}`}>
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--t4)] mb-2">
                Gasto no Mês Atual
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className={`text-4xl font-black ${isOver ? 'text-rose-400' : 'text-white'}`}>
                  {formatCurrency(env.spent)}
                </span>
                <span className="text-sm font-medium text-[var(--t3)]">
                  de {formatCurrency(env.limit)}
                </span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6">
                <div className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
              </div>
              {isOver && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-rose-400" />
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Custo de Oportunidade</h5>
                  </div>
                  <p className="text-xs text-rose-300/80 font-medium leading-relaxed">
                    Esse dinheiro extra de <strong className="text-rose-300">{formatCurrency(Math.abs(env.spent - env.limit))}</strong> poderia render <strong className="text-rose-300">{(Math.abs(env.spent - env.limit) * 12 * 10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> em 10 anos investido passivamente.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isOver && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--t4)]">Realocação Dinâmica</h3>
            <div className="premium-card p-4">
              <p className="text-sm text-[var(--t3)] mb-4 inline-block">De qual envelope vamos tirar os <strong>{formatCurrency(Math.abs(env.spent - env.limit))}</strong> que faltam?</p>
              <div className="space-y-3">
                {mappedEnvelopes.filter(e => e.id !== env.id && e.spent < e.limit).slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">{e.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-white">{e.category}</p>
                        <p className="text-xs text-emerald-400 font-medium tracking-wide">Sobra {formatCurrency(e.limit - e.spent)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleReallocate(e.id, env.id, Math.abs(env.spent - env.limit))}>Cobrir Furo</Button>
                  </div>
                ))}
                {mappedEnvelopes.filter(e => e.id !== env.id && e.spent < e.limit).length === 0 && (
                  <p className="text-xs text-rose-400 font-bold tracking-widest uppercase">Sem envelopes com sobra</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--t4)] flex items-center gap-2">
            <PieChart size={14} /> Histórico de Saídas
          </h3>
          <div className="premium-card p-2">
            {catTransactions.length === 0 ? (
              <div className="p-8 text-center text-[var(--t4)] text-sm font-medium">
                Nenhum gasto registrado em {env.category} ainda.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {catTransactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                        {env.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{tx.description}</h4>
                        <p className="text-xs text-[var(--t4)]">{formatShortDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-white">- {formatCurrency(Math.abs(tx.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
                  {envsInGroup.map(renderEnvelopeCard)}
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
                {mappedEnvelopes.filter(e => !BUDGET_GROUP_ORDER.includes(getBudgetGroup(e.category))).map(renderEnvelopeCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};