import { Button } from "@/components/ui/button";
import { isOnboardingComplete } from "@/lib/onboarding";
import { ToastProvider } from "@/lib/toast";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Loader2, Settings } from "lucide-react";
import React, { Suspense, lazy, useEffect, useState } from "react";
import { LoginForm } from "./components/auth/LoginForm";
import { SettingsSection } from "./components/settings/SettingsSection";
import { PremiumPlans } from "./components/subscription/PremiumPlans";
import { CardSkeleton } from "./components/ui/skeleton";
import { useAuth } from "./context/AuthContext";

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

  componentDidCatch(error: any, errorInfo: any) {
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

const App = () => {
  const { user, loading: authLoading, isSyncing } = useAuth();
  const [mainTab, setMainTab] = useState<
    "overview" | "personal" | "business" | "education" | "settings"
  >("overview");
  const [showMainApp, setShowMainApp] = useState(() => isOnboardingComplete());
  const [showPremium, setShowPremium] = useState(false);

  // Watch for sync completion to skip onboarding for returning users
  useEffect(() => {
    if (user && !showMainApp && isOnboardingComplete()) {
      setShowMainApp(true);
    }

    if (!isSyncing && user && !showMainApp && isOnboardingComplete()) {
      setShowMainApp(true);
    }
  }, [isSyncing, user, showMainApp]);

  const handleOnboardingComplete = () => {
    setShowMainApp(true);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen mesh-gradient selection:bg-indigo-500/30 selection:text-white">
        <ToastProvider />

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
        ) : !showMainApp && !isOnboardingComplete() ? (
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
              </div>
            }
          >
            <OnboardingWizard onComplete={handleOnboardingComplete} />
          </Suspense>
        ) : (
          /* Main Immersive App Shell */
          <div className="relative min-h-screen">
            {/* Floating Premium Navigation */}
            <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
              <nav className="glass-premium rounded-[2rem] px-6 py-3 flex items-center justify-between group border-white/20">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                    <img
                      src="/icon.png"
                      className="w-10 h-10 relative z-10 floating"
                      alt="Logo"
                    />
                    {isSyncing && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#02040a]"
                      />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <Button
                      onClick={() => setShowPremium(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-amber-500/20 transition-all duration-300 rounded-xl h-10 px-4 group"
                    >
                      <Crown className="mr-2 h-4 w-4 fill-white/20 group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold tracking-wide">
                        Seja PRO
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Cyber Navigation Tabs */}
                <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5 mx-4">
                  {[
                    { id: "overview", label: "Resumo" },
                    { id: "personal", label: "Pessoal" },
                    { id: "business", label: "Negócio" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setMainTab(tab.id as typeof mainTab)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        mainTab === tab.id
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMainTab("settings")}
                    className={`w-10 h-10 rounded-xl transition-all ${
                      mainTab === "settings"
                        ? "bg-indigo-500 text-white"
                        : "text-slate-400 hover:text-white bg-white/5"
                    }`}
                  >
                    <Settings size={20} />
                  </Button>
                </div>
              </nav>
            </header>

            <main className="pt-32 pb-12 px-4 max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mainTab}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Suspense fallback={<LoadingFallback />}>
                    <div className="relative">
                      {mainTab === "overview" && <GlobalDashboard />}
                      {mainTab === "personal" && <PersonalFinance />}
                      {mainTab === "business" && <BusinessFinance />}
                      {mainTab === "education" && <EducationSection />}
                      {mainTab === "settings" && <SettingsSection />}
                    </div>
                  </Suspense>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {showPremium && (
                  <Suspense fallback={null}>
                    <PremiumPlans
                      onClose={() => setShowPremium(false)}
                      userEmail={user?.email}
                    />
                  </Suspense>
                )}
              </AnimatePresence>
            </main>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
