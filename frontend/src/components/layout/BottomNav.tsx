import { useState } from "react";
import { TAB_TO_PILLAR } from "@/types/navigation";
import type { TabType, PrimaryTab } from "@/types/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, Target, Sparkles, Flame, PiggyBank } from "lucide-react";

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenFunctions?: () => void;
}

// SVG icons — crisp, 1.6px stroke
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    stroke={active ? "#fff" : "rgba(148,163,184,0.7)"} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const BudgetIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    stroke={active ? "#fff" : "rgba(148,163,184,0.7)"} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2.5"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);

const FuturoIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    stroke={active ? "#fff" : "rgba(148,163,184,0.7)"} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

const AcademiaIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    stroke={active ? "#fff" : "rgba(148,163,184,0.7)"} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3.5 2 8.5 2 12 0v-5"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none"
    stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const NAV_ITEMS = [
  { id: "inicio"   as PrimaryTab, tab: "inicio"   as TabType,   label: "Início",   Icon: HomeIcon },
  { id: "budget"   as PrimaryTab, tab: "budget"   as TabType,   label: "Budget",   Icon: BudgetIcon },
  { id: "launch"   as PrimaryTab, tab: "launch"   as TabType,   label: null,       Icon: null }, // FAB
  { id: "futuro"   as PrimaryTab, tab: "investir" as TabType,   label: "Investir", Icon: FuturoIcon },
  { id: "academia" as PrimaryTab, tab: "academia" as TabType,   label: "Aprender", Icon: AcademiaIcon },
];

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  const activePillar = TAB_TO_PILLAR[currentTab] ?? "inicio";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      id="main-navigation"
      role="navigation"
      aria-label="Navegação principal"
      className="relative flex items-center justify-around w-full shrink-0 z-50 pt-1.5 px-2"
      style={{
        minHeight: 68,
        paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)",
        background: "rgba(5,8,18,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        boxShadow: "0 -1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isFAB = item.id === "launch";
        const isActive = !isFAB && activePillar === item.id;

        if (isFAB) {
          return (
            <button
              key="launch"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Menu Rápido"
              id="quick-actions-fab"
              className="flex-1 flex flex-col items-center justify-start border-none bg-transparent cursor-pointer pb-0.5 [-webkit-tap-highlight-color:transparent] relative z-10"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.08 }}
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center -translate-y-2.5 transition-[box-shadow,background] duration-250"
                style={{
                  background: currentTab === "launch"
                    ? "linear-gradient(145deg, #6366f1, #4f46e5)"
                    : "linear-gradient(145deg, #4f46e5, #4338ca)",
                  boxShadow: currentTab === "launch"
                    ? "0 0 0 4px rgba(99,102,241,0.25), 0 12px 28px rgba(79,70,229,0.55)"
                    : "0 8px 24px rgba(79,70,229,0.45), 0 0 0 1px rgba(99,102,241,0.3)",
                }}
              >
                <PlusIcon />
              </motion.div>
            </button>
          );
        }

        const { Icon, label, tab } = item;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(tab)}
            aria-label={label ?? ""}
            aria-current={isActive ? "page" : undefined}
            className="flex-1 min-w-0 flex flex-col items-center justify-start gap-[3px] pt-1 pb-0.5 border-none bg-transparent cursor-pointer [-webkit-tap-highlight-color:transparent] relative"
          >
            {/* Pill bg */}
            <div className="relative w-12 h-[30px] flex items-center justify-center">
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-[14px]"
                    style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(79,70,229,0.18))",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1, y: isActive ? -0.5 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {Icon && <Icon active={isActive} />}
              </motion.div>
            </div>

            {/* Label */}
            <motion.span
              animate={{
                color: isActive ? "#e0e7ff" : "rgba(100,116,139,0.75)",
                fontWeight: isActive ? 700 : 500,
              }}
              transition={{ duration: 0.15 }}
              className="text-[9px] tracking-[0.05em] uppercase leading-none font-[var(--font)]"
            >
              {label}
            </motion.span>
          </button>
        );
      })}

      {/* Speed Dial Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 pointer-events-auto"
              style={{
                background: "rgba(3, 7, 18, 0.75)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            />

            {/* Menu items */}
            <div
              className="absolute left-0 right-0 flex flex-col items-center gap-4 pointer-events-none pb-4"
              style={{ bottom: "calc(max(env(safe-area-inset-bottom, 12px), 12px) + 80px)" }}
            >
              {[
                { id: "ai",          label: "Consultar Advisor IA", icon: Sparkles,       color: "text-purple-400", bg: "bg-purple-500/20" },
                { id: "provisoes",   label: "Novo Cofrinho",        icon: PiggyBank,      color: "text-blue-400",   bg: "bg-blue-500/20"   },
                { id: "debt_payoff", label: "Projeto Quitação",     icon: Flame,          color: "text-rose-400",   bg: "bg-rose-500/20"   },
                { id: "planos",      label: "Nova Meta",            icon: Target,         color: "text-amber-400",  bg: "bg-amber-500/20"  },
                { id: "launch",      label: "Nova Transação",       icon: ArrowRightLeft, color: "text-emerald-400",bg: "bg-emerald-500/20"},
              ].map((action, i) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.8 }}
                  transition={{ delay: 0.05 * (4 - i), type: "spring", stiffness: 350, damping: 25 }}
                  onClick={() => { setIsMenuOpen(false); onTabChange(action.id as TabType); }}
                  className="flex items-center gap-3 pointer-events-auto rounded-[32px] px-6 py-2.5 pl-3 min-w-[220px]"
                  style={{
                    background: "rgba(30, 32, 45, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    transformOrigin: "bottom center",
                  }}
                >
                  <div className={`w-10 h-10 ${action.bg} rounded-full flex items-center justify-center shrink-0`}>
                    <action.icon size={20} className={action.color} />
                  </div>
                  <span className="text-white font-bold text-[14px]">{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Close FAB */}
            <motion.button
              initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full flex items-center justify-center border-none text-white pointer-events-auto z-10"
              style={{
                bottom: "calc(max(env(safe-area-inset-bottom, 12px), 12px) + 22px)",
                background: "linear-gradient(145deg, #ef4444, #dc2626)",
                boxShadow: "0 8px 24px rgba(220, 38, 38, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.3)",
              }}
            >
              <X size={26} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};