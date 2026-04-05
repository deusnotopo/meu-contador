import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Building2,
  TrendingUp,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Target,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabType } from "@/types/navigation";
import { UserNav } from "./UserNav";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

const Sidebar = ({ currentTab, onTabChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isEnabled } = useFeatureFlags();

  const menuItems = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "personal", label: "Pessoal", icon: User },
    { id: "business", label: "Empresarial", icon: Building2, premium: true },
    { id: "planning", label: "Planejamento", icon: Target },
    { id: "investments", label: "Investimentos", icon: TrendingUp, premium: true },
    { id: "education", label: "Educação", icon: GraduationCap },
  ];

  const handleTabChange = (id: string, isPremium?: boolean) => {
    if (isPremium && !isEnabled("premium_analytics")) {
      // O PremiumGate dentro da view cuidará do modal se a rota for acessada,
      // mas vamos forçar a mudança de tab para que o usuário veja o portão.
      onTabChange(id as TabType);
      return;
    }
    onTabChange(id as TabType);
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "sidebar-nav h-screen flex-shrink-0 flex flex-col transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-effect shrink-0">
          <PieChart className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display text-xl font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
            >
              Meu Contador
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isLocked = item.premium && !isEnabled("premium_analytics");

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id, item.premium)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : isLocked 
                    ? "text-sidebar-foreground/40 hover:bg-sidebar-accent/30" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "animate-pulse-slow")} />
                {isLocked && (
                  <div className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full p-0.5 border border-sidebar-border shadow-sm">
                    <Lock className="w-2 h-2 text-black" />
                  </div>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "font-medium whitespace-nowrap overflow-hidden flex items-center gap-2",
                      isLocked && "italic"
                    )}
                  >
                    {item.label}
                    {isLocked && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md font-bold border border-amber-500/20">
                        PRO
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2 mt-auto border-t border-sidebar-border/10 flex flex-col justify-end pt-4">
        <UserNav onNavigate={onTabChange} collapsed={collapsed} />

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2.5 mt-2 rounded-xl text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
