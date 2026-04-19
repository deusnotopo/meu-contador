/**
 * useEducation (Akita Refactor)
 * ───────────────────────────
 * Consumes unified education state from useIntelligence.
 * Eliminates redundant fetches and complex local recommendation logic.
 */

import { useCallback } from "react";
import { useIntelligence } from "./useIntelligence";
import { EDUCATION_MODULES } from "@/data/educationData";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { api } from "@/lib/api";
import { showError } from "@/lib/toast";

const DEFAULT_EDU_STATE = { 
  completedModules: [] as string[], 
  xp: 0, 
  streak: 0, 
  lastActiveDate: null as string | null 
};

export const useEducation = () => {
  const { state: _state, education: eduState, loading, refresh } = useIntelligence();

  const completeModule = useCallback(async (moduleId: string) => {
    try {
      if (!eduState || eduState.completedModules.includes(moduleId)) return;

      const mod = EDUCATION_MODULES.find(m => m.id === moduleId);
      const reward = mod?.xp || 50;

      // Update on backend (optimistic UI could be handled here if needed)
      // For now, we update and refresh the global intelligence state
      await api.put('/users/education', { 
        education: {
          ...eduState,
          completedModules: [...eduState.completedModules, moduleId],
          xp: eduState.xp + reward,
          lastActiveDate: new Date().toISOString()
        } 
      });

      trackEvent(analyticsEvents.EDUCATION_SYNC, {
        completed_modules: eduState.completedModules.length + 1,
        xp: eduState.xp + reward,
      });

      refresh();
    } catch (e) {
      console.error("Erro ao completar módulo:", e);
      showError("Falha ao salvar progresso educativo!");
    }
  }, [eduState, refresh]);

  const saveLessonProgress = useCallback(async (moduleId: string, completedSteps: number) => {
    // Persiste progresso parcial de lição no backend
    try {
      if (!eduState) return;
      await api.put('/users/education/progress', { moduleId, completedSteps, lastActiveDate: new Date().toISOString() });
      refresh();
    } catch (e) {
      console.error('Erro ao salvar progresso da lição:', e);
    }
  }, [eduState, refresh]);

  const getModuleProgress = useCallback((moduleId: string) => {
    const module = EDUCATION_MODULES.find((item) => item.id === moduleId);
    const totalSteps = module?.passos.length || 0;
    const completedSteps = eduState?.completedModules.includes(moduleId) ? totalSteps : 0;
    const isCompleted = eduState?.completedModules.includes(moduleId) || false;

    return {
      completedSteps,
      totalSteps,
      progressPct: isCompleted ? 100 : 0,
      isCompleted,
      hasStarted: isCompleted,
      checkpointLabel: isCompleted ? "Módulo concluído" : "Ainda não iniciado",
    };
  }, [eduState]);

  const isModuleCompleted = useCallback((id: string) => eduState?.completedModules.includes(id) || false, [eduState]);

  const getProgressPct = useCallback(() => {
    if (!eduState) return 0;
    return Math.round((eduState.completedModules.length / EDUCATION_MODULES.length) * 100);
  }, [eduState]);

  const getJourneyStage = useCallback(() => {
    const pct = eduState ? Math.round((eduState.completedModules.length / EDUCATION_MODULES.length) * 100) : 0;
    if (pct === 0) return { title: 'Iniciante', level: 1 };
    if (pct < 20) return { title: 'Aprendiz', level: 2 };
    if (pct < 40) return { title: 'Explorador', level: 3 };
    if (pct < 60) return { title: 'Praticante', level: 4 };
    if (pct < 80) return { title: 'Especialista', level: 5 };
    return { title: 'Mestre', level: 6 };
  }, [eduState]);

  const getReviewRecommendation = useCallback((): { lesson: { id: string; title: string } | null; reason: string } => {
    // Sem dados de spaced-repetition no backend ainda — retorna vazio
    return { lesson: null, reason: '' };
  }, []);

  const getMaturityRoadmap = useCallback(() => {
    if (!eduState) return [];
    const completedSet = new Set(eduState.completedModules);
    const trails = [...new Set(EDUCATION_MODULES.map(m => m.trilha))];
    return trails.map(trail => {
      const trailModules = EDUCATION_MODULES.filter(m => m.trilha === trail);
      const done = trailModules.filter(m => completedSet.has(m.id)).length;
      return {
        id: trail,
        title: trail,
        progressPct: trailModules.length > 0 ? Math.round((done / trailModules.length) * 100) : 0,
      };
    });
  }, [eduState]);

  return {
    state: eduState || DEFAULT_EDU_STATE,
    isLoading: loading,
    error: null,
    recommendation: eduState?.recommendation || null,
    completeModule,
    saveLessonProgress,
    getModuleProgress,
    isModuleCompleted,
    getProgressPct,
    getNextRecommendedLesson: (_trailId: string) => eduState?.recommendation?.lesson || null,
    getContextualRecommendation: () => ({ lesson: eduState?.recommendation?.lesson || null, reason: eduState?.recommendation?.reason || '' }),
    getJourneyStage,
    getReviewRecommendation,
    getMaturityRoadmap,
    isSyncing: false,
    forceSync: refresh,
    refresh
  };
};
