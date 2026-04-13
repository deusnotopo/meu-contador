import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Wallet, TrendingUp, GraduationCap,
  ChevronLeft, ChevronRight, Building2, Settings, Zap,
} from "lucide-react";

import type { TabType } from "@/types/navigation";
import { UserNav } from "./UserNav";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { id: "inicio",   label: "Início",        icon: Home,          tab: "inicio"   as TabType },
      { id: "personal", label: "Transações",    icon: Wallet,        tab: "personal" as TabType },
      { id: "investir", label: "Investimentos", icon: TrendingUp,    tab: "investir" as TabType },
    ],
  },
  {
    label: "Avançado",
    items: [
      { id: "business", label: "Empresarial", icon: Building2,     tab: "business" as TabType },
      { id: "academia", label: "Aprender",    icon: GraduationCap, tab: "academia" as TabType },
    ],
  },
];

const navBtnShared = "w-full flex items-center border-none rounded-[10px] cursor-pointer transition-[background,color] duration-150 [-webkit-tap-highlight-color:transparent] font-[var(--font)] group";

const Sidebar = ({ currentTab, onTabChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="h-screen flex-shrink-0 flex flex-col relative overflow-hidden"
      style={{
        background: "rgba(5,8,18,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 h-[68px] shrink-0 border-b border-white/5"
        style={{ padding: collapsed ? "20px 16px" : "20px 20px" }}
      >
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 4px 12px rgba(79,70,229,0.35)",
          }}
        >
          <Zap size={16} color="#fff" strokeWidth={2.2} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="text-[15px] font-bold text-[#f1f5f9] tracking-[-0.3px]">Meu Contador</div>
              <div className="text-[10px] text-[rgba(148,163,184,0.5)] tracking-[0.06em] uppercase font-semibold">Finanças com IA</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-[rgba(100,116,139,0.55)] px-3 py-1 pb-1.5"
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || currentTab === item.tab;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.tab)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`${navBtnShared} mb-0.5
                    ${collapsed ? "justify-center px-0 py-[9px]" : "justify-start px-3 py-[9px]"}
                    ${isActive
                      ? "bg-[linear-gradient(135deg,rgba(79,70,229,0.22),rgba(99,102,241,0.12))]"
                      : "bg-transparent hover:bg-white/[0.04]"}
                    relative`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-[2px]"
                      style={{
                        background: "linear-gradient(180deg, #6366f1, #4f46e5)",
                        boxShadow: "0 0 8px rgba(99,102,241,0.6)",
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.1 : 1.7}
                    color={isActive ? "#a5b4fc" : "rgba(100,116,139,0.7)"}
                    className="shrink-0 transition-colors duration-150"
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13.5px] whitespace-nowrap overflow-hidden transition-colors duration-150 tracking-[-0.1px]"
                        style={{
                          fontWeight: isActive ? 600 : 450,
                          color: isActive ? "#e0e7ff" : "rgba(148,163,184,0.75)",
                        }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="p-2 border-t border-white/5 flex flex-col gap-1">
        {/* Settings */}
        <button
          onClick={() => onTabChange("settings")}
          aria-label="Configurações"
          className={`${navBtnShared} bg-transparent hover:bg-white/[0.04]
            ${collapsed ? "justify-center px-0 py-[9px]" : "justify-start px-3 py-[9px]"}`}
        >
          <Settings size={17} strokeWidth={1.7} color="rgba(100,116,139,0.6)" className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[13.5px] whitespace-nowrap text-[rgba(148,163,184,0.65)]"
                style={{ fontWeight: 450 }}
              >
                Configurações
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User */}
        <div className={collapsed ? "py-1" : "p-1"}>
          <UserNav onNavigate={onTabChange} collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="w-full flex items-center justify-center p-2 border-none rounded-[10px] cursor-pointer bg-transparent text-[rgba(100,116,139,0.45)] transition-[background,color] duration-150 hover:bg-white/[0.04] hover:text-[rgba(148,163,184,0.8)] [-webkit-tap-highlight-color:transparent]"
        >
          {collapsed ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronLeft size={15} strokeWidth={2} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
