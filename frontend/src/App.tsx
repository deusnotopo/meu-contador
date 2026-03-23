import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  LayoutDashboard,
  Settings,
  Target,
  ListOrdered,
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
import { TransactionForm } from "./components/contador/TransactionForm";
import { useTransactions } from "./hooks/useTransactions";
import { showSuccess, showError } from "./lib/toast";
import type { TransactionFormData } from "./types";
import { WorkspaceSwitcher } from "./components/ui/WorkspaceSwitcher";
import { ReceiptScanner } from "./components/receipts/ReceiptScanner";
import { X } from "lucide-react";

// Initialize Silicon Valley Standard Monitoring
MonitoringService.init();

// Lazy load Dashboard to test
const GlobalDashboard = lazy(() =>
  import("./components/GlobalDashboard").then((m) => ({
    default: m.GlobalDashboard,
  }))
);

const TransactionsView = lazy(() =>
  import("./components/transactions/TransactionsView").then((m) => ({
    default: m.TransactionsView,
  }))
);

const PlanningView = lazy(() =>
  import("./components/planning/PlanningView").then((m) => ({
    default: m.PlanningView,
  }))
);

const AIAssistantView = lazy(() =>
  import("./components/ai/AIAssistantView").then((m) => ({
    default: m.AIAssistantView,
  }))
);

const SettingsSection = lazy(() =>
  import("./components/settings/SettingsSection").then((m) => ({
    default: m.SettingsSection,
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
  
  // Global Actions State
  const [showGlobalTx, setShowGlobalTx] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const personalTransactions = useTransactions("personal");

  const handleGlobalTxSubmit = async (formData: TransactionFormData) => {
    try {
      await personalTransactions.addTransaction(formData);
      setShowGlobalTx(false);
      showSuccess("Transação adicionada com sucesso!");
    } catch (e) {
      showError("Erro ao salvar transação");
    }
  };

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
            
            <div className="w-full px-2">
               <WorkspaceSwitcher />
            </div>

           <div className="flex-1 flex flex-col gap-6 w-full px-4 mt-4">
              <NavItem active={activeTab === "dashboard"} icon={LayoutDashboard} onClick={() => setActiveTab("dashboard")} />
              <NavItem active={activeTab === "transactions"} icon={ListOrdered} onClick={() => setActiveTab("transactions")} />
              <NavItem active={activeTab === "planning"} icon={Target} onClick={() => setActiveTab("planning")} />
              <div className="h-px bg-white/10 mx-2" />
              <NavItem active={activeTab === "ai"} icon={Bot} onClick={() => setActiveTab("ai")} />
           </div>

           <div className="px-4 w-full">
              <NavItem active={activeTab === "settings"} icon={Settings} onClick={() => setActiveTab("settings")} />
           </div>
        </div>

        {/* Mobile Navigation (Bottom) */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-around z-50 px-4 shadow-2xl">
           <NavItem active={activeTab === "dashboard"} icon={LayoutDashboard} onClick={() => setActiveTab("dashboard")} />
           <NavItem active={activeTab === "transactions"} icon={ListOrdered} onClick={() => setActiveTab("transactions")} />
           <NavItem active={activeTab === "planning"} icon={Target} onClick={() => setActiveTab("planning")} />
           <NavItem active={activeTab === "ai"} icon={Bot} onClick={() => setActiveTab("ai")} />
           <NavItem active={activeTab === "settings"} icon={Settings} onClick={() => setActiveTab("settings")} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
           <div className="flex-1 overflow-y-auto scrollbar-hide p-2 md:p-8 pb-32 md:pb-12 mt-6 md:mt-0">
              
              <div className="md:hidden flex justify-between items-center w-full px-2 mb-4 pt-4">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/40">
                      <LayoutDashboard size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight">meu-contador</span>
                 </div>
                 <WorkspaceSwitcher />
              </div>
      <main
        id="main-content"
        className="pt-4 md:pt-0 pb-24 md:pb-8 px-2 md:px-8 max-w-[1600px] mx-auto"
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
                        {activeTab === "transactions" && <TransactionsView />}
                        {activeTab === "planning" && <PlanningView />}
                        {activeTab === "ai" && <AIAssistantView />}
                        {activeTab === "settings" && <SettingsSection />}
                      </motion.div>
                   </AnimatePresence>
               </Suspense>
             </ErrorBoundary>
           </main>
           </div>
           {/* Quick Actions FAB */}
           <QuickActions 
             onNewTransaction={() => setShowGlobalTx(true)}
             onScanReceipt={() => setShowScanner(true)}
             onNewReminder={() => {
               // TODO: Open reminder form
               console.log('New reminder');
             }}
           />

           {/* Global OCR Scanner Modal */}
           <AnimatePresence>
             {showScanner && (
               <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 20 }}
                   className="w-full max-w-2xl relative"
                 >
                   <button 
                     onClick={() => setShowScanner(false)}
                     className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all pointer-events-auto"
                   >
                     <X size={24} />
                   </button>
                   <ReceiptScanner onClose={() => setShowScanner(false)} />
                 </motion.div>
               </div>
             )}
           </AnimatePresence>

           {/* Global Transaction Modal */}
           <AnimatePresence>
             {showGlobalTx && (
               <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 20 }}
                   className="w-full max-w-2xl relative"
                 >
                   <TransactionForm
                     editingTransaction={null}
                     onSubmit={handleGlobalTxSubmit}
                     onCancel={() => setShowGlobalTx(false)}
                     scope="personal"
                   />
                 </motion.div>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
