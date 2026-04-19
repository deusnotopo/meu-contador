import { useEffect } from "react";
import { api, setCsrfToken } from "@/lib/api";
import { AuthService, mapBackendUserToAuthUser } from "@/services/AuthService";
import { ErrorService } from "@/services/ErrorService";
import { hydrateCacheFromLocalStorage, syncAllData } from "@/lib/storage";
import type { AuthUser } from "@/services/AuthService";

interface UseAuthInitProps {
  setUser: (user: AuthUser | null) => void;
  setIsPro: (isPro: boolean) => void;
  setLoading: (loading: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
}

/**
 * Hook de inicialização de Autenticação.
 * Orchestrates: Hydration -> Fetch User -> Data Sync -> Session Refresh.
 * Akita Mode: Falha na inicialização é um evento crítico, trate com respeito.
 */
export function useAuthInit({
  setUser,
  setIsPro,
  setLoading,
  setIsSyncing
}: UseAuthInitProps) {
  useEffect(() => {
    let cancelled = false;

    const runInit = async () => {
      try {
        setIsSyncing(true);
        
        // 1. Hydrate memory cache immediately from encrypted storage
        await hydrateCacheFromLocalStorage();

        // 2. Resolve session from backend
        const userData = await AuthService.fetchCurrentUser();
        if (cancelled) return;

        const authUser = mapBackendUserToAuthUser(userData);
        setUser(authUser);
        setIsPro(!!userData.isPro);

        // Notify app that session is ready (for secondary listeners)
        window.dispatchEvent(new CustomEvent('auth:session-ready'));

        // 3. Optional: Background CSRF Refresh
        try {
          const refreshData = await api.post<{ csrfToken?: string }>("/auth/refresh", {});
          if (!cancelled && refreshData?.csrfToken) {
            setCsrfToken(refreshData.csrfToken);
          }
        } catch (err) { 
          // Silencioso, pois o token original pode ainda ser válido
          ErrorService.log(err, "useAuthInit:csrfRefresh");
        }

        // 4. Background Sync (don't block UI)
        syncAllData(authUser.id).catch(err => {
          if (!cancelled) ErrorService.log(err, "useAuthInit:backgroundSync");
        });

      } catch (error: unknown) {
        if (!cancelled) {
          ErrorService.log(error, "useAuthInit:sessionRestoration");
          // Se o /me falha, limpamos o estado para garantir que o usuário não veja dados stale
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
