import { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useOverlays } from "@/context/OverlayContext";
import { PremiumGate } from "@/components/ui/PremiumGate";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

import { WidgetErrorBoundary } from "@/components/ui/WidgetErrorBoundary";

import {
  AIAssistantView,
  AnalyticsDashboard,
  BusinessFinance,
  CashFlowCalendar,
  DebtPayoffPlanner,
  EducationSection,
  EnvelopesView,
  GlobalDashboard,
  HealthSection,
  InsurancePlanner,
  InvestCompostosView,
  InvestDividasView,
  InvestmentsDashboard,
  LaunchScreen,
  NotificationsView,
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
} from "./routes";

import type { TabType } from "@/types/navigation";

function LoadingFallback() { return <LoadingSkeleton />; }

export function AppRoutes() {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const { navigateTo: navTo, goBack: doGoBack } = useAppNavigate();
  const { setShowCelebration } = useOverlays();

  const goHome = () => navTo("inicio");
  const goBack = (to: TabType = "inicio") => doGoBack(to);
  const triggerCelebration = () => setShowCelebration(true);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: isDesktop ? 0 : 4, scale: isDesktop ? 1 : 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full h-full"
        >
          <WidgetErrorBoundary name="Main Route Viewport">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<GlobalDashboard onNavigate={navTo} />} />
              
              {/* Health / Check-in */}
              <Route path="/health" element={<HealthSection onBack={goHome} onNavigate={navTo} />} />
              <Route path="/health/personal-inflation" element={<PersonalInflation onBack={() => goBack("health")} />} />
              <Route path="/health/checkin" element={<FinancialCheckin onBack={() => goBack("health")} />} />
              <Route path="/health/insurance" element={<InsurancePlanner onBack={() => goBack("health")} />} />
              
              {/* Standalone Views */}
              <Route path="/notifications" element={<NotificationsView onBack={goHome} />} />
              <Route path="/mastery" element={<MasterySection onBack={() => goBack("inicio")} />} />
              <Route path="/settings" element={<SettingsSection onBack={goHome} />} />
              <Route path="/profile" element={<SettingsSection onBack={goHome} />} />
              <Route path="/launch" element={<LaunchScreen onBack={goHome} onSuccess={triggerCelebration} />} />

              {/* Budget & Cash Flow */}
              <Route path="/budget" element={<BudgetDashboard onNavigate={navTo} />} />
              <Route path="/budget/transactions" element={<TransactionsView onBack={() => goBack("budget")} />} />
              <Route path="/budget/personal" element={<TransactionsView onBack={() => goBack("budget")} />} />
              <Route path="/budget/analytics" element={<PremiumGate feature="premium_analytics"><AnalyticsDashboard /></PremiumGate>} />
              <Route path="/budget/envelopes" element={<EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />} />
              <Route path="/budget/envelopes/detail" element={<EnvelopesView onBack={() => goBack("budget")} onNavigate={navTo} />} />
              <Route path="/budget/cash-flow" element={<CashFlowCalendar onBack={() => goBack("budget")} onNavigate={navTo} />} />
              <Route path="/budget/provisions" element={<ProvisaoView onBack={() => goBack("budget")} />} />
              <Route path="/budget/debt-payoff" element={<DebtPayoffPlanner onBack={() => goBack("budget")} />} />

              {/* Future / Planning */}
              <Route path="/future" element={<RetirementView onBack={() => goBack("futuro")} />} />
              <Route path="/future/plans" element={<PlanningView onBack={() => goBack("futuro")} onNavigate={navTo} />} />
              <Route path="/future/planning" element={<PlanningView onBack={() => goBack("futuro")} onNavigate={navTo} />} />
              <Route path="/future/retirement" element={<RetirementView onBack={() => goBack("futuro")} />} />
              <Route path="/future/fire" element={<RetireFireView onBack={() => goBack("futuro")} />} />
              <Route path="/future/projection" element={<RetireProjView onBack={() => goBack("futuro")} />} />

              {/* Investments */}
              <Route path="/invest" element={<PremiumGate feature="investments"><InvestmentsDashboard onNavigate={navTo} /></PremiumGate>} />
              <Route path="/invest/portfolio" element={<PremiumGate feature="investments"><InvestmentsDashboard onNavigate={navTo} /></PremiumGate>} />
              <Route path="/invest/compound-interest" element={<PremiumGate feature="investments"><InvestCompostosView onBack={() => goBack("investir")} /></PremiumGate>} />
              <Route path="/invest/debt-vs-invest" element={<PremiumGate feature="investments"><InvestDividasView onBack={() => goBack("investir")} /></PremiumGate>} />

              {/* Academy & Education */}
              <Route path="/academy" element={<EducationSection onBack={() => goBack("inicio")} onNavigate={navTo} />} />
              <Route path="/academy/content" element={<EducationSection onBack={() => goBack("academia")} onNavigate={navTo} />} />
              <Route path="/academy/ai" element={<PremiumGate feature="ai_advisor"><AIAssistantView onBack={() => goBack("academia")} /></PremiumGate>} />

              {/* Business (Premium) */}
              <Route path="/business" element={<PremiumGate feature="invoices"><BusinessFinance /></PremiumGate>} />
              <Route path="/business/invoices" element={<PremiumGate feature="invoices"><BusinessFinance /></PremiumGate>} />

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WidgetErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}
