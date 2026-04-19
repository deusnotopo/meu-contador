/**
 * EducationService
 * ────────────────
 * Handles the "Wealth Academy" progress, pedagogical state, and recommendations.
 */

import { db } from '../lib/db.js';
import { EDUCATION_MODULES, getRecommendedLesson } from '../lib/education-data.js';

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

export async function getEducationData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { 
      educationData: true,
      hasDebts: true,
      hasEmergencyFund: true,
      employmentType: true,
    },
  });

  if (!user) return null;

  let state: EducationState = DEFAULT_STATE;

  if (user.educationData) {
    if (typeof user.educationData === 'string') {
      try {
        state = JSON.parse(user.educationData);
      } catch {
        state = DEFAULT_STATE;
      }
    } else {
      state = user.educationData as unknown as EducationState;
    }
  }

  // Calculate recommendation on backend
  const recommendation = getRecommendedLesson(state.completedModules, {
    hasDebts: user.hasDebts || false,
    hasEmergencyFund: user.hasEmergencyFund || false,
    employmentType: user.employmentType || 'clt',
  });

  return {
    ...state,
    recommendation,
  };
}

export async function updateEducationData(userId: string, data: EducationState, tx?: any) {
  const client = tx || db;
  
  await client.user.update({
    where: { id: userId },
    data: { educationData: JSON.stringify(data) },
  });

  return data;
}
