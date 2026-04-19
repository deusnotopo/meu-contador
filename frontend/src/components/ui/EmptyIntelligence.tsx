/**
 * EmptyIntelligence.tsx — Phase 33
 * ─────────────────────────────────
 * Reusable premium empty state for all intelligence/analytics
 * components that currently return null when data is absent.
 * Provides a beautiful, educational prompt that guides the user
 * to take action (add transactions, investments, goals, etc.).
 */

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyIntelligenceProps {
  icon: LucideIcon;
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: string;          // dominant color (default indigo)
  compact?: boolean;       // smaller version for inline cards
}

export const EmptyIntelligence = ({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  color = "#818CF8",
  compact = false,
}: EmptyIntelligenceProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
        >
          <Icon size={13} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-white/50">{title}</div>
          <div className="text-[9px] text-white/25 leading-relaxed">{description}</div>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ color, backgroundColor: `${color}12`, border: `1px solid ${color}25` }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0A0E1A] to-[#060912] p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}15` }}
      >
        <span className="text-2xl">{emoji}</span>
      </motion.div>
      <div className="text-[13px] font-black text-white/70 mb-1.5">{title}</div>
      <div className="text-[11px] text-white/30 leading-relaxed max-w-[280px] mx-auto mb-5">
        {description}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
          style={{
            color: "#fff",
            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
            boxShadow: `0 4px 20px ${color}40`,
          }}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
