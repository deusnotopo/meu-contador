/**
 * IntelligenceContext
 * ───────────────────
 * Global state provider para dados de inteligência unificada.
 *
 * FIX: O context anterior não protegia contra chamadas concorrentes ao
 * refresh(). Quando múltiplos consumidores chamavam refresh() simultaneamente
 * (ex: useEducation + useGamification), isso disparava múltiplas requisições
 * paralelas a /intelligence/summary.
 *
 * Solução: inflight guard — se já há uma requisição em andamento, a próxima
 * chamada a refresh() retorna a mesma Promise, garantindo no máximo 1 request
 * ativa por vez (deduplicação).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { UnifiedIntelligenceState, UnifiedIntelligenceStateSchema } from "@/hooks/useIntelligence";

interface IntelligenceContextType {
  state: UnifiedIntelligenceState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const IntelligenceContext = createContext<IntelligenceContextType | undefined>(undefined);

const COOLDOWN_MS = 2000;

export const IntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UnifiedIntelligenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inflight guard: deduplicates concurrent refresh() calls
  const inflightRef = useRef<Promise<void> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchIntelligence = useCallback(async (force = false): Promise<void> => {
    // Se já há uma chamada em andamento, retorna a mesma promise — não duplica
    if (inflightRef.current) return inflightRef.current;

    const now = Date.now();
    if (!force && now - lastFetchRef.current < COOLDOWN_MS) {
      logger.debug('[IntelligenceContext] Refresh skipped (cooldown active)');
      // DESTAVA A UI: Se estamos barrados pelo cooldown mas iniciamos a tela como true, garante liberar o loading.
      setLoading(false);
      return;
    }

    lastFetchRef.current = now;

    const promise = (async () => {
      try {
        if (isMounted.current) setLoading(true);
        const response = await api.get<UnifiedIntelligenceState>("/intelligence/summary", {
          schema: UnifiedIntelligenceStateSchema
        });
        
        if (!isMounted.current) return;
        
        setState(response);
        setError(null);
        localStorage.setItem("offline_intelligence_summary", JSON.stringify(response));
      } catch (err: unknown) {
        if (!isMounted.current) return;
        
        // Se erro de autenticação, interrompe carregamento para evitar trava na UI
        if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
          logger.warn('IntelligenceContext: Unauthorized (401). Stopping loading state.');
          setLoading(false);
          inflightRef.current = null;
          return;
        }

        logger.error('IntelligenceContext: fetch failed', err);
        const cached = localStorage.getItem("offline_intelligence_summary");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            
            // AKITA MODE: Offline Hydration Paranoia
            const result = UnifiedIntelligenceStateSchema.safeParse(parsed);
            if (result.success) {
              setState(result.data);
              setError("Exibindo dados recentes em modo Offline.");
            } else {
              logger.error("IntelligenceContext: Offline cache corrupted/schema mismatch", result.error);
              setError("Falha ao carregar inteligência unificada (cache expirado).");
            }
          } catch {
            setError(err instanceof Error ? err.message : "Erro ao carregar inteligência unificada");
          }
        } else {
          setError(err instanceof Error ? err.message : "Erro ao carregar inteligência unificada");
        }
      } finally {
        if (isMounted.current) setLoading(false);
        inflightRef.current = null;
      }
    })();

    inflightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    fetchIntelligence(true); // Força a primeira carga
  }, [fetchIntelligence]);

  return (
    <IntelligenceContext.Provider value={{ state, loading, error, refresh: fetchIntelligence }}>
      {children}
    </IntelligenceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useIntelligenceContext = () => {
  const context = useContext(IntelligenceContext);
  if (context === undefined) {
    throw new Error('useIntelligenceContext must be used within an IntelligenceProvider');
  }
  return context;
};
