import { useEffect } from 'react';
import { clearAuthSession, subscribeToAuthSession } from '@/lib/api';
import { AuthService } from '@/services/AuthService';
import { logger } from '@/lib/logger';
import type { AuthUser } from '@/services/AuthService';

/**
 * Hook dedicado puramente à vigilância do ciclo de vida da Sessão JWT/CSRF.
 * Evita que o AuthContext fique com lógicas acopladas de redirect e security watchers.
 */
export function useSessionGuard(
  user: AuthUser | null,
  isAuthLoading: boolean,
  clearLocalState: () => void
) {
  useEffect(() => {
    if (isAuthLoading) return; // AKITA FIX: Não expulsar se ainda estamos carregando a sessão

    let cancelled = false;

    const unsub = subscribeToAuthSession((snapshot) => {
      // Quando CSRF expira ou a sessão JWT no cookie morre, forçamos o logout
      if (user && !snapshot.isAuthenticated && !snapshot.csrfToken && !cancelled) {
        logger.warn('Sessão/CSRF expirou, executando force-logout imediato');
        
        AuthService.logout()
          .then(() => {
            if (!cancelled) {
              clearLocalState();
              clearAuthSession();
              // Recarregar em hard mode pra resetar todo o JS event loop state
              window.location.href = '/?expired=true';
            }
          })
          .catch(() => {
            // Em caso de falha de rede limpa tudo de qualquer forma
            if (!cancelled) {
              clearLocalState();
            }
          });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, clearLocalState]);
}
