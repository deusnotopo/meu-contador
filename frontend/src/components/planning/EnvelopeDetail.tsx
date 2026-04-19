import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/formatters";

const formatShortDate = (dateStr: string) => {
  // Parsing date string safely instead of relying on string concatenation hacks
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
const calculateOpportunityCost = (capital: number, interestRate: number, periods: number) => {
  // Future Value of a Series formula (Compound Interest on monthly investments)
  return (capital * (Math.pow(1 + interestRate, periods) - 1)) / interestRate;
};
import { ArrowLeft, Edit2, Info, PieChart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Transaction } from "@/types";

interface EnvelopeDetailProps {
  env: {
    id: string;
    category: string;
    limit: number;
    spent: number;
    icon: React.ReactNode;
  };
  transactions: Transaction[];
  mappedEnvelopes: { id: string; category: string; limit: number; spent: number; icon: React.ReactNode }[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateLimit: (id: string, newLimit: number) => Promise<void>;
  onReallocate: (sourceId: string, targetId: string, amount: number) => Promise<void>;
}

export const EnvelopeDetail = ({
  env,
  transactions,
  mappedEnvelopes,
  onClose,
  onDelete,
  onUpdateLimit,
  onReallocate,
}: EnvelopeDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLimit, setEditLimit] = useState(env.limit.toString());

  const handleSaveEdit = async () => {
    if (!editLimit) return;
    await onUpdateLimit(env.id, Number(editLimit));
    setIsEditing(false);
  };

  const isOver = env.spent > env.limit;
  const pct = Math.min((env.spent / env.limit) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8 pb-32 pt-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl w-10 h-10 bg-white/5 hover:bg-white/10 text-[var(--t2)]"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{env.icon}</span>
            <div>
              <h2 className="text-2xl font-black text-white">{env.category}</h2>
              {isOver && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/20">
                  Estourou {formatCurrency(Math.abs(env.spent - env.limit))}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--t2)]"
          onClick={() => {
            setIsEditing(!isEditing);
            setEditLimit(env.limit.toString());
          }}
        >
          <Edit2 size={16} />
        </Button>
      </div>

      <AnimatePresence>
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="premium-card p-6 bg-indigo-500/5 border-indigo-500/20"
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[var(--t3)] mb-2 block">
                  Novo Limite (R$)
                </label>
                <input
                  type="number"
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                  onClick={handleSaveEdit}
                >
                  Salvar Mudanças
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 px-6 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => onDelete(env.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div className="premium-card p-6 bg-white/5 border-white/10" layoutId={`env-card-${env.id}`}>
            <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--t4)] mb-2">
              Gasto no Mês Atual
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className={`text-4xl font-black ${isOver ? "text-rose-400" : "text-white"}`}>
                {formatCurrency(env.spent)}
              </span>
              <span className="text-sm font-medium text-[var(--t3)]">
                de {formatCurrency(env.limit)}
              </span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isOver ? "bg-rose-500" : "bg-emerald-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isOver && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-rose-400" />
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                    Custo de Oportunidade
                  </h5>
                </div>
                <p className="text-xs text-rose-300/80 font-medium leading-relaxed">
                  Esse dinheiro extra de <strong className="text-rose-300">{formatCurrency(Math.abs(env.spent - env.limit))}</strong> poderia render <strong className="text-rose-300">{formatCurrency(calculateOpportunityCost(Math.abs(env.spent - env.limit), 0.008, 120))}</strong> em 10 anos investido passivamente (~0.8% a.m).
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isOver && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--t4)]">
            Realocação Dinâmica
          </h3>
          <div className="premium-card p-4">
            <p className="text-sm text-[var(--t3)] mb-4 inline-block">
              De qual envelope vamos tirar os{" "}
              <strong>{formatCurrency(Math.abs(env.spent - env.limit))}</strong> que faltam?
            </p>
            <div className="space-y-3">
              {mappedEnvelopes
                .filter((e) => e.id !== env.id && e.spent < e.limit)
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                        {e.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{e.category}</p>
                        <p className="text-xs text-emerald-400 font-medium tracking-wide">
                          Sobra {formatCurrency(e.limit - e.spent)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onReallocate(e.id, env.id, Math.abs(env.spent - env.limit))}
                    >
                      Cobrir Furo
                    </Button>
                  </div>
                ))}
              {mappedEnvelopes.filter((e) => e.id !== env.id && e.spent < e.limit).length === 0 && (
                <p className="text-xs text-rose-400 font-bold tracking-widest uppercase">
                  Sem envelopes com sobra
                </p>
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
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-[var(--t4)] text-sm font-medium">
              Nenhum gasto registrado em {env.category} ainda.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
                >
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
};
