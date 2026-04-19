import { useIntelligenceContext } from "@/context/IntelligenceContext";
import { useCallback } from "react";
import { api } from "@/lib/api";
import type { ContextualRecommendation } from "./educationEngine";

export interface DashboardIntelligence {
  wealthSurvivalDays: number;
  fireProgress: number;
  yearsToFire: number;
  monthlyAvgExpenses: number;
  monthlyAvgSurplus: number;
  opportunityCost10yr: number;
  optimizationTips: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  category?: string;
  xpReward?: number;
  progress?: number;
  maxProgress?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  xp: number;
  level: number;
}

export interface UnifiedIntelligenceState {
  financial: DashboardIntelligence;
  education: {
    completedModules: string[];
    xp: number;
    streak: number;
    lastActiveDate: string | null;
    recommendation: ContextualRecommendation | null;
  };
  gamification: {
    level: {
      level: number;
      currentXp: number;
      xpToNextLevel: number;
      totalXp: number;
      title: string;
      perks: string[];
    };
    achievements: Achievement[];
    streaks: StreakData;
    weeklyChallenge?: WeeklyChallenge | null;
    leaderboard?: LeaderboardEntry[];
  };
  serverTime: string;
}

export const useIntelligence = () => {
  const { state, loading, error, refresh } = useIntelligenceContext();

  const simulate = useCallback(async (params: {
    additionalMonthlyDeposit: number;
    expectedAnnualYield: number;
    horizonYears: number;
  }) => {
    try {
      const response = await api.post<{ data: DashboardIntelligence }>(
        "/intelligence/simulate",
        params,
      );
      return response.data;
    } catch (err: unknown) {
      console.error("Error simulating scenario:", err);
      throw err;
    }
  }, []);

  return {
    state,
    intelligence: state?.financial || null,
    education: state?.education || null,
    gamification: state?.gamification || null,
    loading,
    error,
    refresh,
    simulate,
  };
};
