import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  Target,
  ListOrdered,
  Bot,
} from "lucide-react";
import React, { lazy, Suspense, useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { BottomNav } from "./components/layout/BottomNav";
import { LoginForm } from "./components/auth/LoginForm";
import { ToastProvider } from "./lib/toast";
import { GlobalLoadingProgress } from "./components/ui/GlobalLoadingProgress";
import { SkipToContent, ScreenReaderAnnouncer } from "./lib/accessibility";
import { useTour } from "./hooks/useTour";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MonitoringService } from "./lib/monitoring";
import { WorkspaceSwitcher } from "./components/ui/WorkspaceSwitcher";
import { X } from "lucide-react";
import { LaunchScreen } from "./components/transactions/LaunchScreen";
import { TransactionsView } from "./components/transactions/TransactionsView";
import { NotificationsView } from "./components/notifications/NotificationsView";
import { HealthSection } from "./components/health/HealthSection";
import type { TabType } from "./types/navigation";
import type { LucideIcon } from "lucide-react";

// Initialize monitoring
MonitoringService.init();

const GlobalDashboard = lazy(() =>
  import("./components/GlobalDashboard").then((m) => ({ default: m.GlobalDashboard }))
);

const PlanningView = lazy(() =>
  import("./components/planning/PlanningView").then((m) => ({ default: m.PlanningView }))
);

const InvestmentsSection = lazy(() =>
  import("./components/investments/InvestmentsSection").then((m) => ({ default: m.InvestmentsSection }))
);

const EducationSection = lazy(() =>
  import("./components/education/EducationSection").then((m) => ({ default: m.EducationSection }))
);

const AIAssistantView = lazy(() =>
  import("./components/ai/AIAssistantView").then((m) => ({ default: m.AIAssistantView }))
);

const SettingsSection = lazy(() =>
  import("./components/settings/SettingsSection").then((m) => ({ default: m.SettingsSection }))
);

import LoadingSkeleton from "./components/ui/LoadingSkeleton";
function LoadingFallback() { return <LoadingSkeleton />; }

const NavItem = ({
  active, icon: Icon, onClick,
}: { active: boolean; icon: LucideIcon; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`relative p-4 rounded-2xl transition-all duration-500 group ${
      active
        ? "text-primary shadow-[0_0_20px_rgba(14,165,233,0.15)]"
        : "text-slate-500 hover:text-white hover:bg-white/5"
    }`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} className="relative z-10" />
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
        initial={false}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )}
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  useLanguage();
  const { user, loading } = useAuth();
  const { startTour } = useTour();

  React.useEffect(() => {
    if (user && !loading) {
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, startTour]);

  if (loading) return <LoadingFallback />;
  if (!user) return <LoginForm />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      <SkipToContent />
      <ScreenReaderAnnouncer />
      <ToastProvider />
      <GlobalLoadingProgress />
      <div className="mesh-gradient" />

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-24 border-r border-border bg-black/20 backdrop-blur-3xl items-center py-10 gap-10">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/40"
          >
            <LayoutDashboard size={24} className="text-white" />
          </motion.div>
          <div className="w-full px-2">
            <WorkspaceSwitcher />
          </div>
          <div className="flex-1 flex flex-col gap-6 w-full px-4 mt-4">
            <NavItem active={activeTab === "overview"} icon={LayoutDashboard} onClick={() => setActiveTab("overview")} />
            <NavItem active={activeTab === "personal"} icon={ListOrdered} onClick={() => setActiveTab("personal")} />
            <NavItem active={activeTab === "planning"} icon={Target} onClick={() => setActiveTab("planning")} />
            <div className="h-px bg-white/10 mx-2" />
            <NavItem active={activeTab === "health"} icon={Bot} onClick={() => setActiveTab("health")} />
          </div>
          <div className="px-4 w-full">
            <NavItem active={activeTab === "settings"} icon={Settings} onClick={() => setActiveTab("settings")} />
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 overflow-y-auto scrollbar-hide pb-32 md:pb-12">
            {/* Mobile top header — hidden when on launch screen */}
            {activeTab !== "launch" && (
              <div className="md:hidden flex justify-between items-center w-full px-4 mb-2 pt-12">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/40">
                    <LayoutDashboard size={14} className="text-white" />
                  </div>
                  <span className="font-bold text-white text-sm tracking-tight">meu-contador</span>
                </div>
                <button
                  onClick={() => setActiveTab("notifications")}
                  style={{ background: "var(--glass2)", border: "1px solid var(--border)", width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  {/* unread dot */}
                  <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, background: "var(--red)", borderRadius: "50%", border: "1.5px solid var(--bg)" }} />
                </button>
              </div>
            )}

            <main
              id="main-content"
              className="pt-2 md:pt-0 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto"
              role="main"
              tabIndex={-1}
            >
              <ErrorBoundary featureName="Main Content">
                <Suspense fallback={<LoadingFallback />}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="w-full"
                    >
                      {activeTab === "overview" && <GlobalDashboard />}
                      {activeTab === "planning" && <PlanningView />}
                      {activeTab === "investments" && <InvestmentsSection />}
                      {activeTab === "education" && <EducationSection />}
                      {activeTab === "health" && <HealthSection />}
                      {activeTab === "launch" && (
                        <LaunchScreen onBack={setActiveTab} />
                      )}
                      {activeTab === "personal" && (
                        <TransactionsView onBack={setActiveTab} />
                      )}
                      {activeTab === "notifications" && (
                        <NotificationsView onBack={setActiveTab} />
                      )}
                      {activeTab === "settings" && <SettingsSection />}
                      {activeTab === "ai" && <AIAssistantView />}
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
