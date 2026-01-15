import { Button } from "@/components/ui/button";
import { isOnboardingComplete, saveOnboarding } from "@/lib/onboarding";
import { checkRecurringTransactions } from "@/lib/recurrence";
import { loadTransactions } from "@/lib/storage";
import { ToastProvider } from "@/lib/toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  PieChart,
  Settings,
  User,
} from "lucide-react";
import React, { Suspense, lazy, useEffect, useState } from "react";
import { VoiceCommander } from "./components/ai/VoiceCommander";
import { LoginForm } from "./components/auth/LoginForm";
import { HelpCenter } from "./components/support/HelpCenter";
import { SyncIndicator } from "./components/ui/SyncIndicator";
import { WorkspaceSwitcher } from "./components/ui/WorkspaceSwitcher";
import { CardSkeleton } from "./components/ui/skeleton";
import { useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useCloudSync } from "./hooks/useCloudSync";
import { loadReminders } from "./lib/storage";

// Lazy load heavy components
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
const OnboardingWizard = lazy(() =>
  import("./components/onboarding/OnboardingWizard").then((m) => ({
    default: m.OnboardingWizard,
  }))
);
const EducationSection = lazy(() =>
  import("./components/education/EducationSection").then((m) => ({
    default: m.EducationSection,
  }))
);
const InvestmentsDashboard = lazy(() =>
  import("./components/investments/InvestmentsDashboard").then((m) => ({
    default: m.InvestmentsDashboard,
  }))
);
const PremiumPlans = lazy(() =>
  import("./components/subscription/PremiumPlans").then((m) => ({
    default: m.PremiumPlans,
  }))
);
const SettingsSection = lazy(() =>
  import("./components/settings/SettingsSection").then((m) => ({
    default: m.SettingsSection,
  }))
);

const LoadingFallback = () => (
  <div className="space-y-8">
    <div className="h-32 bg-primary/5 rounded-3xl animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 mb-6">
            <h1 className="text-2xl font-black text-red-400 mb-2">
              Ops! Algo deu errado.
            </h1>
            <p className="text-slate-400 text-sm">
              Ocorreu um erro inesperado ao carregar o painel.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
          >
            Recarregar Aplicativo
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Application Component

const App = () => {
  const {
    user,
    loading: authLoading,
    isSyncing,
    privacyMode,
    togglePrivacy,
    logout,
  } = useAuth();
  const { theme } = useTheme();

  // Enable real-time cloud sync
  useCloudSync(user?.uid);

  const [mainTab, setMainTab] = useState<
    | "overview"
    | "personal"
    | "business"
    | "investments"
    | "education"
    | "settings"
  >("overview");
  const [showMainApp, setShowMainApp] = useState(() => isOnboardingComplete());
  const [showPremium, setShowPremium] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useLanguage();

  // Watch for sync completion to skip onboarding for returning users

  useEffect(() => {
    // Run recurrence check once on load if user is logged in
    if (user) {
      checkRecurringTransactions();
    }

    if (user && !showMainApp && isOnboardingComplete()) {
      setShowMainApp(true);
    }

    if (!isSyncing && user && !showMainApp && isOnboardingComplete()) {
      setShowMainApp(true);
    }

    // Heuristic: If user has data (transactions) but no onboarding flag, mark as complete
    // This fixes the issue for users migrating from other devices or versions
    if (user && !showMainApp && !isOnboardingComplete()) {
      const transactions = loadTransactions();
      if (transactions.length > 0) {
        console.log("Data detected, skipping onboarding...");
        saveOnboarding({
          completed: true,
          profile: {
            name: user.displayName || "Usuário",
            email: user.email || "",
            isPro: false,
            initialBalance: 0,
          },
          budgets: [],
          goals: [],
          reminders: [],
        });
        setShowMainApp(true);
      }
    }

    // Automated due date notifications
    if (
      showMainApp &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      const checkReminders = () => {
        const reminders = loadReminders();
        const today = new Date().toISOString().split("T")[0];
        const dueToday = reminders.filter(
          (r) => r.dueDate === today && !r.isPaid
        );

        if (dueToday.length > 0) {
          dueToday.forEach((bill) => {
            new Notification("Lembrete de Pagamento", {
              body: `Sua conta "${bill.name}" de R$ ${bill.amount.toFixed(
                2
              )} vence hoje!`,
              icon: "/logo-new.png",
            });
          });
        }
      };

      // Check once on load
      checkReminders();
    }
  }, [isSyncing, user, showMainApp]);

  const handleOnboardingComplete = () => {
    setShowMainApp(true);
  };

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-indigo-500/30 overflow-x-hidden relative">
      <ToastProvider />

      {/* Background Layers */}
      <div className="mesh-gradient" />
      <div className="bg-grid-pattern fixed inset-0 z-0 opacity-40 pointer-events-none" />

      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse blur-3xl" />
          <Loader2
            className="animate-spin text-indigo-500 relative z-10"
            size={48}
          />
        </div>
      ) : !user ? (
        <LoginForm />
      ) : isSyncing && !showMainApp ? (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 animate-pulse blur-3xl" />
          <Loader2
            className="animate-spin text-emerald-500 relative z-10 mb-4"
            size={48}
          />
          <p className="text-slate-400 animate-pulse font-medium">
            Sincronizando seus dados...
          </p>
        </div>
      ) : !showMainApp && !isOnboardingComplete() ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
              }
            >
              <OnboardingWizard onComplete={handleOnboardingComplete} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Immersive App Shell */
        <motion.div
          key="main-app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          {/* Main Desktop Header */}
          <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 hidden md:block">
            <nav className="max-w-7xl mx-auto flex items-center justify-between glass-premium rounded-2xl px-6 py-3 border border-white/10 shadow-premium">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 group">
                  <LayoutDashboard
                    className="text-indigo-400 group-hover:scale-110 transition-transform"
                    size={24}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black premium-gradient-text tracking-tighter leading-none">
                    MEU CONTADOR
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                    Super App
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                {[
                  { id: "overview", label: t("nav.overview"), icon: PieChart },
                  { id: "personal", label: t("nav.personal"), icon: User },
                  { id: "business", label: t("nav.business"), icon: Building2 },
                  {
                    id: "investments",
                    label: t("nav.investments"),
                    icon: Briefcase,
                  },
                  {
                    id: "education",
                    label: t("nav.education"),
                    icon: BookOpen,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMainTab(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      mainTab === item.id
                        ? "bg-white text-black shadow-white/20 shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <WorkspaceSwitcher />
                <SyncIndicator />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(true)}
                  className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  <HelpCircle size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePrivacy()}
                  className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMainTab("settings")}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    mainTab === "settings"
                      ? "bg-indigo-500 text-white"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <Settings size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            </nav>
          </header>

          {/* Mobile Navigation */}
          <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 glass-premium rounded-[2rem] border border-white/10 shadow-2xl p-2 pb-safe pt-2">
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: "overview", icon: LayoutDashboard, label: "Início" },
                { id: "personal", icon: User, label: "Pessoal" },
                { id: "business", icon: Building2, label: "Empresa" },
                { id: "investments", icon: Briefcase, label: "Invest." },
                { id: "settings", icon: Settings, label: "Ajustes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id as any)}
                  className={`relative flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-500 ${
                    mainTab === tab.id
                      ? "text-indigo-400"
                      : "text-slate-500 hover:text-slate-400"
                  }`}
                >
                  <tab.icon
                    size={22}
                    className={`transition-transform duration-500 ${
                      mainTab === tab.id ? "scale-110" : "scale-100"
                    }`}
                  />
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] mt-1.5">
                    {tab.label}
                  </span>
                  {mainTab === tab.id && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Page Content */}
          <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-24 md:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={mainTab}
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.01, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <div className="animate-fade-in">
                    {mainTab === "overview" && <GlobalDashboard />}
                    {mainTab === "personal" && <PersonalFinance />}
                    {mainTab === "business" && <BusinessFinance />}
                    {mainTab === "investments" && <InvestmentsDashboard />}
                    {mainTab === "education" && <EducationSection />}
                    {mainTab === "settings" && <SettingsSection />}
                  </div>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Overlays */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              >
                <div className="premium-card w-full max-w-4xl max-h-[90vh] overflow-hidden">
                  <HelpCenter onClose={() => setShowHelp(false)} />
                </div>
              </motion.div>
            )}
            {showPremium && (
              <Suspense fallback={null}>
                <PremiumPlans
                  onClose={() => setShowPremium(false)}
                  userEmail={user?.email}
                />
              </Suspense>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <VoiceCommander />
    </div>
  );
};

const AppWithProviders = () => (
  <ThemeProvider>
    <LanguageProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default AppWithProviders;
