import { showError, showSuccess } from "@/lib/toast";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGoals } from "@/hooks/useGoals";
import { useRole } from "@/context/AuthContext";
import type { SavingsGoal } from "@/types";
import { Pencil, Plus, Trash2, TrendingUp, Loader2, Target, X, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOAL_ICONS = ["🏦", "✈️", "🚗", "🏠", "💻", "📱", "🎓", "💍", "🏥", "🎯", "🌍", "🎸", "⛵", "🏋️", "🍕"];
const GOAL_COLORS: { from: string; to: string; accent: string; bg: string; border: string }[] = [
  { from: "#6366f1", to: "#8b5cf6", accent: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
  { from: "#10b981", to: "#0d9488", accent: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  { from: "#f59e0b", to: "#ef4444", accent: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  { from: "#3b82f6", to: "#6366f1", accent: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
  { from: "#ec4899", to: "#f43f5e", accent: "#f472b6", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)" },
  { from: "#06b6d4", to: "#3b82f6", accent: "#22d3ee", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// ── GoalModal ──────────────────────────────────────────────────────────────────
interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; targetAmount: number; currentAmount: number; deadline: string; icon: string; colorIndex: number }) => void;
  initial?: { name: string; targetAmount: number; currentAmount: number; deadline: string; icon: string; colorIndex: number };
  editing: boolean;
}

const GoalModal = ({ open, onClose, onSave, initial, editing }: GoalModalProps) => {
  const [form, setForm] = useState(initial ?? { name: "", targetAmount: 0, currentAmount: 0, deadline: "", icon: "🎯", colorIndex: 0 });

  // sync when initial changes (edit mode)
  useState(() => { if (initial) setForm(initial); });

  const handleSubmit = () => {
    if (!form.name.trim()) { showError("Nome da meta é obrigatório."); return; }
    if (form.targetAmount <= 0) { showError("Valor alvo deve ser maior que zero."); return; }
    if (form.deadline) {
      const d = new Date(form.deadline);
      if (d < new Date()) { showError("Prazo deve ser uma data futura."); return; }
    }
    onSave(form);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70"
          style={{ backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-lg rounded-3xl p-6 space-y-5 border border-white/[0.08]"
            style={{ background: "rgba(10,14,26,0.98)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{editing ? "Editar" : "Nova"} Meta Financeira</h2>
                <p className="text-[11px] text-white/30 mt-0.5">Defina seu objetivo e acompanhe o progresso</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                <X size={14} className="text-white/50" />
              </button>
            </div>

            {/* Icon picker */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Ícone</label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className={`w-10 h-10 rounded-xl text-[18px] flex items-center justify-center transition-all ${form.icon === icon ? "bg-white text-black scale-110 shadow-xl" : "bg-white/5 hover:bg-white/10"}`}
                  >{icon}</button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Cor</label>
              <div className="flex gap-2">
                {GOAL_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setForm((f) => ({ ...f, colorIndex: i }))}
                    className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, outline: form.colorIndex === i ? `2px solid ${c.accent}` : "none", outlineOffset: 2 }}
                  >
                    {form.colorIndex === i && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Nome da Meta</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Viagem de Férias, Carro Novo..."
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Valor Alvo (R$)</label>
                <input
                  type="number" min="0"
                  value={form.targetAmount || ""}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: Number(e.target.value) }))}
                  placeholder="10.000"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Já Guardado (R$)</label>
                <input
                  type="number" min="0"
                  value={form.currentAmount || ""}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Prazo Estimado</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 text-xs font-black uppercase tracking-widest transition-all">
                Cancelar
              </button>
              <button onClick={handleSubmit} className="flex-1 h-12 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${GOAL_COLORS[form.colorIndex]?.from ?? "#6366f1"}, ${GOAL_COLORS[form.colorIndex]?.to ?? "#8b5cf6"})` }}>
                {editing ? "Salvar Alterações" : "Criar Meta"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── GoalCard ───────────────────────────────────────────────────────────────────
const GoalCard = ({
  goal, colorCfg, onEdit, onDelete, onAddMoney, canWrite,
}: {
  goal: SavingsGoal;
  colorCfg: typeof GOAL_COLORS[number];
  onEdit: () => void;
  onDelete: () => void;
  onAddMoney: (amount: number) => void;
  canWrite: boolean;
}) => {
  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const isComplete = pct >= 100;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const monthsLeft = daysLeft !== null ? Math.ceil(daysLeft / 30) : null;
  const monthlySuggested = monthsLeft && monthsLeft > 0 && remaining > 0
    ? remaining / monthsLeft
    : null;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className="rounded-3xl overflow-hidden border transition-all"
      style={{ background: colorCfg.bg, borderColor: colorCfg.border }}
    >
      {/* Progress top strip */}
      <div className="h-1 w-full bg-white/[0.05]">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${colorCfg.from}, ${colorCfg.to})` }}
        />
      </div>

      <div className="p-5 space-y-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${colorCfg.from}22, ${colorCfg.to}22)`, border: `1px solid ${colorCfg.border}` }}>
              {goal.icon}
            </div>
            <div>
              <h4 className="text-sm font-black text-white tracking-tight leading-tight">{goal.name}</h4>
              {isComplete ? (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">✓ Concluída!</span>
              ) : daysLeft !== null ? (
                <span className="text-[9px] text-white/30">
                  {daysLeft > 0 ? `${daysLeft}d restantes` : "Prazo vencido"}
                </span>
              ) : null}
            </div>
          </div>
          {canWrite && (
            <div className="flex gap-1 shrink-0">
              <button onClick={onEdit} className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                <Pencil size={11} />
              </button>
              <button onClick={onDelete} className="w-7 h-7 rounded-xl bg-rose-500/5 hover:bg-rose-500/15 flex items-center justify-center text-rose-400 transition-all">
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {formatCurrency(goal.currentAmount).split(",")[0]}
            </span>
            <span className="text-[10px]" style={{ color: colorCfg.accent }}>
              {Math.round(pct)}% · Alvo: {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${colorCfg.from}, ${colorCfg.to})` }}
            />
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex items-center gap-2 text-[10px] text-white/30">
          <span>Falta: <strong className="text-white/60">{formatCurrency(remaining)}</strong></span>
          {monthlySuggested && (
            <>
              <span>·</span>
              <span>Guardar: <strong style={{ color: colorCfg.accent }}>{formatCurrency(monthlySuggested)}/mês</strong></span>
            </>
          )}
        </div>

        {/* Quick add buttons */}
        {canWrite && !isComplete && (
          <div className="flex gap-2 pt-1">
            {[100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => onAddMoney(amt)}
                className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 border"
                style={{ background: `${colorCfg.from}15`, borderColor: colorCfg.border, color: colorCfg.accent }}
              >
                +{amt < 1000 ? `R$${amt}` : "R$1k"}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
export const GoalsSection = () => {
  const { goals, loading, addGoal, editGoal, deleteGoal, updateGoalProgress } = useGoals();
  const { isViewer } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const getColorIndex = (goal: SavingsGoal): number => {
    const colorStr = goal.color ?? "";
    // New format: "goal-color-N"
    const newMatch = colorStr.match(/goal-color-(\d+)/);
    if (newMatch) return Math.min(Number(newMatch[1]), GOAL_COLORS.length - 1);
    // Legacy format: search for hex color substring
    const legacyIdx = GOAL_COLORS.findIndex((c) => colorStr.includes(c.from.replace("#", "")));
    if (legacyIdx >= 0) return legacyIdx;
    return goals.indexOf(goal) % GOAL_COLORS.length;
  };

  const handleSave = async (data: { name: string; targetAmount: number; currentAmount: number; deadline: string; icon: string; colorIndex: number }) => {
    if (editingGoal) {
      await editGoal(editingGoal.id, {
        name: data.name, targetAmount: data.targetAmount, currentAmount: data.currentAmount,
        deadline: data.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        icon: data.icon,
      });
    } else {
      await addGoal({
        name: data.name, targetAmount: data.targetAmount, currentAmount: data.currentAmount,
        deadline: data.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        icon: data.icon,
        color: `goal-color-${data.colorIndex}`,
      });
    }
    showSuccess(editingGoal ? "Meta atualizada!" : "Meta criada! 🎯");
    setModalOpen(false);
    setEditingGoal(null);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const openNew = () => {
    if (isViewer) { showError("Somente leitura"); return; }
    setEditingGoal(null);
    setModalOpen(true);
  };

  // Summary stats
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="text-white/30 text-sm">Carregando metas...</p>
      </div>
    );
  }

  return (
    <>
      <GoalModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingGoal(null); }}
        onSave={handleSave}
        editing={!!editingGoal}
        initial={editingGoal ? {
          name: editingGoal.name ?? "",
          targetAmount: editingGoal.targetAmount,
          currentAmount: editingGoal.currentAmount,
          deadline: (editingGoal.deadline ?? "").split("T")[0] ?? "",
          icon: editingGoal.icon ?? "🎯",
          colorIndex: getColorIndex(editingGoal),
        } : undefined}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <div className="card-obsidian relative overflow-hidden p-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                  <Target size={11} className="text-indigo-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Metas de Economia</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Seus Objetivos</h2>
                <p className="text-xs text-white/30 mt-1">Defina, acompanhe e conquiste suas metas financeiras</p>
              </div>
              <button
                onClick={openNew}
                disabled={isViewer}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all active:scale-95 shrink-0"
              >
                <Plus size={13} /> Nova Meta
              </button>
            </div>

            {/* Summary bar */}
            {goals.length > 0 && (
              <div className="relative z-10 flex gap-4 mt-5 pt-4 border-t border-white/5">
                {[
                  { label: "Total alvo", value: formatCurrency(totalTarget), color: "text-white/60" },
                  { label: "Guardado", value: formatCurrency(totalSaved), color: "text-emerald-400" },
                  { label: "Concluídas", value: `${completed}/${goals.length}`, color: "text-indigo-400" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 text-center">
                    <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold mb-1">{s.label}</div>
                    <div className={`text-sm font-black font-mono ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Grid */}
        {goals.length === 0 ? (
          <motion.div variants={fadeUp}>
            <EmptyState
              icon={TrendingUp}
              title="Comece sua Jornada de Independência"
              description="Crie metas visuais para acompanhar sua evolução e realizar seus sonhos com clareza."
              actionLabel="Definir Primeira Meta"
              onAction={openNew}
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                colorCfg={GOAL_COLORS[getColorIndex(goal)] ?? GOAL_COLORS[i % GOAL_COLORS.length]!}
                onEdit={() => openEdit(goal)}
                onDelete={() => deleteGoal(goal.id)}
                onAddMoney={(amt) => {
                  if (isViewer) { showError("Somente leitura"); return; }
                  updateGoalProgress(goal.id, Math.min(goal.targetAmount, goal.currentAmount + amt));
                }}
                canWrite={!isViewer}
              />
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
};
