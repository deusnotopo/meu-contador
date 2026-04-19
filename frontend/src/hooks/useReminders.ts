import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ReminderSchema } from '@/lib/schemas';
import { z } from 'zod';
import type { BillReminder } from '@/types';

export type UseRemindersReturn = ReturnType<typeof useReminders>;

export function useReminders() {
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // AKITA MODE: Contrato estrito para lembretes
      const response = await api.get<BillReminder[]>('/reminders', {
        schema: z.union([
          z.array(ReminderSchema),
          z.object({ items: z.array(ReminderSchema) }).transform(val => val.items)
        ])
      });
      setReminders(response);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        console.error('Zod Validation Error (Reminders):', err.errors);
        setError('Dados de lembretes incompatíveis.');
        return;
      }
      // During cold boot, auth race can cause transient 401/500 — stay silent
      const status = (err as { status?: number; statusCode?: number })?.status
        ?? (err as { statusCode?: number })?.statusCode;
      if (status === 401) return;
      
      console.error('Failed to fetch reminders:', err);
      setError((err as Error)?.message || 'Erro ao carregar lembretes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check local storage or global variable. Presuming the auth provider puts a flag
    // so we don't wait forever if session is already ready implicitly.
    const isReady = localStorage.getItem("meu_contador_auth_token") !== null;
    if (isReady) {
      fetchReminders();
    }
    const handleSessionReady = () => { fetchReminders(); };
    window.addEventListener('auth:session-ready', handleSessionReady);
    return () => window.removeEventListener('auth:session-ready', handleSessionReady);
  }, [fetchReminders]);


  const addReminder = async (data: Omit<BillReminder, 'id'>) => {
    try {
      const response = await api.post<BillReminder>('/reminders', data);
      setReminders((prev) => [...prev, response]);
      return response;
    } catch (err) {
      console.error('Add reminder failed:', err);
      throw err;
    }
  };

  const updateReminder = async (id: string, data: Partial<Omit<BillReminder, 'id'>>) => {
    try {
      const response = await api.put<BillReminder>(`/reminders/${id}`, data);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...response } : r))
      );
      return response;
    } catch (err) {
      console.error('Update reminder failed:', err);
      throw err;
    }
  };

  const removeReminder = async (id: string) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete reminder failed:', err);
      throw err;
    }
  };

  return {
    reminders,
    isLoading,
    error,
    refetch: fetchReminders,
    addReminder,
    updateReminder,
    removeReminder,
  };
}
