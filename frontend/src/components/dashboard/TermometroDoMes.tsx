/**
 * TermometroDoMes.tsx — "Termômetro do Mês" (Premium Rewrite)
 * Widget proativo com animações framer-motion, pulse semântico e Tailwind.
 * Verde = no controle | Amarelo = atenção | Vermelho = ação necessária
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { TabType } from "@/types/navigation";

interface TermometroProps {
  income: number;
  expense: number;
  balance: number;
  onNavigate?: (tab: TabType) => void;
}

const fmt = (n: number) =>
  "R$\u00a0" + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

type Status = "verde" | "amarelo" | "vermelho";

const STATUS_CONFIG = {
  verde: {
    emoji: "✅",
    label: "No controle",
    color: "var(--green)",
    // Tailwind color tokens
    tw: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/[0.06]",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-400/20",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      bar: "bg-emerald-400",
      pill: "bg-emerald-500/10",
      glow: "shadow-[0_0_24px_rgba(0,217,145,0.15)]",
      pulse: "",
    },
    tab: "budget" as TabType,
  },
  amarelo: {
    emoji: "⚠️",
    label: "Atenção",
    color: "var(--amber)",
    tw: {
      text: "text-amber-400",
      bg: "bg-amber-500/[0.06]",
      border: "border-amber-500/20",
      badge: "bg-amber-500/10 text-amber-400 border-amber-400/20",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      bar: "bg-amber-400",
      pill: "bg-amber-500/10",
      glow: "shadow-[0_0_24px_rgba(255,173,59,0.12)]",
      pulse: "animate-pulse",
    },
    tab: "envelopes" as TabType,
  },
  vermelho: {
    emoji: "🔥",
    label: "Acima do limite",
    color: "var(--red)",
    tw: {
      text: "text-rose-400",
      bg: "bg-rose-500/[0.06]",
      border: "border-rose-500/20",
      badge: "bg-rose-500/10 text-rose-400 border-rose-400/20",
      iconBg: "bg-rose-500/10 border-rose-500/20",
      bar: "bg-rose-400",
      pill: "bg-rose-500/10",
      glow: "shadow-[0_0_32px_rgba(255,79,110,0.18)]",
      pulse: "animate-pulse",
    },
    tab: "envelopes" as TabType,
  },
} satisfies Record<Status, object>;

export const TermometroDoMes: React.FC<TermometroProps> = ({
  income,
  expense,
  balance,
  onNavigate,
}) => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const monthProgress = dayOfMonth / daysInMonth;
  const budgetProgress = income > 0 ? expense / income : expense > 0 ? 999 : 0;
  const adjustedRatio = budgetProgress / (monthProgress || 0.01);

  const status: Status =
    adjustedRatio <= 1.05 ? "verde" : adjustedRatio <= 1.3 ? "amarelo" : "vermelho";

  const cfg = STATUS_CONFIG[status];
  const daysLeft = daysInMonth - dayOfMonth;
  const barPct = Math.min(100, budgetProgress * 100);

  const message =
    status === "verde"
      ? `Você gastou ${Math.round(budgetProgress * 100)}% da renda em ${Math.round(monthProgress * 100)}% do mês. Ótimo ritmo!`
      : status === "amarelo"
      ? `Ritmo de gasto ${Math.round(adjustedRatio * 100 - 100)}% acima do esperado. Ainda dá para ajustar.`
      : balance < 0
      ? `Saldo negativo de ${fmt(balance)}. Hora de cortar alguns gastos.`
      : "Gastando mais rápido que o esperado. Revise seus envelopes.";

  const stats = [
    { label: "Receita", value: fmt(income), colorClass: "text-emerald-400" },
    { label: "Gasto", value: fmt(expense), colorClass: status === "verde" ? "text-neutral-400" : cfg.tw.text },
    { label: "Saldo", value: fmt(balance), colorClass: balance >= 0 ? "text-emerald-400" : "text-rose-400" },
  ];

  return (
    <motion.button
      type="button"
      onClick={() => onNavigate?.(cfg.tab)}
      aria-label={`Termômetro do mês: ${cfg.label}. ${message}. Abrir ${cfg.label === "No controle" ? "fluxo" : "envelopes"}.`}
      className={`
        group relative w-full text-left rounded-[18px] border p-4
        cursor-pointer overflow-hidden
        transition-all duration-300
        hover:translate-y-[-1px] active:scale-[0.99]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
        ${cfg.tw.bg} ${cfg.tw.border} ${cfg.tw.glow}
      `}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* ── Animated bottom progress bar ─── */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.04] rounded-b-[18px] overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${cfg.tw.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }}
        />
      </div>

      {/* ── Pulse glow for danger states ─── */}
      {status !== "verde" && (
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[18px] ${cfg.tw.pulse}`}
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.color}18 0%, transparent 70%)` }}
          aria-hidden
        />
      )}

      {/* ── Main row ─── */}
      <div className="flex items-center gap-3 mb-3">
        {/* Status icon */}
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${cfg.tw.iconBg} ${status !== "verde" ? cfg.tw.pulse : ""
          }`}
          aria-hidden
        >
          {cfg.emoji}
        </div>

        {/* Label + message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-[11px] font-black uppercase tracking-widest ${cfg.tw.text}`}>
              Termômetro · {cfg.label}
            </span>
            <span className={`text-[10px] font-mono shrink-0 text-neutral-500`}>
              {daysLeft}d restam
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] text-neutral-400 leading-snug"
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={15}
          className="shrink-0 text-neutral-700 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all duration-200"
          aria-hidden
        />
      </div>

      {/* ── Mini stats pill row ─── */}
      <div className="grid grid-cols-3 gap-1 mt-1 rounded-xl overflow-hidden bg-white/[0.03]">
        {stats.map((item) => (
          <div key={item.label} className="py-2 px-2 text-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 mb-0.5">
              {item.label}
            </div>
            <div className={`text-[12px] font-black tabular-nums font-mono ${item.colorClass}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </motion.button>
  );
};
