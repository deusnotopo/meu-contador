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
    <div className="tabbar" id="main-navigation">

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
        id="quick-actions-fab"
        style={{ zIndex: 10, position: "relative" }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: currentTab === "launch"
              ? "linear-gradient(135deg, #5048E8, #2F62D9)"
              : "linear-gradient(135deg, #2F62D9, #5048E8)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(80,72,232,0.45), inset 0 2px 4px rgba(255,255,255,0.2)",
            transform: "translateY(-10px)",
            transition: "all 0.25s cubic-bezier(0.34,1.4,0.64,1)",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" style={{ stroke: "#fff", strokeWidth: 2.2, width: 24, height: 24, fill: "none", strokeLinecap: "round" }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span className="tab-lbl" style={{ marginTop: "2px" }}>Lançar</span>
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