import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isOnboardingComplete, resetOnboarding } from "@/lib/onboarding";
import { ToastProvider } from "@/lib/toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Cloud,
  LayoutDashboard,
  Loader2,
  Menu,
  Settings,
  Sparkles,
  User,
  Wallet,
  X,
  Crown,
} from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { LoginForm } from "./components/auth/LoginForm";
import { SettingsSection } from "./components/settings/SettingsSection";
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
const PremiumPlans = lazy(() =>
  import("./components/subscription/PremiumPlans").then((m) => ({
    default: m.PremiumPlans,
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

const App = () => {
  const { user, loading: authLoading, isSyncing } = useAuth();
  const [mainTab, setMainTab] = useState<
    "overview" | "personal" | "business" | "settings"
  >("overview");
  const [showMainApp, setShowMainApp] = useState(() => isOnboardingComplete());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const handleOnboardingComplete = () => {
    setShowMainApp(true);
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    setShowMainApp(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!showMainApp) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        }
      >
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen gradient-background pb-20 selection:bg-primary/20">
        {/* Top Navigation */}
        <div className="sticky top-0 z-50 glass-panel border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between py-4">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <div className="p-3 gradient-primary rounded-2xl shadow-elevated relative">
                  <Wallet className="text-primary-foreground" size={28} />
                  {isSyncing && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-card shadow-sm"
                    >
                      <Cloud className="text-white animate-pulse" size={10} />
                    </motion.div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent glow-text">
                      Meu Contador
                    </h1>
                    {isSyncing && (
                      <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 animate-pulse">
                        SYNC
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Gestor Financeiro Inteligente
                  </p>
                </div>
              </div>
              
               <div className="flex-1 flex justify-center md:hidden">
                 {/* Mobile Spacer */}
               </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
                <Tabs
                  value={mainTab}
                  onValueChange={(v) => setMainTab(v as any)}
                  className="bg-muted/50 p-1 rounded-2xl"
                >
                  <TabsList className="bg-transparent gap-1">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-xl px-6 py-2.5 gap-2 font-bold text-base"
                    >
                      <LayoutDashboard size={18} />
                      Visão Geral
                    </TabsTrigger>
                    <TabsTrigger
                      value="personal"
                      className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-xl px-6 py-2.5 gap-2 font-bold text-base"
                    >
                      <User size={18} />
                      Minha Vida
                    </TabsTrigger>
                    <TabsTrigger
                      value="business"
                      className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-xl px-6 py-2.5 gap-2 font-bold text-base"
                    >
                      <Building2 size={18} />
                      Meu Negócio
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-xl px-6 py-2.5 gap-2 font-bold text-base"
                    >
                      <Settings size={18} />
                      Ajustes
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button 
                  onClick={() => setShowPremium(true)}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 rounded-xl font-black gap-2 animate-in fade-in zoom-in duration-500"
                >
                  <Crown size={18} fill="currentColor" />
                  Seja PRO
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMainTab("settings")}
                  className={`hidden sm:flex rounded-full ${
                    mainTab === "settings"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  }`}
                  title="Configurações"
                >
                  <Settings size={22} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-foreground"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={mainTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<LoadingFallback />}>
                {mainTab === "overview" && <GlobalDashboard />}
                {mainTab === "personal" && <PersonalFinance />}
                {mainTab === "business" && <BusinessFinance />}
                {mainTab === "settings" && <SettingsSection />}
              </Suspense>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {showPremium && (
              <Suspense fallback={null}>
                <PremiumPlans onClose={() => setShowPremium(false)} />
              </Suspense>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-12 border-t border-border mt-20 bg-card/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles size={20} />
              <span className="font-bold tracking-widest uppercase text-xs">
                Apoiado por Inteligência Artificial
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              &copy; 2026 Meu Contador. Simplicidade financeira para todas as
              idades.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
