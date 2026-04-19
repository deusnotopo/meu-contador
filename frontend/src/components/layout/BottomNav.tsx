import { TAB_TO_PILLAR } from "@/types/navigation";
import type { TabType, PrimaryTab } from "@/types/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppNavigate } from "@/hooks/useAppNavigate";

interface BottomNavProps {
  currentTab: TabType;
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

export const BottomNav = ({ currentTab }: BottomNavProps) => {
  const { navigateTo } = useAppNavigate();
  const activePillar = TAB_TO_PILLAR[currentTab] ?? "inicio";

  const handleTabChange = (t: TabType) => {
    navigateTo(t);
  };

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
              onClick={() => {
                navigateTo("launch");
              }}
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
            onClick={() => handleTabChange(tab)}
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
              className="text-[10px] tracking-wide capitalize leading-none font-[var(--font)]"
            >
              {label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
};