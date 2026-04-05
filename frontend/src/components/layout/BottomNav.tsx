import { TAB_TO_PILLAR } from "@/types/navigation";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { Lock } from "lucide-react";

import type { TabType, PrimaryTab } from "@/types/navigation";

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenFunctions?: () => void;
}

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  const { isEnabled } = useFeatureFlags();
  const activePillar = TAB_TO_PILLAR[currentTab] ?? "inicio";
  const isActive = (pillar: PrimaryTab) => activePillar === pillar;
  
  const isPatrimonioLocked = !isEnabled("premium_analytics");

  const baseTabStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    padding: "4px 0 2px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "var(--font)",
    WebkitTapHighlightColor: "transparent",
  };

  const pipStyle = (active: boolean): React.CSSProperties => ({
    width: 46,
    height: 28,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? "rgba(74,139,255,0.14)" : "transparent",
    transition: "all 0.25s ease",
  });

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 9,
    lineHeight: 1,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: active ? "#4A8BFF" : "rgba(136,153,196,0.72)",
  });

  const iconColor = (active: boolean) => (active ? "#4A8BFF" : "rgba(136,153,196,0.72)");

  return (
    <div
      className="tabbar"
      id="main-navigation"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        gap: 0,
        minHeight: 64,
        width: "100%",
        padding: "8px 4px 0",
        paddingBottom: "max(env(safe-area-inset-bottom, 10px), 10px)",
        background: "rgba(6,9,20,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        flexShrink: 0,
        overflow: "hidden",
        zIndex: 40,
      }}
    >

      {/* 1. Início */}
      <button
        className={`tab ${isActive("inicio") ? "active" : ""}`}
        onClick={() => onTabChange("inicio")}
        aria-label="Início"
        style={baseTabStyle}
      >
        <div className="tab-pip" style={pipStyle(isActive("inicio"))}>
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: iconColor(isActive("inicio")), strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </div>
        <span className="tab-lbl" style={labelStyle(isActive("inicio"))}>Início</span>
      </button>

      {/* 2. Budget (Envelopes) */}
      <button
        className={`tab ${isActive("budget") ? "active" : ""}`}
        onClick={() => onTabChange("budget")}
        aria-label="Budget"
        style={baseTabStyle}
      >
        <div className="tab-pip" style={pipStyle(isActive("budget"))}>
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: iconColor(isActive("budget")), strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <rect x="2" y="5" width="20" height="16" rx="2"/>
            <path d="M2 10l10 6 10-6"/>
          </svg>
        </div>
        <span className="tab-lbl" style={labelStyle(isActive("budget"))}>Budget</span>
      </button>

      {/* 3. Lançar (FAB Transbordante) */}
      <button
        className={`tab ${currentTab === "launch" ? "active" : ""}`}
        onClick={() => onTabChange("launch")}
        aria-label="Lançar"
        id="quick-actions-fab"
        style={{ ...baseTabStyle, zIndex: 10, position: "relative" }}
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
        <span className="tab-lbl" style={{ ...labelStyle(currentTab === "launch"), marginTop: "2px" }}>Lançar</span>
      </button>



      {/* 4. Futuro */}
      <button
        className={`tab ${isActive("futuro") ? "active" : ""}`}
        onClick={() => onTabChange("futuro")}
        aria-label="Futuro"
        style={{ ...baseTabStyle, opacity: isPatrimonioLocked && !isActive("futuro") ? 0.6 : 1 }}
      >
        <div className="tab-pip" style={{ ...pipStyle(isActive("futuro")), position: "relative" }}>
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: iconColor(isActive("futuro")), strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M12 3v18" />
            <path d="M7 8l5-5 5 5" />
            <path d="M7 16l5 5 5-5" opacity="0.45" />
          </svg>
          {isPatrimonioLocked && (
            <div style={{ position: "absolute", top: -4, right: -4, background: "#F59E0B", borderRadius: 4, width: 12, height: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={8} color="#000" strokeWidth={3} />
            </div>
          )}
        </div>
        <span className="tab-lbl" style={{ ...labelStyle(isActive("futuro")), display: "flex", alignItems: "center", gap: 2 }}>
          Futuro
          {isPatrimonioLocked && <span style={{ fontSize: 7, background: "rgba(245,158,11,0.2)", color: "#F59E0B", padding: "1px 3px", borderRadius: 3, fontWeight: "bold" }}>PRO</span>}
        </span>
      </button>

      {/* 5. Investir */}
      <button
        className={`tab ${isActive("futuro") && currentTab === "investir" ? "active" : ""}`}
        onClick={() => onTabChange("investir")}
        aria-label="Investir"
        style={baseTabStyle}
      >
        <div className="tab-pip" style={pipStyle(isActive("futuro"))}>
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: iconColor(isActive("futuro")), strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M12 2v20M17 5L9 12l8 7" />
          </svg>
        </div>
        <span className="tab-lbl" style={labelStyle(isActive("futuro"))}>Investir</span>
      </button>

      {/* 6. Academia */}
      <button
        className={`tab ${isActive("academia") ? "active" : ""}`}
        onClick={() => onTabChange("academia")}
        aria-label="Academia"
        style={{ ...baseTabStyle, position: "relative" }}
      >
        <div className="tab-pip" style={pipStyle(isActive("academia"))}>
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: iconColor(isActive("academia")), strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="tab-lbl" style={labelStyle(isActive("academia"))}>Academia</span>
      </button>
    </div>
  );
};