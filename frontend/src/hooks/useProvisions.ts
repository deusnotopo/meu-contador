import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Provision {
  id: string;
  name: string;
  month: number;
  yearlyAmount: number;
  accumulated: number;
  createdAt: string;
  updatedAt: string;
}

export function useProvisions() {
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<{ items: Provision[] }>('/provisions');
      setProvisions(response.items);
    } catch (err: any) {
      console.error('Failed to fetch provisions:', err);
      setError(err.message || 'Erro ao carregar provisões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProvisions();
  }, [fetchProvisions]);

  const addProvision = async (data: Omit<Provision, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.post<Provision>('/provisions', data);
      setProvisions((prev) => [...prev, response]);
      return response;
    } catch (err) {
      console.error('Add provision failed:', err);
      throw err;
    }
  };

  const updateProvision = async (id: string, data: Partial<Omit<Provision, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const response = await api.put<Provision>(`/provisions/${id}`, data);
      setProvisions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...response } : p))
      );
      return response;
    } catch (err) {
      console.error('Update provision failed:', err);
      throw err;
    }
  };

  const deleteProvision = async (id: string) => {
    try {
      await api.delete(`/provisions/${id}`);
      setProvisions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Delete provision failed:', err);
      throw err;
    }
  };

  return {
    provisions,
    isLoading,
    error,
    refetch: fetchProvisions,
    addProvision,
    updateProvision,
    deleteProvision,
  };
}
