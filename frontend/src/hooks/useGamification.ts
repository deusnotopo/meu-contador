import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { showSuccess } from '@/lib/toast';
import type {
  Achievement,
  GamificationState,
  Streak,
  UserLevel,
} from '@/types/gamification';
import {
  LEVEL_CONFIG,
  PREDEFINED_ACHIEVEMENTS,
  XP_REWARDS,
} from '@/types/gamification';

const STORAGE_KEY = 'gamification_state';

const calculateLevel = (totalXp: number): UserLevel => {
  // Each level requires progressively more XP
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
  let level = 1;
  let xpRemaining = totalXp;
  let xpForCurrentLevel = 100;

  while (xpRemaining >= xpForCurrentLevel) {
    xpRemaining -= xpForCurrentLevel;
    level++;
    xpForCurrentLevel = Math.floor(xpForCurrentLevel * 1.5);
  }

  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[50] || { title: 'Guru Financeiro', perks: ['Todos os Recursos'] };

  return {
    level,
    currentXp: xpRemaining,
    xpToNextLevel: xpForCurrentLevel,
    totalXp,
    title: config.title,
    perks: config.perks,
  };
};

const loadState = (userId: string): GamificationState => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        level: calculateLevel(parsed.level?.totalXp || 0),
      };
    }
  } catch (e) {
    console.error('Failed to load gamification state:', e);
  }

  // Default state
  const achievements: Achievement[] = PREDEFINED_ACHIEVEMENTS.map((a) => ({
    ...a,
    isUnlocked: false,
    progress: 0,
  }));

  return {
    level: calculateLevel(0),
    achievements,
    streaks: {},
    weeklyChallenge: null,
    leaderboard: [],
  };
};

const saveState = (userId: string, state: GamificationState) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save gamification state:', e);
  }
};

export function useGamification() {
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState>(() =>
    user ? loadState(user.id) : {
      level: calculateLevel(0),
      achievements: [],
      streaks: {},
      weeklyChallenge: null,
      leaderboard: [],
    }
  );

  // Save state when it changes
  useEffect(() => {
    if (user) {
      saveState(user.id, state);
    }
  }, [state, user]);

  // Award XP
  const awardXp = useCallback((amount: number) => {
    setState((prev) => {
      const newTotalXp = prev.level.totalXp + amount;
      const newLevel = calculateLevel(newTotalXp);
      const leveledUp = newLevel.level > prev.level.level;

      if (leveledUp) {
        showSuccess(`🎉 Nível ${newLevel.level}! ${newLevel.title}`);
      }

      return {
        ...prev,
        level: newLevel,
      };
    });
  }, []);

  // Unlock achievement
  const unlockAchievement = useCallback((achievementId: string) => {
    setState((prev) => {
      const achievement = prev.achievements.find((a) => a.id === achievementId);
      if (!achievement || achievement.isUnlocked) return prev;

      const updatedAchievements = prev.achievements.map((a) =>
        a.id === achievementId
          ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString(), progress: a.maxProgress }
          : a
      );

      const newTotalXp = prev.level.totalXp + achievement.xpReward;
      const newLevel = calculateLevel(newTotalXp);

      showSuccess(`🏆 Conquista desbloqueada: ${achievement.name}!`);

      return {
        ...prev,
        achievements: updatedAchievements,
        level: newLevel,
      };
    });
  }, []);

  // Update achievement progress
  const updateAchievementProgress = useCallback((achievementId: string, progress: number) => {
    setState((prev) => {
      const achievement = prev.achievements.find((a) => a.id === achievementId);
      if (!achievement || achievement.isUnlocked) return prev;

      const newProgress = Math.min(progress, achievement.maxProgress);
      const shouldUnlock = newProgress >= achievement.maxProgress;

      const updatedAchievements = prev.achievements.map((a) =>
        a.id === achievementId
          ? {
              ...a,
              progress: newProgress,
              isUnlocked: shouldUnlock,
              unlockedAt: shouldUnlock ? new Date().toISOString() : a.unlockedAt,
            }
          : a
      );

      let newTotalXp = prev.level.totalXp;
      if (shouldUnlock) {
        newTotalXp += achievement.xpReward;
        showSuccess(`🏆 Conquista desbloqueada: ${achievement.name}!`);
      }

      const newLevel = calculateLevel(newTotalXp);

      return {
        ...prev,
        achievements: updatedAchievements,
        level: newLevel,
      };
    });
  }, []);

  // Update streak
  const updateStreak = useCallback((type: 'login' | 'budget' | 'savings') => {
    setState((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const existingStreak = prev.streaks[type];
      const lastUpdate = existingStreak?.lastUpdate?.split('T')[0];

      if (lastUpdate === today) {
        // Already updated today
        return prev;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrent = 1;
      if (lastUpdate === yesterdayStr && existingStreak) {
        newCurrent = existingStreak.current + 1;
      }

      const newBest = Math.max(newCurrent, existingStreak?.best || 0);

      // Check streak achievements
      let newTotalXp = prev.level.totalXp;
      if (newCurrent === 7) {
        newTotalXp += XP_REWARDS.STREAK_BONUS;
        showSuccess('🔥 Streak de 7 dias! +100 XP');
      } else if (newCurrent === 30) {
        newTotalXp += XP_REWARDS.STREAK_BONUS * 3;
        showSuccess('💎 Streak de 30 dias! +300 XP');
      }

      const newLevel = calculateLevel(newTotalXp);

      return {
        ...prev,
        streaks: {
          ...prev.streaks,
          [type]: {
            type,
            current: newCurrent,
            best: newBest,
            lastUpdate: new Date().toISOString(),
          },
        },
        level: newLevel,
      };
    });
  }, []);

  // Get streak
  const getStreak = useCallback(
    (type: 'login' | 'budget' | 'savings'): Streak | null => {
      return state.streaks[type] || null;
    },
    [state.streaks]
  );

  // Check specific achievements
  const checkTransactionAchievement = useCallback(() => {
    updateAchievementProgress('first_transaction', 1);
    awardXp(XP_REWARDS.ADD_TRANSACTION);
  }, [updateAchievementProgress, awardXp]);

  const checkBudgetAchievement = useCallback(() => {
    updateAchievementProgress('first_budget', 1);
    awardXp(XP_REWARDS.COMPLETE_BUDGET);
  }, [updateAchievementProgress, awardXp]);

  const checkInvestmentAchievement = useCallback(() => {
    updateAchievementProgress('first_investment', 1);
    awardXp(XP_REWARDS.FIRST_INVESTMENT);
  }, [updateAchievementProgress, awardXp]);

  const checkGoalAchievement = useCallback(() => {
    updateAchievementProgress('savings_goal', 1);
    awardXp(XP_REWARDS.GOAL_CREATED);
  }, [updateAchievementProgress, awardXp]);

  const checkEducationAchievement = useCallback((completedLessons: number) => {
    updateAchievementProgress('education_master', completedLessons);
  }, [updateAchievementProgress]);

  const checkSavingsAchievement = useCallback((totalSavings: number) => {
    updateAchievementProgress('savings_1k', totalSavings);
    updateAchievementProgress('savings_10k', totalSavings);
  }, [updateAchievementProgress]);

  const checkPortfolioDiversification = useCallback((categories: number) => {
    updateAchievementProgress('diversified_portfolio', categories);
  }, [updateAchievementProgress]);

  const checkNetWorthAchievement = useCallback((netWorth: number) => {
    updateAchievementProgress('millionaire', netWorth);
  }, [updateAchievementProgress]);

  // Login reward
  const claimDailyLogin = useCallback(() => {
    updateStreak('login');
    awardXp(XP_REWARDS.DAILY_LOGIN);
  }, [updateStreak, awardXp]);

  // Get unlocked achievements
  const unlockedAchievements = state.achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = state.achievements.filter((a) => !a.isUnlocked);

  // Progress percentage
  const overallProgress = state.achievements.length > 0
    ? (unlockedAchievements.length / state.achievements.length) * 100
    : 0;

  return {
    // State
    level: state.level,
    achievements: state.achievements,
    unlockedAchievements,
    lockedAchievements,
    streaks: state.streaks,
    weeklyChallenge: state.weeklyChallenge,
    leaderboard: state.leaderboard,
    overallProgress,

    // Actions
    awardXp,
    unlockAchievement,
    updateAchievementProgress,
    updateStreak,
    getStreak,
    claimDailyLogin,

    // Checkers
    checkTransactionAchievement,
    checkBudgetAchievement,
    checkInvestmentAchievement,
    checkGoalAchievement,
    checkEducationAchievement,
    checkSavingsAchievement,
    checkPortfolioDiversification,
    checkNetWorthAchievement,
  };
}