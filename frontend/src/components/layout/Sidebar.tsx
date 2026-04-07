import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Wallet,
  TrendingUp,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Building2,
  Settings,
  Zap,
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
      { id: "inicio",     label: "Início",       icon: Home,        tab: "inicio" as TabType },
      { id: "personal",   label: "Transações",   icon: Wallet,      tab: "personal" as TabType },
      { id: "investir",   label: "Investimentos", icon: TrendingUp,  tab: "investir" as TabType },
    ],
  },
  {
    label: "Avançado",
    items: [
      { id: "business",   label: "Empresarial",  icon: Building2,   tab: "business" as TabType  },
      { id: "academia",   label: "Academia",     icon: GraduationCap, tab: "academia" as TabType },
    ],
  },
];

const Sidebar = ({ currentTab, onTabChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="h-screen flex-shrink-0 flex flex-col relative"
      style={{
        background: "rgba(5,8,18,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* ── Logo ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: collapsed ? "20px 16px" : "20px 20px",
          height: 68,
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
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
              style={{ overflow: "hidden", whiteSpace: "nowrap" }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px", fontFamily: "var(--font)" }}>
                Meu Contador
              </div>
              <div style={{ fontSize: 10, color: "rgba(148,163,184,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                Finanças com IA
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ─────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            {/* Group label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(100,116,139,0.55)",
                    padding: "4px 12px 6px",
                    fontFamily: "var(--font)",
                  }}
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || currentTab === item.tab;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.tab)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "9px 0" : "9px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(99,102,241,0.12))"
                      : "transparent",
                    position: "relative",
                    marginBottom: 2,
                    WebkitTapHighlightColor: "transparent",
                    fontFamily: "var(--font)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: 3,
                        borderRadius: 2,
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
                    style={{ flexShrink: 0, transition: "color 0.15s" }}
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          fontSize: 13.5,
                          fontWeight: isActive ? 600 : 450,
                          color: isActive ? "#e0e7ff" : "rgba(148,163,184,0.75)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          transition: "color 0.15s",
                          letterSpacing: "-0.1px",
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

      {/* ── Bottom ─────────────────────────── */}
      <div
        style={{
          padding: "8px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Settings */}
        <button
          onClick={() => onTabChange("settings")}
          aria-label="Configurações"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "9px 0" : "9px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            background: "transparent",
            WebkitTapHighlightColor: "transparent",
            fontFamily: "var(--font)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Settings size={17} strokeWidth={1.7} color="rgba(100,116,139,0.6)" style={{ flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: 13.5, fontWeight: 450, color: "rgba(148,163,184,0.65)", whiteSpace: "nowrap" }}
              >
                Configurações
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User */}
        <div style={{ padding: collapsed ? "4px 0" : "4px 4px" }}>
          <UserNav onNavigate={onTabChange} collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            background: "transparent",
            color: "rgba(100,116,139,0.45)",
            transition: "background 0.15s, color 0.15s",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.8)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(100,116,139,0.45)"; }}
        >
          {collapsed
            ? <ChevronRight size={15} strokeWidth={2} />
            : <ChevronLeft size={15} strokeWidth={2} />
          }
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
