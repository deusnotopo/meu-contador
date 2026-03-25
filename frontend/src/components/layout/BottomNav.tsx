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
    { id: "planning" as TabType, icon: Target, label: "Planejamento" },
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
            background: "rgba(0,0,0,0.5)", 
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            style={{
              background: "var(--bg)",
              borderRadius: "20px 20px 0 0",
              width: "100%",
              maxWidth: "400px",
              padding: "20px",
              paddingBottom: "100px",
              animation: "slideUp 0.3s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--t1)" }}>Mais opções</span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                style={{ 
                  background: "var(--glass2)", 
                  border: "none", 
                  borderRadius: "8px", 
                  padding: "8px",
                  cursor: "pointer",
                  color: "var(--t2)"
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {moreMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setShowMoreMenu(false);
                  }}
                  style={{
                    background: currentTab === item.id ? "var(--blue3)" : "var(--glass2)",
                    border: currentTab === item.id ? "1px solid var(--blue)" : "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                    position: "relative"
                  }}
                >
                  <item.icon size={24} style={{ color: currentTab === item.id ? "var(--blue)" : "var(--t2)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--t1)" }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "var(--blue)",
                      color: "#fff",
                      fontSize: "8px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px"
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

      {/* Bottom Navigation */}
      <div className="tabbar" style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {/* Início */}
        <div 
          className={cn("tab", currentTab === "overview" && "active")} 
          onClick={() => onTabChange("overview")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
        >
          <div className="tab-pip"><Home size={22} strokeWidth={2.5} /></div>
          <div className="tab-lbl">Início</div>
        </div>

        {/* Pessoal */}
        <div 
          className={cn("tab", currentTab === "personal" && "active")} 
          onClick={() => onTabChange("personal")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
        >
          <div className="tab-pip"><User size={22} strokeWidth={2.5} /></div>
          <div className="tab-lbl">Pessoal</div>
        </div>

        {/* Empresa */}
        <div 
          className={cn("tab", currentTab === "business" && "active")} 
          onClick={() => onTabChange("business")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
        >
          <div className="tab-pip"><Building2 size={22} strokeWidth={2.5} /></div>
          <div className="tab-lbl">Empresa</div>
        </div>
        
        {/* Lançar (Central FAB) */}
        <div 
          className={cn("tab", currentTab === "launch" && "active")} 
          onClick={() => onTabChange("launch")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Plus size={24} stroke="#fff" strokeWidth={2.5} />
          </div>
          <div className="tab-lbl" style={{ marginTop: "6px" }}>Lançar</div>
        </div>

        {/* Patrimônio */}
        <div 
          className={cn("tab", currentTab === "investments" && "active")} 
          onClick={() => onTabChange("investments")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
        >
          <div style={{ position: "relative" }}>
            <div className="tab-pip"><TrendingUp size={22} strokeWidth={2.5} /></div>
          </div>
          <div className="tab-lbl">Patrimônio</div>
        </div>

        {/* Saúde */}
        <div 
          className={cn("tab", currentTab === "health" && "active")} 
          onClick={() => onTabChange("health")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
        >
          <div className="tab-pip"><Heart size={22} strokeWidth={2.5} /></div>
          <div className="tab-lbl">Saúde</div>
        </div>

        {/* Mais */}
        <div 
          className={cn("tab", showMoreMenu && "active")} 
          onClick={() => setShowMoreMenu(true)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px" }}
        >
          <div className="tab-pip"><MoreHorizontal size={22} strokeWidth={2.5} /></div>
          <div className="tab-lbl">Mais</div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
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