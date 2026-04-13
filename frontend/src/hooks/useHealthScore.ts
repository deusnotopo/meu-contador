import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface HealthScoreEntry {
  date: string;  // yyyy-mm-dd
  score: number;
}

/**
 * useHealthScore — busca e persiste histórico do score de saúde financeira
 *
 * Uso:
 *   const { history, persistScore } = useHealthScore();
 *   useEffect(() => { persistScore(score); }, [score]);
 */
export function useHealthScore() {
  const [history, setHistory] = useState<HealthScoreEntry[]>([]);
  const lastPersisted = useRef<{ date: string; score: number } | null>(null);

  // Carrega histórico ao montar
  useEffect(() => {
    api.get<{ history: HealthScoreEntry[] }>('/analytics/health-score')
      .then(res => setHistory(res.history))
      .catch(() => { /* silently ignore — não bloqueia UI */ });
  }, []);

  // Persiste score do dia (idempotente — respeita debounce por data)
  const persistScore = useCallback(async (score: number) => {
    if (!score || score <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (lastPersisted.current?.date === today && lastPersisted.current?.score === score) return;

    lastPersisted.current = { date: today, score };
    try {
      const res = await api.post<{ success: boolean; history: HealthScoreEntry[] }>(
        '/analytics/health-score',
        { score, date: today }
      );
      setHistory(res.history);
    } catch (err) {
      logger.warn('[useHealthScore] Failed to persist score', err);
    }
  }, []);

  return { history, persistScore };
}
