import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { BottomNav } from "./components/layout/BottomNav";
import Sidebar from "./components/layout/Sidebar";
import { useEffect as useEffectMedia, useState as useStateMedia } from "react";

/** Retorna true quando a largura da janela é >= 1024px */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useStateMedia(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );
  useEffectMedia(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}
import { LoginForm } from "./components/auth/LoginForm";
import { GlobalLoadingProgress } from "./components/ui/GlobalLoadingProgress";
import { SkipToContent, ScreenReaderAnnouncer } from "./lib/accessibility";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MonitoringService } from "./lib/monitoring";
import { useTransactions } from "./hooks/useTransactions";
import { useGamification } from "./hooks/useGamification";
import { PhoneShell } from "./components/layout/PhoneShell";
import type { TabType } from "./types/navigation";
import { TourProvider } from "./context/TourContext";
import { Celebration } from "./components/ui/Celebration";
import { LevelUpOverlay } from "./components/mastery/LevelUpOverlay";
import { AdviserOverlay, AdviserTrigger, useAdviser } from "./components/ai/AdviserOverlay";
import { SmartLaunchMenu } from "./components/layout/SmartLaunchMenu";
import { VoiceCommander } from "./components/ai/VoiceCommander";
import {
  AIAssistantView,
  AnalyticsDashboard,
  CashFlowCalendar,
  DebtPayoffPlanner,
  EducationSection,
  EnvelopesView,
  FunctionsHub,
  GlobalDashboard,
  HealthSection,
  InsurancePlanner,
  InvestCompostosView,
  InvestDividasView,
  InvestmentsSection,
  LaunchScreen,
  NotificationsView,
  OnboardingWizard,
  PersonalInflation,
  PlanningView,
  ProvisaoView,
  RetireFireView,
  RetireProjView,
  RetirementView,
  SettingsSection,
  TransactionsView,
  FinancialCheckin,
  MasterySection,
  BudgetDashboard,
  TAB_PATHS,
  PATH_TO_TAB,
} from "./app/routes";
import { PremiumGate } from "./components/ui/PremiumGate";

// Initialize monitoring
MonitoringService.init();

import LoadingSkeleton from "./components/ui/LoadingSkeleton";
function LoadingFallback() { return <LoadingSkeleton />; }

function resolveTabFromPath(pathname: string): TabType {
  return PATH_TO_TAB[pathname] ?? "inicio";
}

// ─── App Root ──────────────────────────────────────────────
export default function App() {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(() => resolveTabFromPath(location.pathname));
  const [showFunctions, setShowFunctions] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { user, loading } = useAuth();
  const { transactions } = useTransactions();
  const { isOpen: adviserOpen, open: openAdviser, close: closeAdviser } = useAdviser();
  const [isLaunchMenuOpen, setIsLaunchMenuOpen] = useState(false);
  const [voiceMenuActive, setVoiceMenuActive] = useState(false);

  const { claimDailyLogin } = useGamification();

  useEffect(() => {
    setActiveTab(resolveTabFromPath(location.pathname));
  }, [location.pathname]);

  const triggerCelebration = useCallback(() => {
    setShowCelebration(true);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const doneKey = `onboarding_done_${user.id}`;
      const done = localStorage.getItem(doneKey);
      const profileCompleted = user.onboardingCompleted;

      if (!done && !profileCompleted) {
        setShowWizard(true);
      }

      // Claim daily login reward
      claimDailyLogin();
    }
  }, [user, loading, claimDailyLogin]);

  const navTo = useCallback((t: TabType) => {
    setShowFunctions(false);
    if (t === "launch") {
      setIsLaunchMenuOpen(true);
      return;
    }
    navigate(TAB_PATHS[t]);
  }, [navigate]);

  const handleLaunchMenuAction = (action: "expense" | "income" | "voice" | "asset") => {
    setIsLaunchMenuOpen(false);
    if (action === "expense" || action === "income") {
      navigate(TAB_PATHS["launch"] + `?type=${action}`);
    } else if (action === "voice") {
       setVoiceMenuActive(true);
    } else if (action === "asset") {
       navigate(TAB_PATHS["investir"] + "?add=true");
    }
  };
  const goHome = useCallback(() => navTo("inicio"), [navTo]);
  const goBack = useCallback((to: TabType = "inicio") => navTo(to), [navTo]);

  const renderedView = (() => {
    switch (activeTab) {
      case "inicio": return <GlobalDashboard onNavigate={navTo} />;
      case "mastery": return <MasterySection onBack={() => goBack("inicio")} />;
      case "health": return <HealthSection onBack={goHome} onNavigate={navTo} />;
      case "personal_inflation": return <PersonalInflation onBack={() => goBack("health")} />;
      case "financial_checkin": return <FinancialCheckin onBack={() => goBack("health")} />;
      case "insurance_planner": return <InsurancePlanner onBack={() => goBack("health")} />;
      case "notifications": return <NotificationsView onBack={goHome} />;
      case "budget": return <BudgetDashboard onNavigate={navTo} />;
      case "caixa":
      case "personal": return <TransactionsView onBack={() => goBack(activeTab === "personal" ? "budget" : "inicio")} />;
      case "analytics": return (
        <PremiumGate feature="premium_analytics">
          <AnalyticsDashboard transactions={transactions} />
        </PremiumGate>
      );
      case "envelopes":
      case "envelope_detail": return <EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />;
      case "cash_flow": return <CashFlowCalendar onBack={() => goBack("budget")} onNavigate={navTo} />;
      case "futuro":
      case "retirement": return <RetirementView onBack={() => goBack(activeTab === "futuro" ? "futuro" : "futuro")} />;
      case "planos":
      case "planning": return <PlanningView onBack={() => goBack("futuro")} onNavigate={navTo} />;
      case "retire_fire": return <RetireFireView onBack={() => goBack("futuro")} />;
      case "retire_proj": return <RetireProjView onBack={() => goBack("futuro")} />;
      case "investir":
      case "investments": return (
        <PremiumGate feature="investments">
          <InvestmentsSection onNavigate={navTo} />
        </PremiumGate>
      );
      case "invest_compostos": return (
        <PremiumGate feature="investments">
          <InvestCompostosView onBack={() => goBack("investir")} />
        </PremiumGate>
      );
      case "invest_dividas": return (
        <PremiumGate feature="investments">
          <InvestDividasView onBack={() => goBack("investir")} />
        </PremiumGate>
      );
      // Academia: raiz volta para início; sub-rotas de conteúdo voltam para academia
      case "academia": return <EducationSection onBack={() => goBack("inicio")} onNavigate={navTo} />;
      case "education": return <EducationSection onBack={() => goBack("academia")} onNavigate={navTo} />;
      case "ai": return (
        <PremiumGate feature="ai_advisor">
          <AIAssistantView onBack={() => goBack("academia")} />
        </PremiumGate>
      );
      case "provisoes": return <ProvisaoView onBack={() => goBack("budget")} />;
      case "debt_payoff": return <DebtPayoffPlanner onBack={() => goBack("budget")} />;
      case "launch": return <LaunchScreen onBack={goHome} onSuccess={triggerCelebration} />;
      case "business":
      case "invoices": return (
        <PremiumGate feature="invoices">
          <GlobalDashboard onNavigate={navTo} />
        </PremiumGate>
      );
      case "settings":
      case "profile": return <SettingsSection onBack={goHome} />;
      default: return <GlobalDashboard onNavigate={navTo} />;
    }
  })();

  // Show login immediately — no blocking while session check runs in background.
  // A thin progress bar signals the auth check is in progress.
  if (!user) return <>
    {loading && (
      <div className="fixed top-0 left-0 right-0 z-[9999]">
        <div className="h-[3px] bg-gradient-to-r from-[var(--purple)] via-blue-400 to-[var(--purple)] animate-pulse w-full" />
      </div>
    )}
    <LoginForm />
  </>;


  const handleWizardComplete = () => {
    localStorage.setItem(`onboarding_done_${user.id}`, 'true');
    setShowWizard(false);
    triggerCelebration();
  };

  const handleWizardSkip = async () => {
    localStorage.setItem(`onboarding_done_${user.id}`, 'skipped');
    setShowWizard(false);
    // Persiste defaults mínimos no backend para evitar erros em campos obrigatórios
    try {
      await import('@/lib/api').then(({ api }) =>
        api.put('/users/onboarding', {
          profile: {
            lgpdConsent: false,
            investmentHorizon: 'medium',
            riskProfile: 'moderate',
            financialGoal: 'save',
            employmentType: 'clt',
            hasEmergencyFund: false,
            hasDebts: false,
          },
          budgets: [],
          goals: [],
          reminders: [],
          investments: [],
          historicalExpenses: [],
          completed: false,
          completedAt: new Date().toISOString(),
        })
      );
    } catch {
      // falha silenciosa — o usuário já fechou o wizard
    }
  };

  return (
    <TourProvider>
      <SkipToContent />
      <ScreenReaderAnnouncer />
      <GlobalLoadingProgress />
      <LevelUpOverlay />
      <Celebration isVisible={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* ─── Onboarding Wizard overlay ─────────────────────── */}
      {showWizard && (
        <Suspense fallback={<LoadingFallback />}>
          <OnboardingWizard 
            onComplete={handleWizardComplete} 
            onSkip={handleWizardSkip}
          />
        </Suspense>
      )}

      {/* ─── Main App Layout ────────────────────────────────── */}
      <ErrorBoundary featureName="AppShell">
        {/* Floating Adviser FAB */}
        <AdviserTrigger onClick={openAdviser} />
        <AdviserOverlay isOpen={adviserOpen} onClose={closeAdviser} />

        <PhoneShell
          tabBar={
            !isDesktop ? (
              <BottomNav
                currentTab={isLaunchMenuOpen ? "launch" : activeTab}
                onTabChange={navTo}
                onOpenFunctions={() => setShowFunctions(true)}
              />
            ) : undefined
          }
        >
          {/* Desktop Sidebar */}
          {isDesktop && (
            <Sidebar currentTab={activeTab} onTabChange={navTo} />
          )}

          <SmartLaunchMenu
            isOpen={isLaunchMenuOpen}
            onClose={() => setIsLaunchMenuOpen(false)}
            onAction={handleLaunchMenuAction}
          />
          {voiceMenuActive && (
            <VoiceCommander onClose={() => setVoiceMenuActive(false)} />
          )}
          <AnimatePresence>
            {showFunctions && (
              <>
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
                    <FunctionsHub onNavigate={navTo} />
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
                  initial={{ opacity: 0, y: isDesktop ? 0 : 4, scale: isDesktop ? 1 : 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="scontent w-full"
                  id="main-scontent"
                >
                  {renderedView}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </PhoneShell>
      </ErrorBoundary>
    </TourProvider>
  );
}
