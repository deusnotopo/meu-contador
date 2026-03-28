import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { pluggyCircuitBreaker } from '@/lib/circuit-breaker';

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

export const useOpenFinance = () => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    let cancelled = false; // ← Flag para cleanup
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await pluggyCircuitBreaker.call(
        async () => api.get<BankConnection[]>('/open-finance/connections'),
        () => [] // Fallback: return empty array if Pluggy is down
      );
      if (!cancelled) { // ← Verifica se componente ainda está montado
        setConnections(data);
      }
    } catch (err: any) {
      if (!cancelled) {
        console.error('Error fetching bank connections:', err);
        setError(err.message || 'Erro ao carregar conexões bancárias');
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
      const data = await pluggyCircuitBreaker.call(
        async () => api.get<{ accessToken: string }>(url),
        () => { throw new Error('Pluggy temporariamente indisponível'); }
      );
      return data.accessToken;
    } catch (err: any) {
      console.error('Error getting connect token:', err);
      throw new Error(err.message || 'Erro ao gerar token do Pluggy');
    }
  };

  const forceSync = async (itemId: string) => {
    try {
      await api.post(`/open-finance/sync/${itemId}`, {});
      await fetchConnections(); // Refresh
      return true;
    } catch (err: any) {
      console.error('Error syncing connection:', err);
      throw new Error(err.message || 'Erro ao forçar sincronização');
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
