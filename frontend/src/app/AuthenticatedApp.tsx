import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { TourProvider } from "@/context/TourContext";

import { GlobalLoadingProgress } from "@/components/ui/GlobalLoadingProgress";
import { SkipToContent, ScreenReaderAnnouncer } from "@/lib/accessibility";
import { LevelUpOverlay } from "@/components/mastery/LevelUpOverlay";
import { AdviserOverlay, AdviserTrigger, useAdviser } from "@/components/ai/AdviserOverlay";
import { AppShell } from "@/components/layout/AppShell";
import { GlobalOverlays } from "@/components/layout/GlobalOverlays";
import { NotificationObserver } from "@/components/notifications/NotificationObserver";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useOverlays } from "@/context/OverlayContext";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import { PATH_TO_TAB } from "./routes";
import { AppRoutes } from "./AppRoutes";
import { TabType } from "@/types/navigation";

export function AuthenticatedApp() {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const { isOpen: adviserOpen, open: openAdviser, close: closeAdviser } = useAdviser();
  const { setShowWizard, setShowFunctions, isLaunchMenuOpen } = useOverlays();

  // Professional Initialization (Monitoring, Onboarding, etc)
  useAppInitialization(setShowWizard);

  const activeTab = useMemo<TabType>(() => {
    return PATH_TO_TAB[location.pathname] ?? "inicio";
  }, [location.pathname]);

  return (
    <TourProvider>
        <SkipToContent />
        <ScreenReaderAnnouncer />
        <GlobalLoadingProgress />
        <LevelUpOverlay />
        <NotificationObserver />
        
        {/* Botões Flutuantes e Overlays de IA */}
        <AdviserTrigger onClick={openAdviser} />
        <AdviserOverlay isOpen={adviserOpen} onClose={closeAdviser} />

        {/* Overlays Agregados (Celebration, Wizard, etc) */}
        <GlobalOverlays />

        <AppShell
          isDesktop={isDesktop}
          activeTab={activeTab}
          isLaunchMenuOpen={isLaunchMenuOpen}
          onOpenFunctions={() => setShowFunctions(true)}
        >
          <AppRoutes />
        </AppShell>
      </TourProvider>
  );
}
