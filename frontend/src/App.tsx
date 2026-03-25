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
import { LaunchScreen } from "./components/transactions/LaunchScreen";
import { TransactionsView } from "./components/transactions/TransactionsView";
import { NotificationsView } from "./components/notifications/NotificationsView";
import { HealthSection } from "./components/health/HealthSection";
import { PhoneShell } from "./components/layout/PhoneShell";
import type { TabType } from "./types/navigation";

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

  React.useEffect(() => {
    if (user && !loading) {
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, startTour]);

  if (loading) return <LoadingFallback />;
  if (!user) return <LoginForm />;

  return (
    <>
      <SkipToContent />
      <ScreenReaderAnnouncer />
      <ToastProvider />
      <GlobalLoadingProgress />
      
      <PhoneShell
        tabBar={<BottomNav currentTab={activeTab} onTabChange={setActiveTab} />}
      >
        <ErrorBoundary featureName="Main Content">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                className="w-full"
              >
                {activeTab === "overview" && <GlobalDashboard onNavigate={setActiveTab} />}
                {activeTab === "planning" && <PlanningView />}
                {activeTab === "investments" && <InvestmentsSection />}
                {activeTab === "education" && <EducationSection />}
                {activeTab === "health" && <HealthSection onBack={setActiveTab} />}
                {activeTab === "launch" && <LaunchScreen onBack={setActiveTab} />}
                {activeTab === "personal" && <TransactionsView onBack={setActiveTab} />}
                {activeTab === "notifications" && <NotificationsView onBack={setActiveTab} />}
                {activeTab === "settings" && <SettingsSection onBack={setActiveTab} />}
                {activeTab === "ai" && <AIAssistantView onBack={setActiveTab} />}
                {activeTab === "retirement" && <RetirementView onBack={setActiveTab} />}
                {activeTab === "business" && <BusinessFinance />}
                {activeTab === "analytics" && <AnalyticsDashboard />}
                {activeTab === "profile" && <SettingsSection onBack={setActiveTab} />}
                {activeTab === "design" && <SettingsSection onBack={setActiveTab} />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </PhoneShell>
    </>
  );
}

