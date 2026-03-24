import { cn } from "@/lib/utils";
import type { TabType } from "@/types/navigation";
import {
  Home,
  Mail,
  Plus,
  TrendingUp,
  GraduationCap,
} from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  const leftTabs = [
    { id: "overview" as TabType, label: "Início", icon: Home },
    { id: "planning" as TabType, label: "Budget", icon: Mail },
  ];
  const rightTabs = [
    { id: "investments" as TabType, label: "Patrimônio", icon: TrendingUp },
    { id: "education" as TabType, label: "Academia", icon: GraduationCap },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe" style={{ background: "rgba(4,7,15,0.94)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", borderTop: "1px solid rgba(255,255,255,0.065)" }}>
      <div className="relative flex items-start px-1 pt-2" style={{ height: "72px" }}>

        {/* Line gradient at top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(74,139,255,0.22),transparent)" }} />

        {/* Left tabs */}
        {leftTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center gap-1 pt-1 cursor-pointer border-none bg-transparent transition-all active:scale-90"
              style={{ fontFamily: "var(--font)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  background: isActive ? "rgba(74,139,255,0.12)" : "transparent",
                  transition: "all 0.3s cubic-bezier(0.34,1.3,0.64,1)",
                }}
              >
                <Icon
                  size={18}
                  stroke={isActive ? "var(--blue)" : "var(--t4)"}
                  strokeWidth={1.6}
                  fill="none"
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: isActive ? "var(--blue)" : "var(--t4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Central FAB — Lançar */}
        <div className="flex-1 flex flex-col items-center" style={{ position: "relative" }}>
          <button
            onClick={() => onTabChange("launch")}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg,#2F62D9,#5048E8)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: -18,
              boxShadow: "0 4px 16px rgba(80,72,232,0.5),0 0 0 3px rgba(4,7,15,1)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            <Plus size={22} stroke="#fff" strokeWidth={2.5} />
          </button>
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: "var(--t4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginTop: 6,
            }}
          >
            Lançar
          </span>
        </div>

        {/* Right tabs */}
        {rightTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center gap-1 pt-1 cursor-pointer border-none bg-transparent transition-all active:scale-90"
              style={{ fontFamily: "var(--font)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  background: isActive ? "rgba(74,139,255,0.12)" : "transparent",
                  transition: "all 0.3s cubic-bezier(0.34,1.3,0.64,1)",
                }}
              >
                <Icon
                  size={18}
                  stroke={isActive ? "var(--blue)" : "var(--t4)"}
                  strokeWidth={1.6}
                  fill="none"
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: isActive ? "var(--blue)" : "var(--t4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
