import { motion } from "framer-motion";
import type { TabType } from "@/types/navigation";

interface ActionGridProps {
  onNavigate?: (tab: TabType) => void;
}

const ACTIONS: {
  emoji: string;
  label: string;
  route: TabType;
  color: string;
  glow: string;
}[] = [
  { emoji: "➕", label: "Lançar",     route: "launch",     color: "#4A8BFF", glow: "rgba(74,139,255,0.25)"  },
  { emoji: "📊", label: "Extrato",    route: "personal",   color: "#10b981", glow: "rgba(16,185,129,0.25)" },
  { emoji: "📈", label: "Investir",   route: "investir",   color: "#9B7FFF", glow: "rgba(155,127,255,0.25)" },
  { emoji: "💰", label: "Budget",     route: "budget",     color: "#f59e0b", glow: "rgba(245,158,11,0.25)"  },
  { emoji: "🎓", label: "Aprender",   route: "academia",   color: "#6366f1", glow: "rgba(99,102,241,0.25)"  },
  { emoji: "📅", label: "Calendário", route: "cash_flow",  color: "#f43f5e", glow: "rgba(244,63,94,0.25)"   },
];

export const ActionGrid = ({ onNavigate }: ActionGridProps) => (
  <div className="grid grid-cols-6 gap-2">
    {ACTIONS.map((a, i) => (
      <motion.button
        key={a.route}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        onClick={() => onNavigate?.(a.route)}
        className="flex flex-col items-center gap-2 p-2 group"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px] transition-all duration-200 group-hover:shadow-lg"
          style={{
            background: `${a.color}18`,
            border: `1px solid ${a.color}30`,
            boxShadow: `0 0 0 0 ${a.glow}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 16px ${a.glow}`)}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0 ${a.glow}`)}
        >
          {a.emoji}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 group-hover:text-white/80 transition-colors text-center leading-tight">
          {a.label}
        </span>
      </motion.button>
    ))}
  </div>
);
