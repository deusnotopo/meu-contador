/**
 * GamificationService
 * ───────────────────
 * Application layer for user engagement and pedagogical progression.
 */

import * as GamificationRepository from "../repositories/GamificationRepository.js";

export interface GamificationLevel {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXp: number;
  title: string;
  perks: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
}

export interface WeeklyChallenge {
  id: string;
  name: string;
  progress: number;
  target: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  level: number;
}

export interface GamificationState {
  level: GamificationLevel;
  achievements: Achievement[];
  streaks: Record<string, number>;
  weeklyChallenge: WeeklyChallenge | null;
  leaderboard: LeaderboardEntry[];
}

const DEFAULT_STATE: GamificationState = {
  level: {
    level: 1,
    currentXp: 0,
    xpToNextLevel: 100,
    totalXp: 0,
    title: 'Iniciante',
    perks: [],
  },
  achievements: [],
  streaks: {},
  weeklyChallenge: null,
  leaderboard: [],
};

export async function getState(userId: string) {
  let state = await GamificationRepository.findStateByUserId(userId);

  if (!state) {
    state = await GamificationRepository.fetchFromCloud(userId);
    if (state) {
      await GamificationRepository.saveState(userId, state);
    }
  }

  return state || DEFAULT_STATE;
}

export async function saveState(userId: string, state: GamificationState) {
  return GamificationRepository.saveState(userId, state as unknown as Record<string, unknown>);
}

export async function awardXp(userId: string, amount: number) {
  const currentState = await getState(userId) as GamificationState;
  
  const newTotalXp = currentState.level.totalXp + amount;
  const newLevelInfo = calculateLevel(newTotalXp);

  const updatedState = {
    ...currentState,
    level: newLevelInfo,
  };

  await GamificationRepository.saveState(userId, updatedState);
  return { newLevel: newLevelInfo.level };
}

/**
 * Progression Logic
 */

function calculateLevel(totalXp: number): GamificationLevel {
  let level = 1;
  let xpRemaining = totalXp;
  let xpForCurrentLevel = 100;

  while (xpRemaining >= xpForCurrentLevel) {
    xpRemaining -= xpForCurrentLevel;
    level++;
    xpForCurrentLevel = Math.floor(xpForCurrentLevel * 1.5);
  }

  const titles: Record<number, string> = {
    1: 'Iniciante',
    2: 'Aprendiz',
    3: 'Intermediário',
    4: 'Avançado',
    5: 'Especialista',
    10: 'Mestre',
    15: 'Guru',
    20: 'Lenda',
  };

  const perks = [];
  if (level >= 2) perks.push('Relatórios Avançados');
  if (level >= 5) perks.push('IA Premium');
  if (level >= 10) perks.push('Análises Preditivas');

  return {
    level,
    currentXp: xpRemaining,
    xpToNextLevel: xpForCurrentLevel,
    totalXp,
    title: titles[level] || 'Guru Financeiro',
    perks,
  };
}
