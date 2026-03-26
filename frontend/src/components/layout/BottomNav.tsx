import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { TabType } from "@/types/navigation";
import { Home, User, Building2, Plus, TrendingUp, Heart, MoreHorizontal, X, GraduationCap, Bot, BarChart3, Bell, Settings, Target } from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreMenuItems = [
    { id: "education" as TabType, icon: GraduationCap, label: "Academia", badge: "NOVO" },
    { id: "ai" as TabType, icon: Bot, label: "Assistente IA" },
    { id: "analytics" as TabType, icon: BarChart3, label: "Analytics" },
    { id: "notifications" as TabType, icon: Bell, label: "Notificações" },
    { id: "envelopes" as TabType, icon: Target, label: "Envelopes" },
    { id: "settings" as TabType, icon: Settings, label: "Configurações" },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(4,7,15,0.85)", 
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            style={{
              background: "var(--bg3)",
              borderRadius: "28px 28px 0 0",
              width: "100%",
              maxWidth: "400px",
              padding: "20px 16px 40px",
              borderTop: "1px solid var(--border2)",
              animation: "sheetUp 0.35s cubic-bezier(0.34, 1.1, 0.64, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ 
              width: "40px", 
              height: "4px", 
              background: "var(--glass3)", 
              borderRadius: "2px", 
              margin: "0 auto 20px" 
            }} />
            
            {/* Title */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "20px" 
            }}>
              <span style={{ 
                fontSize: "18px", 
                fontWeight: 700, 
                color: "var(--t1)" 
              }}>
                Mais opções
              </span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                style={{ 
                  background: "var(--glass2)", 
                  border: "none", 
                  borderRadius: "11px", 
                  padding: "8px",
                  cursor: "pointer",
                  color: "var(--t2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Menu Items Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "10px" 
            }}>
              {moreMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setShowMoreMenu(false);
                  }}
                  style={{
                    background: currentTab === item.id ? "var(--blue3)" : "var(--glass)",
                    border: currentTab === item.id ? "1px solid rgba(74,139,255,0.35)" : "1px solid var(--border)",
                    borderRadius: "18px",
                    padding: "16px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                    position: "relative",
                    fontFamily: "var(--font)"
                  }}
                >
                  <item.icon size={24} style={{ 
                    color: currentTab === item.id ? "var(--blue)" : "var(--t2)" 
                  }} />
                  <span style={{ 
                    fontSize: "10px", 
                    fontWeight: 600, 
                    color: "var(--t1)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em"
                  }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "var(--blue)",
                      color: "#fff",
                      fontSize: "8px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "6px",
                      fontFamily: "var(--mono)"
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - EXACT from finapp_v3 */}
      <div className="tabbar">
        {/* Início */}
        <button 
          className={`tab ${["overview", "health", "retirement", "notifications", "settings", "analytics", "ai", "profile", "design"].includes(currentTab) ? "active" : ""}`}
          onClick={() => onTabChange("overview")}
        >
          <div className="tab-pip">
            <svg viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
              <path d="M9 21V12h6v9"/>
            </svg>
          </div>
          <span className="tab-lbl">Início</span>
        </button>

        {/* Pessoal */}
        <button 
          className={`tab ${["personal", "envelopes", "envelope_detail"].includes(currentTab) ? "active" : ""}`}
          onClick={() => onTabChange("personal")}
        >
          <div className="tab-pip">
            <svg viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="16" rx="2"/>
              <path d="M2 10l10 6 10-6"/>
            </svg>
          </div>
          <span className="tab-lbl">Budget</span>
        </button>

        {/* Lançar (FAB Center) - EXACT from finapp_v3 */}
        <button 
          className={`tab-fab ${currentTab === "launch" ? "active" : ""}`}
          onClick={() => onTabChange("launch")}
        >
          <div className="tab-pip">
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="tab-lbl">Lançar</span>
        </button>

        {/* Patrimônio */}
        <button 
          className={`tab ${["investments", "invest_compostos", "invest_dividas"].includes(currentTab) ? "active" : ""}`}
          onClick={() => onTabChange("investments")}
        >
          <div className="tab-pip">
            <svg viewBox="0 0 24 24">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="tab-lbl">Patrimônio</span>
        </button>

        {/* Academia */}
        <button 
          className={`tab ${currentTab === "education" ? "active" : ""}`}
          onClick={() => onTabChange("education")}
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
          <span style={{
            position: "absolute",
            top: "4px",
            right: "8px",
            background: "var(--red)",
            color: "#fff",
            fontSize: "8px",
            fontWeight: 700,
            borderRadius: "6px",
            padding: "1px 5px",
            fontFamily: "var(--mono)",
            lineHeight: "1.4"
          }}>
            3
          </span>
        </button>
      </div>

      <style>{`
        @keyframes sheetUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};