import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api';

interface UserPreferencesResponse {
  completedTours?: string[];
  data?: {
    completedTours?: string[];
  };
}

interface TourContextType {
  completedTours: string[];
  markTourAsCompleted: (tourId: string) => void;
  hasSeenTour: (tourId: string) => boolean;
  isLoading: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTours = async () => {
      try {
        // Tenta carregar do localStorage primeiro para rapidez
        const local = localStorage.getItem('completed_tours');
        if (local) {
          setCompletedTours(JSON.parse(local));
        }

        // Sincroniza com o backend se o usuário estiver logado
        const response = await api.get<UserPreferencesResponse>('/users/preferences');
        if (response.completedTours) {
          const remote = response.completedTours;
          setCompletedTours(remote);
          localStorage.setItem('completed_tours', JSON.stringify(remote));
        } else if (response.data?.completedTours) {
          // Fallback para caso a API retorne envolta em .data
          const remote = response.data.completedTours;
          setCompletedTours(remote);
          localStorage.setItem('completed_tours', JSON.stringify(remote));
        }
      } catch (error) {
        // TimeoutError/rede: backend no cold start. Não é erro de produto.
        const isNetworkIssue =
          error instanceof Error &&
          (error.name === 'TimeoutError' || error.name === 'AbortError' ||
           error.message.includes('timeout') || error.message.includes('fetch'));
        if (!isNetworkIssue) {
          logger.warn('Tours: falha ao sincronizar preferências:', (error as Error).message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTours();
  }, []);

  const markTourAsCompleted = async (tourId: string) => {
    if (completedTours.includes(tourId)) return;

    const newTours = [...completedTours, tourId];
    setCompletedTours(newTours);
    localStorage.setItem('completed_tours', JSON.stringify(newTours));

    try {
      // Persiste no backend nas preferências do usuário usando PATCH
      await api.patch('/users/preferences', { completedTours: newTours });
    } catch (_error) {
      logger.warn('Falha ao sincronizar conclusão do tour com o servidor');
    }
  };

  const hasSeenTour = (tourId: string) => completedTours.includes(tourId);

  return (
    <TourContext.Provider value={{ completedTours, markTourAsCompleted, hasSeenTour, isLoading }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTourStatus = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourStatus deve ser usado dentro de um TourProvider');
  }
  return context;
};
