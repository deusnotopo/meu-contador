import { showError, showSuccess } from "@/lib/toast";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useRole } from "@/context/AuthContext";
import type { SavingsGoal } from "@/types";
import {
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Loader2,
  Target,
  X,
  Check,
  AlertTriangle,
  Zap,
  ChevronUp,
  ChevronDown,
  TrendingDown,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOAL_ICONS = [
  "🏦",
  "✈️",
  "🚗",
  "🏠",
  "💻",
  "📱",
  "🎓",
  "💍",
  "🏥",
  "🎯",
  "🌍",
  "🎸",
  "⛵",
  "🏋️",
  "🍕",
];
const GOAL_COLORS: {
  from: string;
  to: string;
  accent: string;
  bg: string;
  border: string;
}[] = [
  {
    from: "#6366f1",
    to: "#8b5cf6",
    accent: "#818cf8",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.2)",
  },
  {
    from: "#10b981",
    to: "#0d9488",
    accent: "#34d399",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
  {
    from: "#f59e0b",
    to: "#ef4444",
    accent: "#fbbf24",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  {
    from: "#3b82f6",
    to: "#6366f1",
    accent: "#60a5fa",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
  },
  {
    from: "#ec4899",
    to: "#f43f5e",
    accent: "#f472b6",
    bg: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.2)",
  },
  {
    from: "#06b6d4",
    to: "#3b82f6",
    accent: "#22d3ee",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// ── Animated Progress Ring ─────────────────────────────────────────────────────

const ProgressRing = ({
  pct,
  from,
  to,
  size = 72,
}: {
  pct: number;
  from: string;
  to: string;
  size?: number;
}) => {
  const [animated, setAnimated] = useState(false);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const gradId = `gr-${from.replace("#", "").slice(0, 6)}`;
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="7"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={animated ? circ * (1 - pct / 100) : circ}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="800"
        fill="#F0F4FF"
        fontFamily="monospace"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
};

// ── Velocity Engine ────────────────────────────────────────────────────────────

interface VelocityData {
  requiredPerMonth: number;
  estimatedMonthsAtPace: number;
  dynamicDeadline: Date | null;
  behindPace: boolean;
  recoveryMonths: number;
  pctOfMonth: number;
}

function computeVelocity(
  goal: SavingsGoal,
  monthlySavings: number,
): VelocityData {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const deadlineMs = goal.deadline
    ? new Date(goal.deadline).getTime() - Date.now()
    : null;
  const monthsToDeadline =
    deadlineMs !== null && deadlineMs > 0
      ? deadlineMs / (1000 * 60 * 60 * 24 * 30)
      : null;
  const requiredPerMonth =
    monthsToDeadline && monthsToDeadline > 0 ? remaining / monthsToDeadline : 0;
  const estimatedMonthsAtPace =
    monthlySavings > 0 ? remaining / monthlySavings : Infinity;
  const dynamicDeadline =
    monthlySavings > 0 && isFinite(estimatedMonthsAtPace)
      ? new Date(Date.now() + estimatedMonthsAtPace * 30 * 24 * 60 * 60 * 1000)
      : null;
  const behindPace = requiredPerMonth > 0 && monthlySavings < requiredPerMonth;
  const recoveryMonths =
    behindPace && requiredPerMonth > 0 && monthlySavings > 0
      ? Math.ceil(
          ((monthsToDeadline ?? 0) * (requiredPerMonth - monthlySavings)) /
            requiredPerMonth,
        )
      : 0;
  const pctOfMonth =
    requiredPerMonth > 0
      ? Math.min(150, (monthlySavings / requiredPerMonth) * 100)
      : 100;
  return {
    requiredPerMonth,
    estimatedMonthsAtPace,
    dynamicDeadline,
    behindPace,
    recoveryMonths,
    pctOfMonth,
  };
}

// ── Goal Modal ─────────────────────────────────────────────────────────────────

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (d: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    icon: string;
    colorIndex: number;
  }) => void;
  initial?: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    icon: string;
    colorIndex: number;
  };
  editing: boolean;
}

const GoalModal = ({
  open,
  onClose,
  onSave,
  initial,
  editing,
}: GoalModalProps) => {
  const [form, setForm] = useState(
    initial ?? {
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: "",
      icon: "🎯",
      colorIndex: 0,
    },
  );
  useState(() => {
    if (initial) setForm(initial);
  });
  const submit = () => {
    if (!form.name.trim()) {
      showError("Nome obrigatório.");
      return;
    }
    if (form.targetAmount <= 0) {
      showError("Valor alvo > 0.");
      return;
    }
    onSave(form);
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70"
          style={{ backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-lg rounded-3xl p-6 space-y-5 border border-white/[0.08]"
            style={{ background: "rgba(10,14,26,0.98)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">
                {editing ? "Editar" : "Nova"} Meta
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={14} className="text-white/50" />
              </button>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                Ícone
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className={`w-10 h-10 rounded-xl text-[18px] flex items-center justify-center transition-all ${form.icon === icon ? "bg-white text-black scale-110" : "bg-white/5"}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                Cor
              </label>
              <div className="flex gap-2">
                {GOAL_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setForm((f) => ({ ...f, colorIndex: i }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg,${c.from},${c.to})`,
                      outline:
                        form.colorIndex === i
                          ? `2px solid ${c.accent}`
                          : "none",
                      outlineOffset: 2,
                    }}
                  >
                    {form.colorIndex === i && (
                      <Check size={12} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                Nome
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Viagem de Férias..."
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                  Valor Alvo (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.targetAmount || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      targetAmount: Number(e.target.value),
                    }))
                  }
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                  Já Guardado (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.currentAmount || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currentAmount: Number(e.target.value),
                    }))
                  }
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                Prazo
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-2xl bg-white/5 text-white/50 text-xs font-black uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                className="flex-1 h-12 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg,${GOAL_COLORS[form.colorIndex]?.from ?? "#6366f1"},${GOAL_COLORS[form.colorIndex]?.to ?? "#8b5cf6"})`,
                }}
              >
                {editing ? "Salvar" : "Criar Meta"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Goal Card 2.0 ──────────────────────────────────────────────────────────────

const GoalCard = ({
  goal,
  colorCfg,
  monthlySavings,
  onEdit,
  onDelete,
  onAddMoney,
  canWrite,
}: {
  goal: SavingsGoal;
  colorCfg: (typeof GOAL_COLORS)[number];
  monthlySavings: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddMoney: (a: number) => void;
  canWrite: boolean;
}) => {
  const [simExtra, setSimExtra] = useState(0);
  const [showSim, setShowSim] = useState(false);

  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isComplete = pct >= 100;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null;
  const vel = useMemo(
    () => computeVelocity(goal, monthlySavings),
    [goal, monthlySavings],
  );

  const simMonths = useMemo(() => {
    if (!vel.dynamicDeadline || simExtra <= 0 || monthlySavings <= 0) return 0;
    const newMonths = remaining / (monthlySavings + simExtra);
    const currentMonths = vel.estimatedMonthsAtPace;
    return isFinite(currentMonths)
      ? Math.max(0, Math.round(currentMonths - newMonths))
      : 0;
  }, [vel, simExtra, monthlySavings, remaining]);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className="rounded-3xl overflow-hidden border transition-all"
      style={{ background: colorCfg.bg, borderColor: colorCfg.border }}
    >
      {/* Top strip */}
      <div className="h-1 w-full bg-white/[0.05]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full"
          style={{
            background: `linear-gradient(90deg,${colorCfg.from},${colorCfg.to})`,
          }}
        />
      </div>
      <div className="p-5 space-y-4">
        {/* Header: ring + info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <ProgressRing
              pct={pct}
              from={colorCfg.from}
              to={colorCfg.to}
              size={68}
            />
            <div className="absolute inset-0 flex items-center justify-center pb-4 pointer-events-none">
              <span className="text-lg">{goal.icon}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-[14px] font-black text-white tracking-tight truncate">
                {goal.name}
              </h4>
              {canWrite && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={onEdit}
                    className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={onDelete}
                    className="w-7 h-7 rounded-xl bg-rose-500/5 hover:bg-rose-500/15 flex items-center justify-center text-rose-400 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
            {isComplete ? (
              <span className="text-[9px] font-black text-emerald-400">
                ✓ Concluída!
              </span>
            ) : daysLeft !== null ? (
              <span
                className={`text-[9px] font-bold ${daysLeft < 30 ? "text-rose-400" : "text-white/30"}`}
              >
                {daysLeft > 0 ? `${daysLeft}d restantes` : "Prazo vencido"}
              </span>
            ) : null}
            <div className="text-[11px] text-white/40 mt-0.5">
              {formatCurrency(goal.currentAmount)}{" "}
              <span className="text-white/20">
                / {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Velocity Panel */}
        {!isComplete && (
          <div className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
                  Necessário/mês
                </div>
                <div
                  className="text-[13px] font-black font-mono"
                  style={{ color: colorCfg.accent }}
                >
                  {vel.requiredPerMonth > 0
                    ? formatCurrency(vel.requiredPerMonth)
                    : "Sem prazo"}
                </div>
              </div>
              <div>
                <div className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
                  Ritmo atual/mês
                </div>
                <div
                  className={`text-[13px] font-black font-mono ${vel.behindPace ? "text-rose-400" : "text-emerald-400"}`}
                >
                  {monthlySavings > 0 ? formatCurrency(monthlySavings) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
                  Conclusão Estimada
                </div>
                <div className="text-[11px] font-bold text-white/70">
                  {vel.dynamicDeadline
                    ? vel.dynamicDeadline.toLocaleDateString("pt-BR", {
                        month: "short",
                        year: "numeric",
                      })
                    : "Ritmo insuficiente"}
                </div>
              </div>
              <div>
                <div className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
                  Ritmo
                </div>
                <div className="flex items-center gap-1">
                  {vel.behindPace ? (
                    <TrendingDown size={12} className="text-rose-400" />
                  ) : (
                    <TrendingUp size={12} className="text-emerald-400" />
                  )}
                  <span
                    className={`text-[11px] font-bold ${vel.behindPace ? "text-rose-400" : "text-emerald-400"}`}
                  >
                    {Math.round(vel.pctOfMonth)}% do necessário
                  </span>
                </div>
              </div>
            </div>
            {vel.behindPace && vel.recoveryMonths > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                <AlertTriangle
                  size={11}
                  className="text-amber-400 flex-shrink-0"
                />
                <span className="text-[10px] text-amber-400/80">
                  Prazo pode atrasar ~{vel.recoveryMonths} meses no ritmo atual
                </span>
              </div>
            )}
          </div>
        )}

        {/* Acceleration Simulator */}
        {canWrite && !isComplete && (
          <div>
            <button
              onClick={() => setShowSim((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest w-full"
              style={{ color: colorCfg.accent }}
            >
              <Zap size={10} />
              Simulador de Aceleração
              {showSim ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            <AnimatePresence>
              {showSim && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 font-bold">
                        Poupança extra/mês
                      </span>
                      <span
                        className="text-[13px] font-black font-mono"
                        style={{ color: colorCfg.accent }}
                      >
                        {formatCurrency(simExtra)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(500, vel.requiredPerMonth * 2)}
                      step={50}
                      value={simExtra}
                      onChange={(e) => setSimExtra(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    {simExtra > 0 && (
                      <div
                        className="text-center py-2 px-3 rounded-xl"
                        style={{
                          background: `${colorCfg.from}18`,
                          border: `1px solid ${colorCfg.border}`,
                        }}
                      >
                        {simMonths > 0 ? (
                          <span
                            className="text-[12px] font-black"
                            style={{ color: colorCfg.accent }}
                          >
                            🚀 Termina {simMonths} meses antes!
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/40">
                            Impacto mínimo no prazo
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Quick add */}
        {canWrite && !isComplete && (
          <div className="flex gap-2">
            {[100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => onAddMoney(amt)}
                className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 border"
                style={{
                  background: `${colorCfg.from}15`,
                  borderColor: colorCfg.border,
                  color: colorCfg.accent,
                }}
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

// ── Portfolio Insights Banner ──────────────────────────────────────────────────

const InsightsBanner = ({
  goals,
  monthlySavings,
}: {
  goals: SavingsGoal[];
  monthlySavings: number;
}) => {
  const atRisk = goals.filter((g) => {
    if (g.currentAmount >= g.targetAmount) return false;
    const vel = computeVelocity(g, monthlySavings / Math.max(1, goals.length));
    return vel.behindPace;
  });
  if (!atRisk.length) return null;
  return (
    <motion.div
      variants={fadeUp}
      className="card-obsidian rounded-2xl p-4 flex items-start gap-3 border-amber-500/15 bg-amber-500/5"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={13} className="text-amber-400" />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-0.5">
          {atRisk.length} meta{atRisk.length > 1 ? "s" : ""} em risco de atraso
        </div>
        <div className="text-[11px] text-white/60 leading-relaxed">
          {atRisk.map((g) => g.name).join(", ")} — ritmo abaixo do necessário.
          Aumente contribuição ou ajuste o prazo.
        </div>
      </div>
    </motion.div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

export const GoalsSection = () => {
  const { goals, loading, addGoal, editGoal, deleteGoal, updateGoalProgress } =
    useGoals();
  const { totals } = useTransactions("personal");
  const { isViewer } = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const monthlySavings = Math.max(
    0,
    (totals?.income ?? 0) - (totals?.expense ?? 0),
  );

  const getColorIndex = (goal: SavingsGoal): number => {
    const s = goal.color ?? "";
    const m = s.match(/goal-color-(\d+)/);
    if (m) return Math.min(Number(m[1]), GOAL_COLORS.length - 1);
    const li = GOAL_COLORS.findIndex((c) =>
      s.includes(c.from.replace("#", "")),
    );
    return li >= 0 ? li : goals.indexOf(goal) % GOAL_COLORS.length;
  };

  const handleSave = async (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    icon: string;
    colorIndex: number;
  }) => {
    const dl =
      data.deadline ||
      new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    if (editingGoal) {
      await editGoal(editingGoal.id, {
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: dl,
        icon: data.icon,
      });
    } else {
      await addGoal({
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: dl,
        icon: data.icon,
        color: `goal-color-${data.colorIndex}`,
        category: "general",
        status: "active",
      });
    }
    showSuccess(editingGoal ? "Meta atualizada!" : "Meta criada! 🎯");
    setModalOpen(false);
    setEditingGoal(null);
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed = goals.filter(
    (g) => g.currentAmount >= g.targetAmount,
  ).length;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="text-white/30 text-sm">Carregando metas...</p>
      </div>
    );

  return (
    <>
      <GoalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSave}
        editing={!!editingGoal}
        initial={
          editingGoal
            ? {
                name: editingGoal.name ?? "",
                targetAmount: editingGoal.targetAmount,
                currentAmount: editingGoal.currentAmount,
                deadline: (editingGoal.deadline ?? "").split("T")[0] ?? "",
                icon: editingGoal.icon ?? "🎯",
                colorIndex: getColorIndex(editingGoal),
              }
            : undefined
        }
      />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <div className="card-obsidian relative overflow-hidden p-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                  <Target size={11} className="text-indigo-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                    Goals Engine 2.0
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Seus Objetivos
                </h2>
                <p className="text-xs text-white/30 mt-1">
                  Velocidade real · Prazo dinâmico · Simulações
                </p>
              </div>
              <button
                onClick={() => {
                  if (isViewer) {
                    showError("Somente leitura");
                    return;
                  }
                  setEditingGoal(null);
                  setModalOpen(true);
                }}
                disabled={isViewer}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all active:scale-95 shrink-0"
              >
                <Plus size={13} /> Nova Meta
              </button>
            </div>
            {goals.length > 0 && (
              <div className="relative z-10 flex gap-4 mt-5 pt-4 border-t border-white/5">
                {[
                  {
                    label: "Total alvo",
                    value: formatCurrency(totalTarget),
                    color: "text-white/60",
                  },
                  {
                    label: "Guardado",
                    value: formatCurrency(totalSaved),
                    color: "text-emerald-400",
                  },
                  {
                    label: "Concluídas",
                    value: `${completed}/${goals.length}`,
                    color: "text-indigo-400",
                  },
                  {
                    label: "Ritmo atual",
                    value: formatCurrency(monthlySavings) + "/m",
                    color:
                      monthlySavings > 0 ? "text-blue-400" : "text-rose-400",
                  },
                ].map((s) => (
                  <div key={s.label} className="flex-1 text-center">
                    <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold mb-1">
                      {s.label}
                    </div>
                    <div className={`text-sm font-black font-mono ${s.color}`}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Insights */}
        {goals.length > 0 && (
          <InsightsBanner goals={goals} monthlySavings={monthlySavings} />
        )}

        {/* Grid */}
        {goals.length === 0 ? (
          <motion.div variants={fadeUp}>
            <EmptyState
              icon={TrendingUp}
              title="Comece sua Jornada de Independência"
              description="Crie metas visuais para acompanhar sua evolução e realizar seus sonhos com clareza."
              actionLabel="Definir Primeira Meta"
              onAction={() => {
                if (!isViewer) {
                  setEditingGoal(null);
                  setModalOpen(true);
                }
              }}
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                colorCfg={
                  GOAL_COLORS[getColorIndex(goal)] ??
                  GOAL_COLORS[i % GOAL_COLORS.length]!
                }
                monthlySavings={monthlySavings / Math.max(1, goals.length)}
                onEdit={() => {
                  setEditingGoal(goal);
                  setModalOpen(true);
                }}
                onDelete={() => deleteGoal(goal.id)}
                onAddMoney={(amt) => {
                  if (isViewer) {
                    showError("Somente leitura");
                    return;
                  }
                  updateGoalProgress(
                    goal.id,
                    Math.min(goal.targetAmount, goal.currentAmount + amt),
                  );
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
