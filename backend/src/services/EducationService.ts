/**
 * EducationService
 * ────────────────
 * Handles the "Wealth Academy" progress, pedagogical state, and recommendations.
 *
 * Algoritmos implementados:
 * - SM-2 simplificado para spaced-repetition (lessonReviewDueAt)
 * - Scoring por triggers financeiros reais (dívidas, reserva, regime, etc.)
 * - Salvamento de progresso parcial por passo (lessonStepProgress)
 */

import { db } from '../lib/db.js';
import { EDUCATION_MODULES, getRecommendedLesson } from '../lib/education-data.js';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface ReviewDueEntry {
  moduleId: string;
  dueAt: string;
  overdueDays: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

/**
 * SM-2 simplificado:
 * Intervalo de revisão aumenta conforme o número de vezes que a lição foi concluída.
 * contextualReinforcements[lessonId] = contador de conclusões
 *
 * Intervalo (dias) = BASE_INTERVAL * GROWTH_FACTOR ^ (repetitions - 1)
 * Cap em MAX_INTERVAL para não ir além de 90 dias.
 */
const SM2_BASE_DAYS = 3;
const SM2_GROWTH = 2.5;
const SM2_MAX_DAYS = 90;

function calcNextReviewDate(repetitions: number): Date {
  const days = Math.min(
    Math.round(SM2_BASE_DAYS * Math.pow(SM2_GROWTH, repetitions - 1)),
    SM2_MAX_DAYS
  );
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseState(raw: unknown): EducationState {
  if (!raw) return { ...DEFAULT_STATE };
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as EducationState;
    } catch {
      return { ...DEFAULT_STATE };
    }
  }
  return raw as EducationState;
}

async function persistState(userId: string, state: EducationState, tx?: Parameters<typeof db.$transaction>[0] extends ((client: infer C) => unknown) ? C : typeof db): Promise<void> {
  const client = (tx as typeof db) || db;
  await client.user.update({
    where: { id: userId },
    data: { educationData: JSON.stringify(state) },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getEducationData(userId: string) {
  const [user, debtAggregate] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        educationData: true,
        hasDebts: true,
        hasEmergencyFund: true,
        employmentType: true,
      },
    }),
    // Soma saldo total de dívidas ativas para enriquecer a recomendação
    db.debt.aggregate({
      where: { userId, deletedAt: null },
      _sum: { balance: true },
    }),
  ]);

  if (!user) return null;

  const state = parseState(user.educationData);
  const totalDebtBalance = debtAggregate._sum.balance ?? 0;

  // Enrich recommendation with live financial context
  const rawRecommendation = getRecommendedLesson(state.completedModules, {
    hasDebts: user.hasDebts || totalDebtBalance > 0,
    hasEmergencyFund: user.hasEmergencyFund || false,
    employmentType: user.employmentType || 'clt',
    debtBalance: totalDebtBalance,
  });

  // Shape the recommendation to match the ContextualRecommendation interface expected by the frontend
  // Frontend reads: eduState.recommendation?.lesson (not eduState.recommendation directly)
  const recommendation = rawRecommendation ? {
    lesson: rawRecommendation,
    reason: (user.hasDebts || totalDebtBalance > 0)
      ? 'Recomendação baseada no seu momento financeiro atual.'
      : 'Próximo passo sugerido para manter evolução consistente.',
    actionLabel: rawRecommendation.outcomeType === 'divida'
      ? 'Corrigir antes que vire juro'
      : rawRecommendation.outcomeType === 'reserva'
        ? 'Proteger sua base'
        : 'Avançar na jornada',
    outcome: rawRecommendation.outcomeType,
  } : null;

  return {
    ...state,
    // Surface lessonProgress under the key the frontend expects
    lessonProgress: state.lessonStepProgress,
    recommendation,
  };
}

export async function updateEducationData(userId: string, data: EducationState, tx?: unknown) {
  await persistState(userId, data, tx as Parameters<typeof persistState>[2]);
  return data;
}

/**
 * saveLessonProgress
 * ──────────────────
 * Persiste o passo parcial onde o usuário parou dentro de uma lição.
 * Se o usuário concluiu todos os passos (completedSteps === totalSteps),
 * marca a lição como concluída, credita XP e agenda próxima revisão via SM-2.
 */
export async function saveLessonProgress(
  userId: string,
  moduleId: string,
  completedSteps: number,
  lastActiveDate?: string
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { educationData: true },
  });

  if (!user) return;

  const state = parseState(user.educationData);
  const meta = EDUCATION_MODULES.find((m) => m.id === moduleId);
  const now = lastActiveDate || new Date().toISOString();

  // Bug fix: save previous date BEFORE overwriting so streak diff is correct
  const previousLastActiveDate = state.lastActiveDate;

  // Atualiza progresso parcial
  state.lessonStepProgress[moduleId] = completedSteps;
  state.lessonLastSeenAt[moduleId] = now;
  state.lastActiveDate = now;

  // Verifica se concluiu todos os passos (ou se não há metadata, considera concluído)
  const totalSteps = meta ? undefined : undefined; // metadata sobre passos está só no front
  // Heurística: se completedSteps >= 1 e a lição não está nos completed, não conclui aqui.
  // A conclusão definitiva é feita via POST /users/education/complete/:moduleId.
  // Este endpoint apenas persiste progresso PARCIAL.

  // Atualiza streak usando a data anterior (não a recém-gravada)
  const lastDate = previousLastActiveDate ? new Date(previousLastActiveDate) : null;
  const today = new Date();
  if (lastDate) {
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000);
    if (diffDays === 1) state.streak += 1;
    else if (diffDays > 1) state.streak = 1;
    // diffDays === 0 → mesmo dia, não altera streak
  } else {
    state.streak = 1;
  }

  await persistState(userId, state);

}

/**
 * markLessonComplete
 * ──────────────────
 * Chamado quando o usuário conclui TODOS os passos de uma lição.
 * Credita XP, atualiza completedModules e agenda próxima revisão via SM-2.
 */
export async function markLessonComplete(
  userId: string,
  moduleId: string
): Promise<{ xpEarned: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { educationData: true },
  });

  if (!user) return { xpEarned: 0 };

  const state = parseState(user.educationData);

  // Idempotência: não re-credita se já concluído
  if (state.completedModules.includes(moduleId)) return { xpEarned: 0 };

  const meta = EDUCATION_MODULES.find((m) => m.id === moduleId);
  const xpEarned = meta?.xp || 50;

  // Incrementa repetições para SM-2
  const repetitions = (state.contextualReinforcements[moduleId] || 0) + 1;
  state.contextualReinforcements[moduleId] = repetitions;

  // Agenda próxima revisão
  const nextReview = calcNextReviewDate(repetitions);
  state.lessonReviewDueAt[moduleId] = nextReview.toISOString();

  // Marca como concluída
  state.completedModules = [...new Set([...state.completedModules, moduleId])];
  state.xp += xpEarned;
  state.lastActiveDate = new Date().toISOString();

  await persistState(userId, state);

  return { xpEarned };
}

/**
 * getReviewDueModules
 * ───────────────────
 * Retorna as lições já concluídas cujo prazo de revisão espaçada expirou (ou está vencendo hoje).
 * Usado pelo front para exibir badge "Revisar" no módulo.
 */
export async function getReviewDueModules(userId: string): Promise<ReviewDueEntry[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { educationData: true },
  });

  if (!user) return [];

  const state = parseState(user.educationData);
  const now = new Date();

  return Object.entries(state.lessonReviewDueAt)
    .filter(([moduleId, dueAt]) => {
      // Só inclui módulos realmente concluídos cujo prazo venceu
      return (
        state.completedModules.includes(moduleId) &&
        new Date(dueAt) <= now
      );
    })
    .map(([moduleId, dueAt]) => {
      const diffMs = now.getTime() - new Date(dueAt).getTime();
      const overdueDays = Math.floor(diffMs / 86_400_000);
      return { moduleId, dueAt, overdueDays };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays); // mais atrasado primeiro
}
