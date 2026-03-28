import { AnimatePresence, motion } from "framer-motion";
import React, { lazy, Suspense, useState, useEffect } from "react";
import { useLanguage } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { BottomNav } from "./components/layout/BottomNav";
import { LoginForm } from "./components/auth/LoginForm";
import { ToastProvider } from "./lib/toast";
import { GlobalLoadingProgress } from "./components/ui/GlobalLoadingProgress";
import { SkipToContent, ScreenReaderAnnouncer } from "./lib/accessibility";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MonitoringService } from "./lib/monitoring";
import { useTransactions } from "./hooks/useTransactions";
import { LaunchScreen } from "./components/transactions/LaunchScreen";
import { TransactionsView } from "./components/transactions/TransactionsView";
import { NotificationsView } from "./components/notifications/NotificationsView";
import { HealthSection } from "./components/health/HealthSection";
import { PersonalInflation } from "./components/health/PersonalInflation";
import { FinancialCheckin } from "./components/health/FinancialCheckin";
import { InsurancePlanner } from "./components/planning/InsurancePlanner";
import { PhoneShell } from "./components/layout/PhoneShell";
import type { TabType } from "./types/navigation";
import { TourProvider } from "./context/TourContext";
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
const FunctionsHub = lazy(() =>
  import("./components/FunctionsHub").then((m) => ({ default: m.FunctionsHub }))
);
const OnboardingWizard = lazy(() =>
  import("./components/onboarding/OnboardingWizard").then((m) => ({ default: m.OnboardingWizard }))
);

import LoadingSkeleton from "./components/ui/LoadingSkeleton";
function LoadingFallback() { return <LoadingSkeleton />; }

// ─── App Root ──────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("inicio");
  const [showFunctions, setShowFunctions] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  useLanguage();
  const { user, loading } = useAuth();
  const { transactions } = useTransactions();

  useEffect(() => {
    if (user && !loading) {
      const doneKey = `onboarding_done_${user.id}`;
      const done = localStorage.getItem(doneKey);
      const profileCompleted = (user as any).onboardingCompleted;

      if (!done && !profileCompleted) {
        setShowWizard(true);
      }
    }
  }, [user, loading]);

  if (loading) return <LoadingFallback />;
  if (!user) return <LoginForm />;

  const goHome = () => setActiveTab("inicio");
  const navTo = (t: TabType) => { setActiveTab(t); setShowFunctions(false); };
  const goBack = (to: TabType = "inicio") => setActiveTab(to);

  const handleWizardComplete = () => {
    localStorage.setItem(`onboarding_done_${user.id}`, 'true');
    setShowWizard(false);
  };

  const handleWizardSkip = () => {
    localStorage.setItem(`onboarding_done_${user.id}`, 'skipped');
    setShowWizard(false);
  };

  return (
    <TourProvider>
      <SkipToContent />
      <ScreenReaderAnnouncer />
      <ToastProvider />
      <GlobalLoadingProgress />

      {/* ─── Onboarding Wizard overlay ─────────────────────── */}
      {showWizard && (
        <Suspense fallback={<LoadingFallback />}>
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
            {/* Skip button — top right corner */}
            <button
              onClick={handleWizardSkip}
              style={{
                position: "absolute", top: 16, right: 16, zIndex: 101,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "20px",
                padding: "8px 14px",
                fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.5)",
                cursor: "pointer", fontFamily: "var(--font)",
              }}
            >
              Pular por agora →
            </button>
            <OnboardingWizard onComplete={handleWizardComplete} />
          </div>
        </Suspense>
      )}

      {/* ─── Main App Layout ────────────────────────────────── */}
      <div style={{ width: "100%", height: "100dvh", background: "var(--bg)", display: "flex", justifyContent: "center" }}>
        <PhoneShell
          tabBar={
            <BottomNav
              currentTab={activeTab}
              onTabChange={setActiveTab}
              onOpenFunctions={() => setShowFunctions(true)}
            />
          }
        >
          {/* ─── FunctionsHub Bottom Sheet Modal ───────────────── */}
          <AnimatePresence>
            {showFunctions && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="fn-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFunctions(false)}
                  style={{
                    position: "absolute", inset: 0, zIndex: 49,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                  }}
                />
                {/* Sheet */}
                <motion.div
                  key="fn-sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  style={{
                    position: "absolute", bottom: 0, left: 0,
                    width: "100%",
                    maxHeight: "85dvh",
                    zIndex: 50,
                    borderRadius: "28px 28px 0 0",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                  className="no-scrollbar"
                >
                  <Suspense fallback={<LoadingFallback />}>
                    <FunctionsHub
                      onNavigate={navTo}
                      onBack={() => setShowFunctions(false)}
                    />
                  </Suspense>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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
                  {activeTab === "health"        && <HealthSection onBack={goHome} onNavigate={navTo} />}
                  {activeTab === "personal_inflation" && <PersonalInflation onBack={() => goBack("health")} />}
                  {activeTab === "financial_checkin" && <FinancialCheckin onBack={() => goBack("health")} />}
                  {activeTab === "insurance_planner" && <InsurancePlanner onBack={() => goBack("health")} />}
                  {activeTab === "notifications" && <NotificationsView onBack={goHome} />}

                  {/* ── Pilar 2: Budget / Caixa ── */}
                  {activeTab === "budget"          && <EnvelopesView onBack={goHome} onNavigate={navTo} />}
                  {activeTab === "caixa"           && <TransactionsView onBack={goHome} />}
                  {activeTab === "personal"        && <TransactionsView onBack={() => goBack("budget")} />}
                  {activeTab === "analytics"       && <AnalyticsDashboard transactions={transactions} />}
                  {activeTab === "envelopes"       && <EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />}
                  {activeTab === "envelope_detail" && <EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />}

                  {/* ── Pilar 3: Futuro ── */}
                  {activeTab === "futuro"       && <RetirementView onBack={goHome} />}
                  {activeTab === "planos"        && <PlanningView onBack={() => goBack("futuro")} onNavigate={navTo} />}
                  {activeTab === "planning"      && <PlanningView onBack={() => goBack("futuro")} onNavigate={navTo} />}
                  {activeTab === "retirement"    && <RetirementView onBack={() => goBack("futuro")} />}
                  {activeTab === "retire_fire"   && <RetireFireView onBack={() => goBack("futuro")} />}
                  {activeTab === "retire_proj"   && <RetireProjView onBack={() => goBack("futuro")} />}

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
    </TourProvider>
  );
}
