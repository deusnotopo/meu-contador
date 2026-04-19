import { createContext, useContext, useState, ReactNode } from "react";

interface OverlayContextData {
  showWizard: boolean;
  setShowWizard: (val: boolean) => void;
  showCelebration: boolean;
  setShowCelebration: (val: boolean) => void;
  showFunctions: boolean;
  setShowFunctions: (val: boolean) => void;
  isLaunchMenuOpen: boolean;
  setIsLaunchMenuOpen: (val: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (val: boolean) => void;
  voiceMenuActive: boolean;
  setVoiceMenuActive: (val: boolean) => void;
  triggerCelebration: () => void;
}

const OverlayContext = createContext<OverlayContextData | undefined>(undefined);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [showWizard, setShowWizard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFunctions, setShowFunctions] = useState(false);
  const [isLaunchMenuOpen, setIsLaunchMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [voiceMenuActive, setVoiceMenuActive] = useState(false);

  const triggerCelebration = () => setShowCelebration(true);

  return (
    <OverlayContext.Provider
      value={{
        showWizard,
        setShowWizard,
        showCelebration,
        setShowCelebration,
        showFunctions,
        setShowFunctions,
        isLaunchMenuOpen,
        setIsLaunchMenuOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        voiceMenuActive,
        setVoiceMenuActive,
        triggerCelebration,
      }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlays() {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error("useOverlays must be used within an OverlayProvider");
  }
  return context;
}
