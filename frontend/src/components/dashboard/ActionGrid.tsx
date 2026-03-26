import React from "react";
import type { TabType } from "@/types/navigation";

interface ActionGridProps {
  onNavigate?: (tab: TabType) => void;
}

export const ActionGrid: React.FC<ActionGridProps> = ({ onNavigate }) => {
  const actions = [
    ['💸', 'Lançar\ngasto', 'launch'],
    ['📥', 'Receita', 'launch'],
    ['📊', 'Saúde', 'health'],
    ['🎯', 'Metas', 'planning']
  ] as const;

  return (
    <div className="qa-grid" style={{ marginBottom: "18px" }}>
      {actions.map(([ic, lb, route], i) => (
        <button key={i} className="qa" onClick={() => onNavigate?.(route as TabType)}>
          <div className="qa-ico">{ic}</div>
          <div className="qa-lbl" dangerouslySetInnerHTML={{ __html: lb.replace('\n', '<br>') }}></div>
        </button>
      ))}
    </div>
  );
};
