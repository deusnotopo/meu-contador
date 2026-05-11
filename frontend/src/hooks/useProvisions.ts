import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ProvisionSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export type Provision = z.infer<typeof ProvisionSchema>;

export function useProvisions() {
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // AKITA MODE: Contrato estrito para provisões
      const response = await api.get<Provision[]>('/provisions', {
        schema: z.union([
          z.array(ProvisionSchema),
          z.object({ items: z.array(ProvisionSchema) }).transform(val => val.items)
        ])
      });
      setProvisions(response);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        logger.error('[useProvisions] Zod Validation Error', err.errors);
        setError('Dados de provisões incompatíveis.');
      } else {
        logger.error('[useProvisions] Failed to fetch provisions', err);
        setError((err as Error)?.message || 'Erro ao carregar provisões');
      }
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
      logger.error('[useProvisions] Add provision failed', err);
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
      logger.error('[useProvisions] Update provision failed', err);
      throw err;
    }
  };

  const deleteProvision = async (id: string) => {
    try {
      await api.delete(`/provisions/${id}`);
      setProvisions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      logger.error('[useProvisions] Delete provision failed', err);
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
