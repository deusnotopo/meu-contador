import { useRef, useCallback, useEffect } from 'react';

/**
 * useDebounceSync - Gancho para sincronização debounced com o backend.
 * 
 * @param syncFn Função assíncrona que realiza o salvamento real (ex: API PUT)
 * @param delay Tempo de espera em ms (default 2000ms)
 */
export function useDebounceSync<T>(syncFn: (data: T) => Promise<void>, delay = 2000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T | null>(null);

  // Limpa o timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Opcional: Poderíamos forçar um sync final aqui se dataRef.current não for null
        // mas em Web, o unmount pode ser rápido demais para um await api.put
      }
    };
  }, []);

  const scheduleSync = useCallback((data: T) => {
    // Atualiza o dado mais recente na referência
    dataRef.current = data;

    // Se já houver um timer, cancela o anterior (debounce)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Agenda o novo timer
    timeoutRef.current = setTimeout(async () => {
      if (dataRef.current) {
        try {
          await syncFn(dataRef.current);
          dataRef.current = null; // Limpa após sucesso
        } catch (error) {
          console.error('[useDebounceSync] Failed to sync data:', error);
          // Em caso de erro, o dado permanece no ref para uma possível tentativa futura
          // ou podemos implementar uma lógica de retry aqui.
        }
      }
      timeoutRef.current = null;
    }, delay);
  }, [syncFn, delay]);

  // Função para forçar o sync imediato (ex: ao fechar uma lição)
  const forceSync = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (dataRef.current) {
      const dataToSync = dataRef.current;
      dataRef.current = null;
      await syncFn(dataToSync);
    }
  }, [syncFn]);

  return { scheduleSync, forceSync, isPending: !!timeoutRef.current };
}
