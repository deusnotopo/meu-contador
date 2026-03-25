import React from "react";
import { cn } from "@/lib/utils";
import type { TabType } from "@/types/navigation";
import { Home, Mail, Plus, TrendingUp, PlayCircle } from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="tabbar">
      {/* Início */}
      <div 
        className={cn("tab", currentTab === "overview" && "active")} 
        onClick={() => onTabChange("overview")}
      >
        <div className="tab-pip"><Home size={22} strokeWidth={2.5} /></div>
        <div className="tab-lbl">Início</div>
      </div>

      {/* Budget */}
      <div 
        className={cn("tab", currentTab === "planning" && "active")} 
        onClick={() => onTabChange("planning")}
      >
        <div className="tab-pip"><Mail size={22} strokeWidth={2.5} /></div>
        <div className="tab-lbl">Budget</div>
      </div>
      
      {/* Lançar (Central FAB) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", top: "-16px" }}>
        <div className="tab-floater" onClick={() => onTabChange("launch")}>
          <Plus size={24} stroke="#fff" strokeWidth={2.5} />
        </div>
        <div className="tab-lbl" style={{ marginTop: "20px", color: "rgba(255,255,255,0.7)" }}>Lançar</div>
      </div>

      {/* Patrimônio */}
      <div 
        className={cn("tab", currentTab === "investments" && "active")} 
        onClick={() => onTabChange("investments")}
      >
        <div style={{ position: "relative" }}>
          <div className="tab-pip"><TrendingUp size={22} strokeWidth={2.5} /></div>
        </div>
        <div className="tab-lbl">Patrimônio</div>
      </div>

      {/* Academia */}
      <div 
        className={cn("tab", currentTab === "education" && "active")} 
        onClick={() => onTabChange("education")} 
        style={{ position: "relative" }}
      >
        <div className="tab-pip"><PlayCircle size={22} strokeWidth={2.5} /></div>
        <div className="tab-lbl">Academia</div>
        <div className="bdg bdg-b" style={{ position: "absolute", top: "-8px", right: "-12px", fontSize: "8px", padding: "2px 4px", borderRadius: "4px" }}>NOVO</div>
      </div>
    </div>
  );
};
