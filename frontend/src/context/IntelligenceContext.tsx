/**
 * IntelligenceContext
 * ───────────────────
 * Global state provider for unified intelligence data.
 * Ensures only ONE request is made to /intelligence/summary per session/refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { UnifiedIntelligenceState } from "@/hooks/useIntelligence";

interface IntelligenceContextType {
  state: UnifiedIntelligenceState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const IntelligenceContext = createContext<IntelligenceContextType | undefined>(undefined);

export const IntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UnifiedIntelligenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UnifiedIntelligenceState>("/intelligence/summary");
      setState(response);
      setError(null);
    } catch (err: unknown) {
      logger.error('IntelligenceContext: fetch failed', err);
      setError(err instanceof Error ? err.message : "Erro ao carregar inteligência unificada");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  return (
    <IntelligenceContext.Provider value={{ state, loading, error, refresh: fetchIntelligence }}>
      {children}
    </IntelligenceContext.Provider>
  );
};

export const useIntelligenceContext = () => {
  const context = useContext(IntelligenceContext);
  if (context === undefined) {
    throw new Error('useIntelligenceContext must be used within an IntelligenceProvider');
  }
  return context;
};
