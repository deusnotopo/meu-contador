import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { MonitoringService } from "@/lib/monitoring";
import { isOnboardingDone } from "@/lib/storage";

/**
 * Hook centralizado para inicialização de subsistemas globais do App.
 *
 * FIX: claimDailyLogin estava no dep array do useEffect, o que causava um
 * loop infinito: awardXp → refresh() → IntelligenceContext re-renderiza →
 * claimDailyLogin recriado → useEffect dispara novamente → awardXp → ...
 *
 * Solução: usar ref estável para capturar claimDailyLogin sem re-executar
 * o efeito quando a função muda (a lógica de "deve rodar uma vez por sessão"
 * é garantida pelo hasRun guard).
 */
export function useAppInitialization(setShowWizard: (val: boolean) => void) {
  const { user, loading } = useAuth();
  const { claimDailyLogin } = useGamification();
  const hasRun = useRef(false);
  const claimRef = useRef(claimDailyLogin);

  // Mantém a ref atualizada sem re-disparar o efeito
  useEffect(() => {
    claimRef.current = claimDailyLogin;
  }, [claimDailyLogin]);

  // 1. Inicializa monitoramento (apenas uma vez)
  useEffect(() => {
    MonitoringService.init();
  }, []);

  // 2. Onboarding + Recompensa Diária — executa UMA ÚNICA VEZ por sessão
  useEffect(() => {
    if (!user || loading || hasRun.current) return;

    hasRun.current = true;

    const done = isOnboardingDone(user.id);
    const profileCompleted = user.onboardingCompleted;

    if (!done && !profileCompleted) {
      setShowWizard(true);
    }

    // Usa ref para não recriar a dependência a cada render
    claimRef.current();
  }, [user, loading, setShowWizard]); // claimDailyLogin intencionalmente fora — lido via ref
}
