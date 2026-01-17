import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/components/ui/WorkspaceSwitcher";
import {
  BookOpen,
  Briefcase,
  Building2,
  PieChart,
  Settings,
  User as LucideUser,
} from "lucide-react";
import type { TabType } from "@/types/navigation";

interface DesktopNavigationProps {
  currentTab: string;
  onTabChange: (tab: TabType) => void;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { t } = useLanguage();

  const navItems = [
    { id: "overview", label: t("nav.overview"), icon: PieChart },
    { id: "personal", label: t("nav.personal"), icon: LucideUser },
    { id: "business", label: t("nav.business"), icon: Building2 },
    { id: "investments", label: t("nav.investments"), icon: Briefcase },
    { id: "education", label: t("nav.education"), icon: BookOpen },
  ];

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 hidden md:flex" role="banner">
      <nav 
        className="flex items-center gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 pl-4 pr-6 border-r border-white/5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-indigo-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src="/logo-new.png"
              alt="Logo"
              className="w-8 h-8 object-contain relative z-10"
            />
          </div>
          <span className="font-heading font-bold text-sm tracking-tight text-white">
            MEU <span className="text-indigo-400">CONTADOR</span>
          </span>
        </div>

        <div className="flex items-center">
          {navItems.map((item) => (
          <Button
            key={item.id}
            variant={currentTab === item.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(item.id as TabType)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(item.id as TabType);
              }
            }}
            className={
              currentTab === item.id
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }
            aria-label={`Navigate to ${item.label}`}
            aria-current={currentTab === item.id ? 'page' : undefined}
            tabIndex={0}
          >
            <item.icon className="w-4 h-4 mr-2" aria-hidden="true" />
            {item.label}
          </Button>
        ))}
        </div>

        <div className="flex items-center gap-1 pl-2 border-l border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTabChange("settings")}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange("settings");
              }
            }}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
            aria-label="Open settings"
            aria-current={currentTab === "settings" ? 'page' : undefined}
            tabIndex={0}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </Button>
          <div className="w-1 h-4 bg-white/5 rounded-full mx-1" />
          <WorkspaceSwitcher />
        </div>
      </nav>
    </header>
  );
};

