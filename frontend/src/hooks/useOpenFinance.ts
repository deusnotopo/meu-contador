import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

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
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<BankConnection[]>('/open-finance/connections');
      setConnections(data);
    } catch (err: any) {
      console.error('Error fetching bank connections:', err);
      setError(err.message || 'Erro ao carregar conexões bancárias');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getConnectToken = async (itemId?: string) => {
    try {
      const url = itemId ? `/open-finance/token?itemId=${itemId}` : '/open-finance/token';
      const data = await api.get<{ accessToken: string }>(url);
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
