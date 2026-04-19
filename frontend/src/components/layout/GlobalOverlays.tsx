import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingWizard } from "@/app/routes";
import { Celebration } from "@/components/ui/Celebration";
import { SmartLaunchMenu } from "@/components/layout/SmartLaunchMenu";
import { VoiceCommander } from "@/components/ai/VoiceCommander";
import { StatementImportModal } from "@/components/statements/StatementImportModal";
import { FunctionsHub } from "@/app/routes";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useOverlays } from "@/context/OverlayContext";
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

function LoadingFallback() { return <LoadingSkeleton />; }

/**
 * Agregador de Overlays Globais.
 * Remove a poluição visual do App.tsx e centraliza a gestão de z-index e animações de overlays.
 */
export function GlobalOverlays() {
  const {
    showWizard,
    setShowWizard,
    showCelebration,
    setShowCelebration,
    isLaunchMenuOpen,
    setIsLaunchMenuOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    voiceMenuActive,
    setVoiceMenuActive,
    showFunctions,
    setShowFunctions,
    triggerCelebration,
  } = useOverlays();

  const { navigateTo } = useAppNavigate();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleWizardComplete = () => {
    localStorage.setItem(`onboarding_done_${user?.id}`, 'true');
    setShowWizard(false);
    triggerCelebration();
  };

  const handleWizardSkip = () => {
    localStorage.setItem(`onboarding_done_${user?.id}`, 'skipped');
    setShowWizard(false);
  };

  const handleLaunchMenuAction = (action: string) => {
    setIsLaunchMenuOpen(false);
    if (action === "expense" || action === "income") {
      navigate(`/launch?type=${action}`);
    } else if (action === "voice") {
       setVoiceMenuActive(true);
    } else if (action === "asset") {
       navigate("/invest/portfolio?add=true");
    } else if (action === "scan_receipt") {
       setIsImportModalOpen(true);
    }
  };

  return (
    <>
      <Celebration isVisible={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Onboarding Overlay */}
      {showWizard && (
        <Suspense fallback={<LoadingFallback />}>
          <OnboardingWizard 
            onComplete={handleWizardComplete} 
            onSkip={handleWizardSkip}
          />
        </Suspense>
      )}

      {/* Smart Launch FAB Menu */}
      <SmartLaunchMenu
        isOpen={isLaunchMenuOpen}
        onClose={() => setIsLaunchMenuOpen(false)}
        onAction={handleLaunchMenuAction}
      />

      {/* Import Statements Modal */}
      {isImportModalOpen && (
        <StatementImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          onImportComplete={() => { setIsImportModalOpen(false); triggerCelebration(); }}
        />
      )}

      {/* Voice Commander Overlay */}
      {voiceMenuActive && (
        <VoiceCommander onClose={() => setVoiceMenuActive(false)} />
      )}

      {/* Functions Hub Sheet */}
      <AnimatePresence>
        {showFunctions && (
          <>
            <motion.div
              key="fn-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFunctions(false)}
              className="fixed inset-0 z-[49] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="fn-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 w-full max-h-[85dvh] z-[50] rounded-t-[28px] overflow-y-auto no-scrollbar"
            >
              <Suspense fallback={<LoadingFallback />}>
                <FunctionsHub onNavigate={navigateTo} />
              </Suspense>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
