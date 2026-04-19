import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { MonitoringService } from "@/lib/monitoring";
import { isOnboardingDone } from "@/lib/storage";

/**
 * Hook centralizado para inicialização de subsistemas globais do App.
 * Isso remove ruído do componente App.tsx e segue o princípio de separação de preocupações.
 */
export function useAppInitialization(setShowWizard: (val: boolean) => void) {
  const { user, loading } = useAuth();
  const { claimDailyLogin } = useGamification();

  // 1. Inicializa monitoramento (apenas uma vez)
  useEffect(() => {
    MonitoringService.init();
  }, []);

  // 2. Lógica de Onboarding e Recompensas Diárias
  useEffect(() => {
    if (user && !loading) {
      const done = isOnboardingDone(user.id);
      const profileCompleted = user.onboardingCompleted;

      if (!done && !profileCompleted) {
        setShowWizard(true);
      }

      // Reivindica recompensa de login diário
      claimDailyLogin();
    }
  }, [user, loading, claimDailyLogin, setShowWizard]);
}
