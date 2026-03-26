import React from "react";
import { TAB_TO_PILLAR } from "@/types/navigation";
import type { TabType, PrimaryTab } from "@/types/navigation";

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  const activePillar = TAB_TO_PILLAR[currentTab] ?? "inicio";

  const isActive = (pillar: PrimaryTab) => activePillar === pillar;

  return (
    <div className="tabbar">

      {/* 1. Início */}
      <button
        className={`tab ${isActive("inicio") ? "active" : ""}`}
        onClick={() => onTabChange("inicio")}
        aria-label="Início"
      >
        <div className="tab-pip">
          <svg viewBox="0 0 24 24">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </div>
        <span className="tab-lbl">Início</span>
      </button>

      {/* 2. Budget (Envelopes) */}
      <button
        className={`tab ${isActive("budget") ? "active" : ""}`}
        onClick={() => onTabChange("budget")}
        aria-label="Budget"
      >
        <div className="tab-pip">
          <svg viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="16" rx="2"/>
            <path d="M2 10l10 6 10-6"/>
          </svg>
        </div>
        <span className="tab-lbl">Budget</span>
      </button>

      {/* 3. FAB Central — Lançar (estilo elevado do protótipo V3) */}
      <button
        className={`tab ${currentTab === "launch" ? "active" : ""}`}
        onClick={() => onTabChange("launch")}
        aria-label="Lançar"
      >
        <div
          className="tab-pip"
          style={{
            background: "linear-gradient(135deg,#2F62D9,#5048E8)",
            borderRadius: "16px",
            width: "52px",
            height: "52px",
            marginTop: "-18px",
            boxShadow: "0 4px 16px rgba(80,72,232,0.5), 0 0 0 3px rgba(4,7,15,1)",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ stroke: "#fff" }}>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="tab-lbl" style={{ marginTop: "6px" }}>Lançar</span>
      </button>

      {/* 4. Patrimônio (Investimentos) */}
      <button
        className={`tab ${isActive("investir") ? "active" : ""}`}
        onClick={() => onTabChange("investir")}
        aria-label="Patrimônio"
      >
        <div className="tab-pip">
          <svg viewBox="0 0 24 24">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
        </div>
        <span className="tab-lbl">Patrimônio</span>
      </button>

      {/* 5. Academia */}
      <button
        className={`tab ${isActive("academia") ? "active" : ""}`}
        onClick={() => onTabChange("academia")}
        aria-label="Academia"
        style={{ position: "relative" }}
      >
        <div className="tab-pip">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="tab-lbl">Academia</span>
        <span className="tab-badge">3</span>
      </button>

    </div>
  );
};