import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
  subtype: string;
  bankName: string;
  bankImageUrl: string;
}

export interface BankConnection {
  id: string;
  pluggyItemId: string;
  status: string;
  lastSyncAt: string | null;
  accounts: BankAccount[];
}

interface PaginatedConnectionsResponse {
  items: BankConnection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useOpenFinance = () => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    let cancelled = false; // ← Flag para cleanup
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.get<PaginatedConnectionsResponse>('/open-finance/connections');
      if (!cancelled) {
        setConnections(data.items);
      }
    } catch (err) {
      if (!cancelled) {
        logger.error('[useOpenFinance] Error fetching bank connections', err);
        const message = err instanceof Error ? err.message : 'Erro ao carregar conexões bancárias';
        setError(message);
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
    
    return () => { cancelled = true; }; // ← Cleanup function
  }, []);

  const getConnectToken = async (itemId?: string) => {
    try {
      const url = itemId ? `/open-finance/token?itemId=${itemId}` : '/open-finance/token';
      const data = await api.get<{ accessToken: string }>(url);
      return data.accessToken;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar token do Pluggy';
      throw new Error(message);
    }
  };

  const forceSync = async (itemId: string) => {
    try {
      await api.post(`/open-finance/sync/${itemId}`, {});
      await fetchConnections(); // Refresh
      return true;
    } catch (err) {
      logger.error('[useOpenFinance] Error syncing connection', err);
      const message = err instanceof Error ? err.message : 'Erro ao forçar sincronização';
      throw new Error(message);
    }
  };

  return {
    connections,
    isLoading,
    error,
    fetchConnections,
    getConnectToken,
    forceSync
  };
};
