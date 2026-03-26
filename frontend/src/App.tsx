import { AnimatePresence, motion } from "framer-motion";
import { Settings } from "lucide-react";
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

// ─── Lazy Views ────────────────────────────────────────────
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
const AnalyticsDashboard = lazy(() =>
  import("./components/analytics/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard }))
);

import LoadingSkeleton from "./components/ui/LoadingSkeleton";
function LoadingFallback() { return <LoadingSkeleton />; }

// ─── App Root ──────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("inicio");
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

  const goHome = () => setActiveTab("inicio");
  const navTo = (t: TabType) => setActiveTab(t);
  const goBack = (to: TabType = "inicio") => setActiveTab(to);

  return (
    <>
      <SkipToContent />
      <ScreenReaderAnnouncer />
      <ToastProvider />
      <GlobalLoadingProgress />

      {/* Universal Mobile-First Layout */}
      <div style={{ height: "100dvh", background: "var(--bg)", display: "flex", justifyContent: "center" }}>
        <PhoneShell
          tabBar={<BottomNav currentTab={activeTab} onTabChange={setActiveTab} />}
        >
          {/* Settings shortcut header button (always accessible) */}
          {activeTab === "inicio" && (
            <button
              onClick={() => setActiveTab("settings")}
              aria-label="Configurações"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10,
                background: "var(--glass)",
                border: "1px solid var(--border)",
                borderRadius: "11px",
                padding: "8px",
                cursor: "pointer",
                color: "var(--t2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={18} />
            </button>
          )}

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
                  {/* ── Pilar 1: Início ── */}
                  {activeTab === "inicio"        && <GlobalDashboard onNavigate={navTo} />}
                  {activeTab === "health"        && <HealthSection onBack={goHome} />}
                  {activeTab === "notifications" && <NotificationsView onBack={goHome} />}

                  {/* ── Pilar 2: Budget / Caixa ── */}
                  {activeTab === "budget"          && <EnvelopesView onBack={goHome} onNavigate={navTo} />}
                  {activeTab === "caixa"           && <TransactionsView onBack={goHome} />}
                  {activeTab === "personal"        && <TransactionsView onBack={() => goBack("budget")} />}
                  {activeTab === "analytics"       && <AnalyticsDashboard transactions={transactions} />}
                  {activeTab === "envelopes"       && <EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />}
                  {activeTab === "envelope_detail" && <EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />}
                  {activeTab === "planos"          && <PlanningView onBack={goHome} onNavigate={navTo} />}
                  {activeTab === "planning"        && <PlanningView onBack={() => goBack("budget")} onNavigate={navTo} />}
                  {activeTab === "retirement"      && <RetirementView onBack={() => goBack("budget")} />}
                  {activeTab === "retire_fire"     && <RetireFireView onBack={() => goBack("retirement")} />}
                  {activeTab === "retire_proj"     && <RetireProjView onBack={() => goBack("retirement")} />}

                  {/* ── Pilar 4: Patrimônio / Investir ── */}
                  {activeTab === "investir"         && <InvestmentsSection onBack={goHome} />}
                  {activeTab === "investments"      && <InvestmentsSection onBack={() => goBack("investir")} />}
                  {activeTab === "invest_compostos" && <InvestCompostosView onBack={() => goBack("investir")} />}
                  {activeTab === "invest_dividas"   && <InvestDividasView onBack={() => goBack("investir")} />}

                  {/* ── Pilar 5: Academia ── */}
                  {activeTab === "academia"   && <EducationSection onBack={goHome} />}
                  {activeTab === "education"  && <EducationSection onBack={() => goBack("academia")} />}
                  {activeTab === "ai"         && <AIAssistantView onBack={() => goBack("academia")} />}

                  {/* ── Global / Modal ── */}
                  {activeTab === "launch"   && <LaunchScreen onBack={goHome} />}
                  {activeTab === "settings" && <SettingsSection onBack={goHome} />}
                  {activeTab === "profile"  && <SettingsSection onBack={goHome} />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </PhoneShell>
      </div>
    </>
  );
}
