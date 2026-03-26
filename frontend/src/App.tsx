import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
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
import { useTransactions } from "./hooks/useTransactions";
import { LaunchScreen } from "./components/transactions/LaunchScreen";
import { TransactionsView } from "./components/transactions/TransactionsView";
import { NotificationsView } from "./components/notifications/NotificationsView";
import { HealthSection } from "./components/health/HealthSection";
import { PhoneShell } from "./components/layout/PhoneShell";
import type { TabType } from "./types/navigation";
import "./styles/finapp-v3.css";

// Initialize monitoring
MonitoringService.init();

const GlobalDashboard = lazy(() =>
  import("./components/GlobalDashboard").then((m) => ({ default: m.GlobalDashboard }))
);

const PlanningView = lazy(() =>
  import("./components/planning/PlanningView").then((m) => ({ default: m.PlanningView }))
);

const EnvelopesView = lazy(() =>
  import("./components/planning/EnvelopesView").then((m) => ({ default: m.EnvelopesView }))
);

const InvestCompostosView = lazy(() =>
  import("./components/investments/InvestCompostosView").then((m) => ({ default: m.InvestCompostosView }))
);

const InvestDividasView = lazy(() =>
  import("./components/investments/InvestDividasView").then((m) => ({ default: m.InvestDividasView }))
);

const RetireFireView = lazy(() =>
  import("./components/planning/RetireFireView").then((m) => ({ default: m.RetireFireView }))
);

const RetireProjView = lazy(() =>
  import("./components/planning/RetireProjView").then((m) => ({ default: m.RetireProjView }))
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

const RetirementView = lazy(() =>
  import("./components/planning/RetirementView").then((m) => ({ default: m.RetirementView }))
);

const BusinessFinance = lazy(() =>
  import("./components/business/BusinessFinance").then((m) => ({ default: m.BusinessFinance }))
);

const AnalyticsDashboard = lazy(() =>
  import("./components/analytics/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard }))
);

import LoadingSkeleton from "./components/ui/LoadingSkeleton";
function LoadingFallback() { return <LoadingSkeleton />; }

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  useLanguage();
  const { user, loading } = useAuth();
  const { startTour } = useTour();
  const { transactions } = useTransactions();

  React.useEffect(() => {
    if (user && !loading) {
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, startTour]);

  if (loading) return <LoadingFallback />;
  if (!user) return <LoginForm />;

  const handleBack = () => setActiveTab("overview");

  return (
    <>
      <SkipToContent />
      <ScreenReaderAnnouncer />
      <ToastProvider />
      <GlobalLoadingProgress />
      
      {/* Universal Mobile-First Layout for All Devices (Maintaining FinApp Essence) */}
      <div 
         style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', justifyContent: 'center' }}
      >
        <PhoneShell
          tabBar={<BottomNav currentTab={activeTab} onTabChange={setActiveTab} />}
        >
          <ErrorBoundary featureName="Main Content">
            <Suspense fallback={<LoadingFallback />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="w-full"
                >
                  {activeTab === "overview" && <GlobalDashboard onNavigate={setActiveTab} />}
                  {activeTab === "envelopes" && <EnvelopesView onBack={handleBack} onNavigate={(t) => setActiveTab(t)} />}
                  {activeTab === "envelope_detail" && <EnvelopesView onBack={handleBack} onNavigate={(t) => setActiveTab(t)} />}
                  {activeTab === "investments" && <InvestmentsSection onBack={handleBack} />}
                  {activeTab === "invest_compostos" && <InvestCompostosView onBack={() => setActiveTab("investments")} />}
                  {activeTab === "invest_dividas" && <InvestDividasView onBack={() => setActiveTab("investments")} />}
                  {activeTab === "retirement" && <RetirementView onBack={handleBack} />}
                  {activeTab === "retire_fire" && <RetireFireView onBack={() => setActiveTab("retirement")} />}
                  {activeTab === "retire_proj" && <RetireProjView onBack={() => setActiveTab("retirement")} />}
                  {activeTab === "education" && <EducationSection onBack={handleBack} />}
                  {activeTab === "health" && <HealthSection onBack={handleBack} />}
                  {activeTab === "launch" && <LaunchScreen onBack={handleBack} />}
                  {activeTab === "personal" && <TransactionsView onBack={handleBack} />}
                  {activeTab === "notifications" && <NotificationsView onBack={handleBack} />}
                  {activeTab === "settings" && <SettingsSection onBack={handleBack} />}
                  {activeTab === "ai" && <AIAssistantView onBack={handleBack} />}
                  {activeTab === "business" && <BusinessFinance />}
                  {activeTab === "analytics" && <AnalyticsDashboard transactions={transactions} />}
                  {activeTab === "profile" && <SettingsSection onBack={handleBack} />}
                  {activeTab === "design" && <SettingsSection onBack={handleBack} />}
                  {activeTab === "planning" && <PlanningView onBack={handleBack} onNavigate={(t) => setActiveTab(t)} />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </PhoneShell>
      </div>
    </>
  );

}

