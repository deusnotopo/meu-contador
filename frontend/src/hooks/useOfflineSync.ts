import { useEffect, useCallback, useState, useRef } from 'react';
import {
  addToQueue,
  processQueue,
  getQueueStatus,
  purgeStaleItems,
  isOnline,
} from '@/lib/offline-queue';
import { showSuccess } from '@/lib/toast';
import { logger } from '@/lib/logger';

export interface OfflineSyncState {
  /** true quando o dispositivo está sem conexão */
  isOffline: boolean;
  /** Número de operações pendentes na fila IndexedDB */
  pendingCount: number;
  /** true enquanto a fila está sendo processada */
  syncing: boolean;
  /** Executa a sincronização manualmente */
  syncNow: () => Promise<void>;
  /** Encapsula um fetch em modo offline-first — salva na fila se offline */
  offlineFetch: (
    endpoint: string,
    payload: unknown,
    type?: 'create' | 'update' | 'delete'
  ) => Promise<boolean>;
}

/**
 * useOfflineSync — Gerencia modo offline e Background Sync
 *
 * Uso:
 *   const { isOffline, pendingCount, offlineFetch } = useOfflineSync();
 *   await offlineFetch('/api/transactions', body, 'create');
 */
export function useOfflineSync(): OfflineSyncState {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  // ── Atualiza contador da fila ──────────────────────────────
  const refreshCount = useCallback(async () => {
    try {
      const status = await getQueueStatus();
      setPendingCount(status.count);
    } catch {
      // indexedDB indisponível (modo privado)
    }
  }, []);

  // ── Processa a fila quando volta online ───────────────────
  const syncNow = useCallback(async () => {
    if (syncingRef.current || !isOnline()) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      await purgeStaleItems();
      const { success, failed } = await processQueue();

      if (success > 0) {
        showSuccess(`${success} lançamento${success > 1 ? 's' : ''} sincronizado${success > 1 ? 's' : ''}.`);
        logger.info(`[OfflineSync] ${success} itens sincronizados, ${failed} falhas`);
        // Solicita ao SW que invalide o cache da API
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'PURGE_API_CACHE' });
        }
      }

      await refreshCount();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshCount]);

  // ── Listeners de conectividade ─────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void syncNow();
    };
    const handleOffline = () => setIsOffline(true);
    const handleQueueUpdate = () => void refreshCount();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdate);

    // Sync imediato na montagem caso haja pendências
    void refreshCount().then(() => {
      if (isOnline()) void syncNow();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdate);
    };
  }, [syncNow, refreshCount]);

  // ── SW: mensagem de sync completado ───────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') void syncNow();
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [syncNow]);

  // ── offlineFetch: POST/PUT/DELETE com fallback para fila ──
  const offlineFetch = useCallback(
    async (
      endpoint: string,
      payload: unknown,
      type: 'create' | 'update' | 'delete' = 'create'
    ): Promise<boolean> => {
      if (isOnline()) return false; // online: o caller usa fetch normal

      await addToQueue(endpoint, payload, type);

      // Solicita Background Sync ao SW (funciona no Chrome/Edge)
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        try {
          const reg = await navigator.serviceWorker.ready;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (reg as any).sync?.register('sync-transactions');
        } catch {
          // API de Background Sync não suportada — sync acontecerá no próximo 'online'
        }
      }

      return true; // true = enfileirado, operação será sincronizada depois
    },
    []
  );

  return { isOffline, pendingCount, syncing, syncNow, offlineFetch };
}
