import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
  PieChart,
} from "lucide-react";
import React, { lazy, Suspense, useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { LoginForm } from "./components/auth/LoginForm";
import { ToastProvider } from "./lib/toast";
import { GlobalLoadingProgress } from "./components/ui/GlobalLoadingProgress";
import { SkipToContent, ScreenReaderAnnouncer } from "./lib/accessibility";
import { useTour } from "./hooks/useTour";
import { QuickActions } from "./components/QuickActions";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { loadTransactions } from "./lib/storage";
import { MonitoringService } from "./lib/monitoring";

// Initialize Silicon Valley Standard Monitoring
MonitoringService.init();

// Lazy load Dashboard to test
const GlobalDashboard = lazy(() =>
  import("./components/GlobalDashboard").then((m) => ({
    default: m.GlobalDashboard,
  }))
);

const PersonalFinance = lazy(() =>
  import("./components/personal/PersonalFinance").then((m) => ({
    default: m.PersonalFinance,
  }))
);

const BusinessFinance = lazy(() =>
  import("./components/business/BusinessFinance").then((m) => ({
    default: m.BusinessFinance,
  }))
);

const InvestmentsDashboard = lazy(() =>
  import("./components/investments/InvestmentsDashboard").then((m) => ({
    default: m.InvestmentsDashboard,
  }))
);

const AnalyticsDashboard = lazy(() =>
  import("./components/analytics/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  }))
);

const SettingsSection = lazy(() =>
  import("./components/settings/SettingsSection").then((m) => ({
    default: m.SettingsSection,
  }))
);

const DesignSystemShowcase = lazy(() =>
  import("./components/design/DesignSystemShowcase").then((m) => ({
    default: m.DesignSystemShowcase,
  }))
);

import LoadingSkeleton from "./components/ui/LoadingSkeleton";

function LoadingFallback() {
  return <LoadingSkeleton />;
}

import type { LucideIcon } from "lucide-react";

const NavItem = ({
  active,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  onClick: () => void;
}) => (
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
  const [activeTab, setActiveTab] = useState("dashboard");
  useLanguage(); // Context must be consumed
  const { user, loading } = useAuth();
  const { startTour } = useTour();

  React.useEffect(() => {
    if (user && !loading) {
      // Small delay to ensure DOM elements are ready
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
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-24 border-r border-border bg-black/20 backdrop-blur-3xl items-center py-10 gap-10">
           <motion.div 
             whileHover={{ scale: 1.05, rotate: 5 }}
             className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/40"
           >
             <LayoutDashboard size={24} className="text-white" />
           </motion.div>

           <div className="flex-1 flex flex-col gap-6 w-full px-4 mt-4">
              <NavItem active={activeTab === "dashboard"} icon={LayoutDashboard} onClick={() => setActiveTab("dashboard")} />
              <NavItem active={activeTab === "personal"} icon={User} onClick={() => setActiveTab("personal")} />
              <NavItem active={activeTab === "business"} icon={Building2} onClick={() => setActiveTab("business")} />
              <NavItem active={activeTab === "investments"} icon={BarChart3} onClick={() => setActiveTab("investments")} />
              <NavItem active={activeTab === "analytics"} icon={PieChart} onClick={() => setActiveTab("analytics")} />
              <div className="h-px bg-white/10 mx-2" />
              <NavItem active={activeTab === "design"} icon={Sparkles} onClick={() => setActiveTab("design")} />
           </div>

           <div className="px-4 w-full">
              <NavItem active={activeTab === "settings"} icon={Settings} onClick={() => setActiveTab("settings")} />
           </div>
        </div>

        {/* Mobile Navigation (Bottom) */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-around z-50 px-6 shadow-2xl">
           <NavItem active={activeTab === "dashboard"} icon={LayoutDashboard} onClick={() => setActiveTab("dashboard")} />
           <NavItem active={activeTab === "design"} icon={Sparkles} onClick={() => setActiveTab("design")} />
           <NavItem active={activeTab === "personal"} icon={User} onClick={() => setActiveTab("personal")} />
           <NavItem active={activeTab === "analytics"} icon={PieChart} onClick={() => setActiveTab("analytics")} />
           <NavItem active={activeTab === "investments"} icon={BarChart3} onClick={() => setActiveTab("investments")} />
           <NavItem active={activeTab === "settings"} icon={Settings} onClick={() => setActiveTab("settings")} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
           <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-12 pb-32 md:pb-12">
      <main
        id="main-content"
        className="pt-32 pb-32 md:pb-8 px-4 md:px-8 max-w-[1600px] mx-auto"
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
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20
                        }}
                        className="w-full"
                      >
                        {activeTab === "dashboard" && <GlobalDashboard />}
                        {activeTab === "personal" && <PersonalFinance />}
                        {activeTab === "business" && <BusinessFinance />}
                        {activeTab === "investments" && <InvestmentsDashboard />}
                        {activeTab === "analytics" && <AnalyticsDashboard transactions={loadTransactions()} />}
                        {activeTab === "settings" && <SettingsSection />}
                        {activeTab === "design" && <DesignSystemShowcase />}
                      </motion.div>
                   </AnimatePresence>
               </Suspense>
             </ErrorBoundary>
           </main>
           </div>
           {/* Quick Actions FAB */}
           <QuickActions 
             onNewTransaction={() => {
               // TODO: Open transaction form
               console.log('New transaction');
             }}
             onNewReminder={() => {
               // TODO: Open reminder form
               console.log('New reminder');
             }}
           />
        </div>
      </div>
    </div>
  );
}
