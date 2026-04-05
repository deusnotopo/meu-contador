import { useState, useEffect, useCallback } from "react";
import { ACADEMY_CONTEXT_SIGNALS, ACADEMY_MATURITY_STAGES, ACADEMY_MOMENTS, ACADEMY_RITUALS, EDUCATION_MODULES, getLessonAssociatedFeature, getLessonBehaviorGoal, getLessonMaturityStage, getLessonOutcomeType, getLessonTriggerEvents, type Lesson } from "@/data/educationData";
import { showError } from "@/lib/toast";

export interface EducationState {
  completedModules: string[];
  lessonStepProgress: Record<string, number>;
  lessonLastSeenAt: Record<string, string>;
  lessonReviewDueAt: Record<string, string>;
  contextualReinforcements: Record<string, number>;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
}

const DEFAULT_STATE: EducationState = {
  completedModules: [],
  lessonStepProgress: {},
  lessonLastSeenAt: {},
  lessonReviewDueAt: {},
  contextualReinforcements: {},
  xp: 0,
  streak: 0,
  lastActiveDate: null,
};

interface ModuleProgress {
  completedSteps: number;
  totalSteps: number;
  progressPct: number;
  isCompleted: boolean;
  hasStarted: boolean;
  checkpointLabel: string;
}

interface EducationProfileInput {
  hasDebts?: boolean;
  hasEmergencyFund?: boolean;
  financialGoal?: string;
  riskProfile?: string;
  employmentType?: string;
  currentWorkspaceId?: string | null;
  debtBalance?: number;
  goalsCount?: number;
  hasInvestments?: boolean;
}

interface ContextualRecommendation {
  lesson: Lesson | null;
  reason: string;
  actionLabel: string;
  outcome: string;
}

interface ReviewRecommendation {
  lesson: Lesson | null;
  dueAt: string | null;
  reason: string;
}

interface ContextSignalRecommendation {
  signal: (typeof ACADEMY_CONTEXT_SIGNALS)[number] | null;
  lesson: Lesson | null;
  actionLabel: string;
}

const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];

const normalizeDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const useEducation = (profile?: EducationProfileInput) => {
  const [state, setState] = useState<EducationState>(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const saved = localStorage.getItem("mc_education");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Simple streak logic
        const targetState = { ...DEFAULT_STATE, ...parsed };
        
        if (targetState.lastActiveDate) {
          const last = new Date(targetState.lastActiveDate);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays > 1) {
            targetState.streak = 0; // lost streak
          } else if (diffDays === 1) {
            targetState.streak += 1;
            targetState.lastActiveDate = today.toISOString();
          }
        } else {
          targetState.streak = 1;
          targetState.lastActiveDate = new Date().toISOString();
        }
        
        setState(targetState);
        localStorage.setItem("mc_education", JSON.stringify(targetState));
      } else {
        const init = { ...DEFAULT_STATE, lastActiveDate: new Date().toISOString(), streak: 1 };
        setState(init);
        localStorage.setItem("mc_education", JSON.stringify(init));
      }
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      setError("Erro interno ao carregar o seu avanço educacional: " + message);
      showError("Não foi possível carregar as aulas.");
      setState(DEFAULT_STATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    try {
      setError(null);
      setState((prev) => {
        if (prev.completedModules.includes(moduleId)) return prev;

        const mod = EDUCATION_MODULES.find(m => m.id === moduleId);
        const reward = mod?.xp || 50;
        const totalSteps = mod?.passos.length || 0;
        const nowIso = new Date().toISOString();
        const reinforcementCount = (prev.contextualReinforcements[moduleId] || 0) + 1;
        const reviewInterval: number = REVIEW_INTERVAL_DAYS[Math.max(0, Math.min(reinforcementCount - 1, REVIEW_INTERVAL_DAYS.length - 1))] ?? 1;

        const newState = {
          ...prev,
          completedModules: [...prev.completedModules, moduleId],
          lessonStepProgress: {
            ...prev.lessonStepProgress,
            [moduleId]: totalSteps,
          },
          lessonLastSeenAt: {
            ...prev.lessonLastSeenAt,
            [moduleId]: nowIso,
          },
          lessonReviewDueAt: {
            ...prev.lessonReviewDueAt,
            [moduleId]: addDays(new Date(), reviewInterval).toISOString(),
          },
          contextualReinforcements: {
            ...prev.contextualReinforcements,
            [moduleId]: reinforcementCount,
          },
          xp: prev.xp + reward,
          lastActiveDate: nowIso,
        };
        
        localStorage.setItem("mc_education", JSON.stringify(newState));
        return newState;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      const msg = "Erro crítico ao tentar aprovar sua aula: " + message;
      console.error(msg);
      setError(msg);
      showError("Falha ao salvar progresso educativo!");
    }
  }, []);

  const saveLessonProgress = useCallback((moduleId: string, completedSteps: number) => {
    try {
      setError(null);
      setState((prev) => {
        const mod = EDUCATION_MODULES.find(m => m.id === moduleId);
        const totalSteps = mod?.passos.length || 0;
        const safeCompletedSteps = Math.max(0, Math.min(completedSteps, totalSteps));
        const previousCompletedSteps = prev.lessonStepProgress[moduleId] || 0;

        if (safeCompletedSteps <= previousCompletedSteps) {
          return prev;
        }

        const nextCompletedModules =
          safeCompletedSteps >= totalSteps && totalSteps > 0 && !prev.completedModules.includes(moduleId)
            ? [...prev.completedModules, moduleId]
            : prev.completedModules;
        const nowIso = new Date().toISOString();

        const newState = {
          ...prev,
          completedModules: nextCompletedModules,
          lessonStepProgress: {
            ...prev.lessonStepProgress,
            [moduleId]: safeCompletedSteps,
          },
          lessonLastSeenAt: {
            ...prev.lessonLastSeenAt,
            [moduleId]: nowIso,
          },
          lastActiveDate: nowIso,
        };

        localStorage.setItem("mc_education", JSON.stringify(newState));
        return newState;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      const msg = "Erro ao salvar checkpoint da aula: " + message;
      console.error(msg);
      setError(msg);
    }
  }, []);

  const isModuleCompleted = useCallback((moduleId: string) => state.completedModules.includes(moduleId), [state.completedModules]);

  const getModuleProgress = useCallback((moduleId: string): ModuleProgress => {
    const module = EDUCATION_MODULES.find((item) => item.id === moduleId);
    const totalSteps = module?.passos.length || 0;
    const completedSteps = Math.max(0, Math.min(state.lessonStepProgress[moduleId] || 0, totalSteps));
    const isCompleted = state.completedModules.includes(moduleId) || (totalSteps > 0 && completedSteps >= totalSteps);
    const hasStarted = completedSteps > 0;
    const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      completedSteps,
      totalSteps,
      progressPct,
      isCompleted,
      hasStarted,
      checkpointLabel: isCompleted
        ? "Módulo concluído"
        : hasStarted
          ? `Checkpoint salvo · passo ${Math.min(completedSteps + 1, totalSteps)}/${totalSteps}`
          : "Ainda não iniciado",
    };
  }, [state.completedModules, state.lessonStepProgress]);
  
  const getProgressPct = useCallback(() => {
    const totalSteps = EDUCATION_MODULES.reduce((acc, module) => acc + module.passos.length, 0);
    const completedSteps = EDUCATION_MODULES.reduce((acc, module) => {
      const moduleProgress = state.lessonStepProgress[module.id] || 0;
      return acc + Math.min(moduleProgress, module.passos.length);
    }, 0);

    return totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  }, [state.lessonStepProgress]);

  const getNextRecommendedLesson = useCallback((preferredTrailId?: string) => {
    if (preferredTrailId) {
      const preferredLesson = EDUCATION_MODULES.find(
        (module) => module.trilha === preferredTrailId && !state.completedModules.includes(module.id)
      );

      if (preferredLesson) return preferredLesson;
    }

    return EDUCATION_MODULES.find((module) => !state.completedModules.includes(module.id)) || null;
  }, [state.completedModules]);

  const getReviewRecommendation = useCallback((): ReviewRecommendation => {
    const today = normalizeDate(new Date());

    const dueLesson = EDUCATION_MODULES
      .filter((lesson) => state.completedModules.includes(lesson.id))
      .map((lesson) => ({ lesson, dueAt: state.lessonReviewDueAt[lesson.id] }))
      .filter((item) => !!item.dueAt)
      .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime())
      .find((item) => normalizeDate(new Date(item.dueAt || new Date())).getTime() <= today.getTime());

    if (!dueLesson) {
      return {
        lesson: null,
        dueAt: null,
        reason: 'Nenhuma revisão crítica vencida agora. Siga a próxima lição ou mantenha o ritual financeiro.',
      };
    }

    return {
      lesson: dueLesson.lesson,
      dueAt: dueLesson.dueAt || null,
      reason: 'Seu cérebro retém melhor quando revê o conceito no momento certo. Esta revisão está vencida.',
    };
  }, [state.completedModules, state.lessonReviewDueAt]);

  const getContextualRecommendation = useCallback((): ContextualRecommendation => {
    const activeTriggers: string[] = [];

    if (profile?.hasDebts) activeTriggers.push('fatura_alta', 'divida_cara');
    if ((profile?.debtBalance || 0) > 0) activeTriggers.push('divida_cara');
    if (!profile?.hasEmergencyFund) activeTriggers.push('sem_reserva', 'mes_apertado');
    if (profile?.employmentType && ['autonomo', 'freelancer', 'pj', 'mei'].includes(profile.employmentType)) {
      activeTriggers.push('aumento_de_renda', 'organizar_rotina');
    }
    if (profile?.currentWorkspaceId && profile.currentWorkspaceId !== 'personal') {
      activeTriggers.push('familia_dependente', 'organizar_rotina');
    }
    if (profile?.financialGoal === 'invest' || profile?.financialGoal === 'retire') {
      activeTriggers.push('primeiro_aporte', 'planejamento_aposentadoria');
    }
    if ((profile?.goalsCount || 0) > 0) {
      activeTriggers.push('iniciar_planejamento');
    }
    if (profile?.hasInvestments && !profile?.hasEmergencyFund) {
      activeTriggers.push('sem_reserva', 'primeiro_aporte');
    }

    const incompleteLessons = EDUCATION_MODULES.filter((module) => !state.completedModules.includes(module.id));

    const scoredLessons = incompleteLessons.map((lesson) => {
      const triggerScore = getLessonTriggerEvents(lesson).filter((trigger) => activeTriggers.includes(trigger)).length;
      const stage = getLessonMaturityStage(lesson);
      const maturityScore = ['sobreviver', 'estabilizar', 'proteger', 'organizar'].includes(stage) ? 3 : 1;
      const businessBoost = (profile?.employmentType && ['autonomo', 'freelancer', 'pj', 'mei'].includes(profile.employmentType) && ['contabilidade', 'tributario'].includes(getLessonOutcomeType(lesson))) ? 3 : 0;
      const protectionBoost = (!profile?.hasEmergencyFund && ['divida', 'reserva', 'caixa'].includes(getLessonOutcomeType(lesson))) ? 4 : 0;

      return {
        lesson,
        score: triggerScore * 5 + maturityScore + businessBoost + protectionBoost,
      };
    }).sort((a, b) => b.score - a.score);

    const firstLessonMatch = scoredLessons[0];
    const contextMatch = (firstLessonMatch && firstLessonMatch.score > 0) ? firstLessonMatch.lesson : null;

    const fallback = incompleteLessons[0] || null;
    const selected = contextMatch || fallback;

    if (!selected) {
      return {
        lesson: null,
        reason: 'Você concluiu a jornada principal da Academia.',
        actionLabel: 'Revisar conteúdos avançados',
        outcome: 'maestria',
      };
    }

    const outcome = getLessonOutcomeType(selected);

    const reason = contextMatch
      ? 'Recomendação baseada no seu momento financeiro atual.'
      : 'Próximo passo sugerido para manter evolução consistente.';

    const actionLabel = outcome === 'divida'
      ? 'Corrigir antes que vire juro'
      : outcome === 'reserva'
        ? 'Proteger sua base'
        : outcome === 'contabilidade' || outcome === 'tributario'
          ? 'Organizar operação e impostos'
          : 'Avançar na jornada';

    return {
      lesson: selected,
      reason,
      actionLabel,
      outcome,
    };
  }, [profile?.currentWorkspaceId, profile?.debtBalance, profile?.employmentType, profile?.financialGoal, profile?.goalsCount, profile?.hasDebts, profile?.hasEmergencyFund, profile?.hasInvestments, state.completedModules]);

  const getCurrentMoment = useCallback(() => {
    const contextual = getContextualRecommendation();
    const recommendedLesson = contextual.lesson;

    if (recommendedLesson) {
      const directMoment = ACADEMY_MOMENTS.find((moment) => moment.lessonIds.includes(recommendedLesson.id));
      if (directMoment) return directMoment;

      const byOutcome = ACADEMY_MOMENTS.find((moment) => moment.outcomeFocus.includes(getLessonOutcomeType(recommendedLesson)));
      if (byOutcome) return byOutcome;
    }

    return ACADEMY_MOMENTS[0];
  }, [getContextualRecommendation]);

  const getCurrentRituals = useCallback(() => {
    const contextual = getContextualRecommendation();
    const rituals = [...ACADEMY_RITUALS];

    if (contextual.lesson && ['contabilidade', 'tributario'].includes(getLessonOutcomeType(contextual.lesson))) {
      return rituals.reverse();
    }

    return rituals;
  }, [getContextualRecommendation]);

  const getContextSignalRecommendation = useCallback((): ContextSignalRecommendation => {
    const activeTriggers: string[] = [];

    if (profile?.hasDebts) activeTriggers.push('fatura_alta', 'divida_cara');
    if ((profile?.debtBalance || 0) > 0) activeTriggers.push('divida_cara');
    if (!profile?.hasEmergencyFund) activeTriggers.push('sem_reserva', 'mes_apertado');
    if (profile?.employmentType && ['autonomo', 'freelancer', 'pj', 'mei'].includes(profile.employmentType)) {
      activeTriggers.push('negocio_sem_separacao', 'imposto_sem_reserva', 'organizar_rotina');
    }
    if (profile?.hasInvestments || profile?.financialGoal === 'invest' || profile?.financialGoal === 'retire') {
      activeTriggers.push('primeiro_aporte', 'diversificacao');
    }

    const signal = ACADEMY_CONTEXT_SIGNALS.find((item) => item.eventKeys.some((key) => activeTriggers.includes(key))) || null;
    const lesson = signal ? EDUCATION_MODULES.find((item) => item.id === signal.primaryLessonId) || null : null;

    return {
      signal,
      lesson,
      actionLabel: lesson ? 'Abrir aula acionada' : 'Seguir jornada',
    };
  }, [profile?.debtBalance, profile?.employmentType, profile?.financialGoal, profile?.hasDebts, profile?.hasEmergencyFund, profile?.hasInvestments]);

  const getJourneyStage = useCallback(() => {
    const completedStages = EDUCATION_MODULES
      .filter((lesson) => state.completedModules.includes(lesson.id))
      .map((lesson) => getLessonMaturityStage(lesson));

    if (!completedStages.includes('sobreviver')) {
      return {
        id: 'fundacao',
        title: 'Sobreviver ao Brasil',
        description: 'Aprenda a proteger caixa, fatura, reserva mínima e decisões urgentes do mês.',
      };
    }

    if (!completedStages.includes('organizar')) {
      return {
        id: 'construcao',
        title: 'Organizar e estabilizar',
        description: 'Construa rotina, provisões, disciplina e leitura real do dinheiro.',
      };
    }

    if (!completedStages.includes('crescer')) {
      return {
        id: 'expansao',
        title: 'Crescer com inteligência',
        description: 'Com base pronta, avance para diversificação, renda ativa e patrimônio.',
      };
    }

    return {
      id: 'maestria',
      title: 'Blindar e perpetuar',
      description: 'Aprofunde proteção patrimonial, sucessão, FIRE e decisões de longo prazo.',
    };
  }, [state.completedModules]);

  const getMaturityRoadmap = useCallback(() => {
    return ACADEMY_MATURITY_STAGES.map((stage) => {
      const lessons = EDUCATION_MODULES.filter((lesson) => getLessonMaturityStage(lesson) === stage.id);
      const completed = lessons.filter((lesson) => state.completedModules.includes(lesson.id)).length;
      const progressPct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;

      return {
        ...stage,
        lessons: lessons.length,
        completed,
        progressPct,
        topOutcome: lessons[0] ? getLessonOutcomeType(lessons[0]) : 'caixa',
      };
    });
  }, [state.completedModules]);

  const getTutorContext = useCallback(() => {
    const recommendation = getContextualRecommendation();
    const signal = getContextSignalRecommendation();
    const currentMoment = getCurrentMoment();
    const journeyStage = getJourneyStage();

    return {
      currentMoment,
      journeyStage,
      recommendation,
      contextSignal: signal,
      learningFocus: recommendation.lesson
        ? {
            title: recommendation.lesson.title,
            outcome: getLessonOutcomeType(recommendation.lesson),
            behaviorGoal: getLessonBehaviorGoal(recommendation.lesson),
            feature: getLessonAssociatedFeature(recommendation.lesson),
          }
        : null,
    };
  }, [getContextSignalRecommendation, getContextualRecommendation, getCurrentMoment, getJourneyStage]);

  return {
    state,
    error,
    isLoading,
    completeModule,
    saveLessonProgress,
    isModuleCompleted,
    getModuleProgress,
    getProgressPct,
    getNextRecommendedLesson,
    getContextualRecommendation,
    getReviewRecommendation,
    getCurrentMoment,
    getCurrentRituals,
    getContextSignalRecommendation,
    getJourneyStage,
    getMaturityRoadmap,
    getTutorContext,
  };
};
