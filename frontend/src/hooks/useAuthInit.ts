import { useEffect } from "react";
import { setCsrfToken } from "@/lib/api";
import { AuthService, mapBackendUserToAuthUser } from "@/services/AuthService";
import { ErrorService } from "@/services/ErrorService";
import { hydrateCacheFromLocalStorage, syncAllData } from "@/lib/storage";
import { logger } from "@/lib/logger";
import type { AuthUser } from "@/services/AuthService";

interface UseAuthInitProps {
  setUser: (user: AuthUser | null) => void;
  setIsPro: (isPro: boolean) => boolean | void;
  setLoading: (loading: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
}

/**
 * Hook de inicialização de Autenticação.
 * Orquestração: Hydration → Fetch User (cookie-based) → Sync background.
 *
 * Akita Mode:
 * - O /auth/me já renova o CSRF via cookie — não precisamos de um /auth/refresh
 *   adicional logo depois. Isso eliminava um 401 ruidoso no console quando a
 *   sessão estava expirada mas o cookie do refresh ainda era válido.
 * - Se o /auth/me falhar, o api.ts já tenta o /auth/refresh automaticamente
 *   antes de propagar o erro. Então este hook não precisa duplicar essa lógica.
 */
export function useAuthInit({
  setUser,
  setIsPro,
  setLoading,
  setIsSyncing,
}: UseAuthInitProps) {
  useEffect(() => {
    let cancelled = false;

    const runInit = async () => {
      try {
        setIsSyncing(true);

        // 1. Hidrata o cache em memória imediatamente do storage criptografado
        await hydrateCacheFromLocalStorage();

        // 2. Resolve a sessão no backend.
        //    O api.ts já tenta /auth/refresh automaticamente se receber 401.
        const userData = await AuthService.fetchCurrentUser();
        if (cancelled) return;

        const authUser = mapBackendUserToAuthUser(userData);
        setUser(authUser);
        setIsPro(!!userData.isPro);

        // Propaga o csrfToken que veio do /auth/me (via cookie já atualizado)
        // para o módulo api, garantindo que mutations subsequentes o enviem.
        const csrfFromCookie = document.cookie
          .split("; ")
          .find((r) => r.startsWith("mc_csrf_token="))
          ?.split("=")[1];
        if (csrfFromCookie) {
          setCsrfToken(decodeURIComponent(csrfFromCookie));
        }

        // Notifica listeners que a sessão está pronta
        window.dispatchEvent(new CustomEvent("auth:session-ready"));

        logger.info("[useAuthInit] Sessão restaurada com sucesso.");

        // 3. Sync em background — não bloqueia a UI
        syncAllData(authUser.id).catch((err) => {
          if (!cancelled) ErrorService.log(err, "useAuthInit:backgroundSync");
        });
      } catch (error: unknown) {
        if (!cancelled) {
          // Falha é esperada quando não há sessão — log de info, não erro crítico
          logger.info("[useAuthInit] Nenhuma sessão ativa encontrada.");
          ErrorService.log(error, "useAuthInit:sessionRestoration");
          setUser(null);
          setIsPro(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    };

    runInit();

    return () => {
      cancelled = true;
    };
  }, [setUser, setIsPro, setLoading, setIsSyncing]);
}
