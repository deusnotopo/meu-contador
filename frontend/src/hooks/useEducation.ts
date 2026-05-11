/**
 * useEducation (Akita Refactor v2)
 * ─────────────────────────────────
 * Consumes unified education state from useIntelligence.
 *
 * FIXES:
 * - Bug 2: completeModule agora chama POST /users/education/complete/:moduleId
 *   (que roda SM-2 + XP no backend) em vez de PUT com estado completo inválido.
 * - Bug 6: getReviewRecommendation busca GET /users/education/review-due e
 *   cruza com modules para retornar título real da lição.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIntelligence } from "./useIntelligence";
import { AULAS_TRILHAS } from "@/data/educationData";
import { EDUCATION_MODULES } from "@/data/educationContent";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { showError } from "@/lib/toast";

const DEFAULT_EDU_STATE = {
  completedModules: [] as string[],
  xp: 0,
  streak: 0,
  lastActiveDate: null as string | null,
  recommendation: null as { lesson: { id: string; title: string } | null; reason: string } | null,
};

interface ReviewDueEntry {
  moduleId: string;
  dueAt: string;
  overdueDays: number;
}

export const useEducation = () => {
  const { education: eduState, loading, refresh } = useIntelligence();
  const modules = EDUCATION_MODULES;
  const [syncing, setSyncing] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState<{ xp: number; completedModules: string[] } | null>(null);
  const [reviewDue, setReviewDue] = useState<ReviewDueEntry[]>([]);

  // Bug 6 fix: fetch review-due on mount (light endpoint, rarely changes)
  useEffect(() => {
    let cancelled = false;
    api.get<{ dueModules: ReviewDueEntry[] }>('/users/education/review-due')
      .then((res) => { if (!cancelled) setReviewDue(res.dueModules); })
      .catch(() => { /* non-critical — silently ignore */ });
    return () => { cancelled = true; };
  }, []);

  // Limpa o estado otimista quando o servidor validar
  useEffect(() => {
    setOptimisticUpdate(null);
  }, [eduState]);

  const currentState = optimisticUpdate
    ? { ...(eduState || DEFAULT_EDU_STATE), xp: optimisticUpdate.xp, completedModules: optimisticUpdate.completedModules }
    : (eduState || DEFAULT_EDU_STATE);

  // Bug 2 fix: calls dedicated complete route (SM-2 + XP) instead of PUT with full state
  const completeModule = useCallback(async (moduleId: string) => {
    try {
      if (currentState.completedModules.includes(moduleId) || modules.length === 0) return;

      const mod = modules.find(m => m.id === moduleId);
      const expectedXp = mod?.xp || 50;

      // Optimistic UI Update (Feedback Instantâneo)
      setOptimisticUpdate({
        completedModules: [...currentState.completedModules, moduleId],
        xp: currentState.xp + expectedXp,
      });

      setSyncing(true);
      await api.post<{ xpEarned: number }>(`/users/education/complete/${moduleId}`, {});

      trackEvent(analyticsEvents.EDUCATION_SYNC, {
        completed_modules: currentState.completedModules.length + 1,
        xp: currentState.xp + expectedXp,
      });

      refresh();
    } catch (e) {
      setOptimisticUpdate(null); // Rollback
      logger.error("useEducation.completeModule: falha ao salvar progresso", e);
      showError("Falha ao salvar progresso educativo!");
    } finally {
      setSyncing(false);
    }
  }, [currentState, modules, refresh]);

  const saveLessonProgress = useCallback(async (moduleId: string, completedSteps: number) => {
    try {
      if (!eduState) return;
      setSyncing(true);
      await api.put('/users/education/progress', {
        moduleId,
        completedSteps,
        lastActiveDate: new Date().toISOString(),
      });
      refresh();
    } catch (e) {
      logger.error("useEducation.saveLessonProgress: falha ao persistir progresso parcial", e);
    } finally {
      setSyncing(false);
    }
  }, [eduState, refresh]);

  const getModuleProgress = useCallback((moduleId: string) => {
    const module = modules.find((item) => item.id === moduleId);
    const totalSteps = module?.passos.length || 0;
    const isCompleted = currentState.completedModules.includes(moduleId) || false;
    const lessonProgress = (currentState as Record<string, unknown>)?.lessonProgress as Record<string, number> | undefined;
    const partialSteps = lessonProgress?.[moduleId] ?? 0;
    const completedSteps = isCompleted ? totalSteps : partialSteps;
    const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const hasStarted = isCompleted || partialSteps > 0;

    return {
      completedSteps,
      totalSteps,
      progressPct,
      isCompleted,
      hasStarted,
      checkpointLabel: isCompleted
        ? "Módulo concluído"
        : hasStarted
        ? `Passo ${partialSteps}/${totalSteps}`
        : "Ainda não iniciado",
    };
  }, [currentState, modules]);

  const isModuleCompleted = useCallback((moduleId: string) => {
    return currentState.completedModules.includes(moduleId);
  }, [currentState.completedModules]);

  const getProgressPct = useCallback((trailId: string) => {
    if (modules.length === 0) return 0;
    const trailModules = modules.filter(m => m.trilha === trailId);
    if (trailModules.length === 0) return 0;
    
    const completedTrailModules = trailModules.filter(m => currentState.completedModules.includes(m.id));
    return Math.round((completedTrailModules.length / trailModules.length) * 100);
  }, [currentState.completedModules, modules]);

  const getJourneyStage = useCallback(() => {
    const pct = (modules.length > 0)
      ? Math.round((currentState.completedModules.length / modules.length) * 100)
      : 0;
    if (pct === 0) return { title: 'Iniciante', level: 1 };
    if (pct < 20)  return { title: 'Aprendiz', level: 2 };
    if (pct < 40)  return { title: 'Explorador', level: 3 };
    if (pct < 60)  return { title: 'Praticante', level: 4 };
    if (pct < 80)  return { title: 'Especialista', level: 5 };
    return { title: 'Mestre', level: 6 };
  }, [currentState.completedModules.length, modules.length]);

  // Bug 6 fix: real review recommendation from backend review-due data
  const getReviewRecommendation = useCallback((): { lesson: { id: string; title: string } | null; reason: string } => {
    if (reviewDue.length === 0) return { lesson: null, reason: '' };
    const mostOverdue = reviewDue[0];
    if (!mostOverdue) return { lesson: null, reason: '' };
    const mod = modules.find(m => m.id === mostOverdue.moduleId);
    if (!mod) return { lesson: null, reason: '' };
    return {
      lesson: { id: mod.id, title: mod.title },
      reason: `${mostOverdue.overdueDays} dia${mostOverdue.overdueDays !== 1 ? 's' : ''} desde a última revisão`,
    };
  }, [reviewDue, modules]);

  // Memoização do Roadmap de Maturidade (Akita Performance Optimization)
  const maturityRoadmap = useMemo(() => {
    if (modules.length === 0) return [];
    const completedSet = new Set(currentState.completedModules);
    
    return AULAS_TRILHAS.map(trail => {
      const trailModules = modules.filter(m => m.trilha === trail.id);
      if (trailModules.length === 0) return null;
      const done = trailModules.filter(m => completedSet.has(m.id)).length;
      return {
        id: trail.id,
        title: `${trail.emoji} ${trail.label}`,
        progressPct: Math.round((done / trailModules.length) * 100),
      };
    }).filter(Boolean) as { id: string; title: string; progressPct: number }[];
  }, [currentState.completedModules, modules]);

  return useMemo(() => ({
    modules,
    state: currentState,
    isLoading: loading,
    error: null,
    recommendation: eduState?.recommendation || null,
    completeModule,
    saveLessonProgress,
    getModuleProgress,
    isModuleCompleted,
    getProgressPct,
    getNextRecommendedLesson: (_trailId: string) => eduState?.recommendation?.lesson || null,
    getContextualRecommendation: () => ({
      lesson: eduState?.recommendation?.lesson || null,
      reason: eduState?.recommendation?.reason || '',
    }),
    getJourneyStage,
    getReviewRecommendation,
    maturityRoadmap, // Agora uma propriedade memoizada em vez de função
    isSyncing: syncing,
    forceSync: refresh,
    refresh,
  }), [
    currentState, 
    loading, 
    completeModule, 
    saveLessonProgress, 
    getModuleProgress, 
    getJourneyStage, 
    maturityRoadmap, 
    syncing
  ]);
};
