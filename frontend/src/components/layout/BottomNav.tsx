import React from "react";
import { TAB_TO_PILLAR } from "@/types/navigation";
import type { TabType, PrimaryTab } from "@/types/navigation";

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenFunctions?: () => void;
}

export const BottomNav = ({ currentTab, onTabChange, onOpenFunctions }: BottomNavProps) => {
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

      {/* 3. Lançar (FAB Transbordante) */}
      <button
        className={`tab ${currentTab === "launch" ? "active" : ""}`}
        onClick={() => onTabChange("launch")}
        aria-label="Lançar"
        style={{ zIndex: 10 }}
      >
        <div style={{ position: "relative", width: "52px", height: "30px", display: "flex", justifyContent: "center" }}>
          <div
            className="tab-pip"
            style={{
              position: "absolute",
              bottom: "4px", /* Emerge acima do menu */
              background: "linear-gradient(135deg, #2F62D9, #5048E8)",
              color: "#fff",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              boxShadow: "0 8px 24px rgba(80,72,232,0.45), inset 0 2px 4px rgba(255,255,255,0.2)",
              display: "flex", alignContent: "center", justifyContent: "center"
            }}
          >
            <svg viewBox="0 0 24 24" style={{ stroke: "#fff", strokeWidth: 2, width: "26px", height: "26px", alignSelf: "center" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
        </div>
        <span className="tab-lbl" style={{ marginTop: "4px" }}>Lançar</span>
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
        <span className="tab-badge">9</span>
      </button>

      {/* 6. Funções — ícone grid que abre o hub como modal */}
      <button
        className="tab"
        onClick={onOpenFunctions}
        aria-label="Funções"
      >
        <div className="tab-pip">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <span className="tab-lbl">Mais</span>
      </button>

    </div>
  );
};