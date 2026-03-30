import React from "react";
import type { TabType } from "@/types/navigation";

interface ActionGridProps {
  onNavigate?: (tab: TabType) => void;
}

const ACTIONS: { icon: string; label: string; route: TabType; color: string; bg: string }[] = [
  {
    icon: "⬆️",
    label: "Lançar",
    route: "launch",
    color: "var(--blue)",
    bg: "var(--blue3)",
  },
  {
    icon: "📊",
    label: "Extrato",
    route: "caixa",
    color: "var(--green)",
    bg: "var(--green-d)",
  },
  {
    icon: "📈",
    label: "Investir",
    route: "investir",
    color: "var(--purple)",
    bg: "var(--purple-d)",
  },
  {
    icon: "🗓️",
    label: "Calendário",
    route: "cash_flow",
    color: "var(--amber)",
    bg: "var(--amber-d)",
  },
];

export const ActionGrid: React.FC<ActionGridProps> = ({ onNavigate }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        marginBottom: 18,
      }}
    >
      {ACTIONS.map((action) => (
        <button
          key={action.route}
          onClick={() => onNavigate?.(action.route)}
          data-action-card="true"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "var(--font)",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: action.bg,
              border: `1px solid ${action.color}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              transition: "all 0.2s cubic-bezier(0.34,1.4,0.64,1)",
            }}
          >
            {action.icon}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--t2)",
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.2,
              letterSpacing: "0.02em",
            }}
          >
            {action.label}
          </div>
        </button>
      ))}
    </div>
  );
};
