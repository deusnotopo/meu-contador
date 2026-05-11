import { 
  ACADEMY_MOMENTS, 
  ACADEMY_RITUALS, 
  ACADEMY_CONTEXT_SIGNALS, 
  ACADEMY_MATURITY_STAGES,
  getLessonMaturityStage,
  getLessonOutcomeType,
  getLessonTriggerEvents,
  getLessonBehaviorGoal,
  getLessonAssociatedFeature,
  type Lesson,
  type AcademyContextSignal
} from "@/data/educationData";

/** Estado de educação que as funções do engine precisam. */
export interface EducationState {
  completedModules: string[];
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  lessonReviewDueAt: Record<string, string>;
}

/** Profile slice that education engine needs for contextual recommendations. */
export interface EducationUserProfile {
  hasDebts?: boolean;
  debtBalance?: number;
  pendingInvoicesAmount?: number;
  overdueInvoicesCount?: number;
  hasEmergencyFund?: boolean;
  employmentType?: string;
  currentWorkspaceId?: string;
  financialGoal?: string;
  goalsCount?: number;
  hasInvestments?: boolean;
  riskProfile?: string;
}

export interface ReviewRecommendation {
  lesson: Lesson | null;
  dueAt: string | null;
  reason: string;
}

export interface ContextualRecommendation {
  lesson: Lesson | null;
  reason: string;
  actionLabel: string;
  outcome: string;
}

export interface ContextSignalRecommendation {
  signal: AcademyContextSignal | null;
  lesson: Lesson | null;
  actionLabel: string;
}

function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getReviewRecommendation(modules: Lesson[], state: EducationState): ReviewRecommendation {
  const today = normalizeDate(new Date());

  const dueLesson = modules
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
}

export function getContextualRecommendation(modules: Lesson[], state: EducationState, profile: EducationUserProfile): ContextualRecommendation {
  const activeTriggers: string[] = [];

  if (profile?.hasDebts) activeTriggers.push('fatura_alta', 'divida_cara');
  if ((profile?.debtBalance || 0) > 0) activeTriggers.push('divida_cara');
  if ((profile?.pendingInvoicesAmount || 0) > 0) activeTriggers.push('recebimento');
  if ((profile?.overdueInvoicesCount || 0) > 0) activeTriggers.push('mes_apertado', 'negocio_sem_separacao', 'imposto_sem_reserva');
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

  const incompleteLessons = modules.filter((module) => !state.completedModules.includes(module.id));

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
      reason: 'Você concluiu a jornada principal da área Aprender.',
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
}

export function getCurrentMoment(modules: Lesson[], state: EducationState, profile: EducationUserProfile) {
  const contextual = getContextualRecommendation(modules, state, profile);
  const recommendedLesson = contextual.lesson;

  if (recommendedLesson) {
    const directMoment = ACADEMY_MOMENTS.find((moment) => moment.lessonIds.includes(recommendedLesson.id));
    if (directMoment) return directMoment;

    const byOutcome = ACADEMY_MOMENTS.find((moment) => moment.outcomeFocus.includes(getLessonOutcomeType(recommendedLesson)));
    if (byOutcome) return byOutcome;
  }

  return ACADEMY_MOMENTS[0];
}

export function getCurrentRituals(modules: Lesson[], state: EducationState, profile: EducationUserProfile) {
  const contextual = getContextualRecommendation(modules, state, profile);
  const rituals = [...ACADEMY_RITUALS];

  if (contextual.lesson && ['contabilidade', 'tributario'].includes(getLessonOutcomeType(contextual.lesson))) {
    return rituals.reverse();
  }

  return rituals;
}

export function getContextSignalRecommendation(modules: Lesson[], _state: EducationState, profile: EducationUserProfile): ContextSignalRecommendation {
  const activeTriggers: string[] = [];

  if (profile?.hasDebts) activeTriggers.push('fatura_alta', 'divida_cara');
  if ((profile?.debtBalance || 0) > 0) activeTriggers.push('divida_cara');
  if ((profile?.pendingInvoicesAmount || 0) > 0) activeTriggers.push('recebimento');
  if ((profile?.overdueInvoicesCount || 0) > 0) activeTriggers.push('mes_apertado', 'negocio_sem_separacao', 'imposto_sem_reserva');
  if (!profile?.hasEmergencyFund) activeTriggers.push('sem_reserva', 'mes_apertado');
  if (profile?.employmentType && ['autonomo', 'freelancer', 'pj', 'mei'].includes(profile.employmentType)) {
    activeTriggers.push('negocio_sem_separacao', 'imposto_sem_reserva', 'organizar_rotina');
  }
  if (profile?.hasInvestments || profile?.financialGoal === 'invest' || profile?.financialGoal === 'retire') {
    activeTriggers.push('primeiro_aporte', 'diversificacao');
  }

  const signal = ACADEMY_CONTEXT_SIGNALS.find((item) => item.eventKeys.some((key) => activeTriggers.includes(key))) || null;
  const lesson = signal ? modules.find((item) => item.id === signal.primaryLessonId) || null : null;

  return {
    signal,
    lesson,
    actionLabel: lesson ? 'Abrir aula acionada' : 'Seguir jornada',
  };
}

export function getJourneyStage(modules: Lesson[], state: EducationState) {
  const completedStages = modules
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
}

export function getMaturityRoadmap(modules: Lesson[], state: EducationState) {
  return ACADEMY_MATURITY_STAGES.map((stage) => {
    const lessons = modules.filter((lesson) => getLessonMaturityStage(lesson) === stage.id);
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
}

export function getTutorContext(modules: Lesson[], state: EducationState, profile: EducationUserProfile) {
  const recommendation = getContextualRecommendation(modules, state, profile);
  const signal = getContextSignalRecommendation(modules, state, profile);
  const currentMoment = getCurrentMoment(modules, state, profile);
  const journeyStage = getJourneyStage(modules, state);

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
}
