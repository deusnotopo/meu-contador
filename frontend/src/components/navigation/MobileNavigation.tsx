import React from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Home,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { TabType } from "@/types/navigation";

interface MobileNavigationProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const navItems = [
    { id: "inicio", icon: Home, label: "Início" },
    { id: "budget", icon: Wallet, label: "Finanças" },
    { id: "investir", icon: TrendingUp, label: "Patrimônio" },
    { id: "academia", icon: GraduationCap, label: "Academia" },
    { id: "settings", icon: Settings, label: "Ajustes" },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-6 left-4 right-4 z-50 glass-premium rounded-[2rem] border border-white/10 shadow-2xl p-2 pb-safe pt-2"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(tab.id as TabType);
              }
            }}
            className={`relative flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-500 ${
              currentTab === tab.id
                ? "text-indigo-400"
                : "text-neutral-500 hover:text-neutral-500"
            }`}
            aria-label={`Navigate to ${tab.label}`}
            aria-current={currentTab === tab.id ? 'page' : undefined}
            tabIndex={0}
          >
            <tab.icon
              size={22}
              className={`transition-transform duration-500 ${
                currentTab === tab.id ? "scale-110" : "scale-100"
              }`}
              aria-hidden="true"
            />
            <span className="text-[8px] font-black uppercase tracking-[0.1em] mt-1.5">
              {tab.label}
            </span>

            {currentTab === tab.id && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute inset-0 bg-indigo-500/10 rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

