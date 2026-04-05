import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { showSuccess } from '@/lib/toast';
import { api } from '@/lib/api';
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

const calculateLevel = (totalXp: number): UserLevel => {
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

const createDefaultState = (): GamificationState => {
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

const fetchGamificationData = async (): Promise<GamificationState | null> => {
  try {
    const data = await api.get<{ gamificationData: GamificationState | null }>('/users/gamification');
    return data.gamificationData || null;
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return null;
  }
};

const saveGamificationData = async (state: GamificationState): Promise<boolean> => {
  try {
    await api.put('/users/gamification', { gamificationData: state });
    return true;
  } catch (error) {
    console.error('Error saving gamification data:', error);
    return false;
  }
};

export function useGamification() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<GamificationState>(createDefaultState);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoading(true);
        const data = await fetchGamificationData();
        if (data) {
          setState({
            ...data,
            level: calculateLevel(data.level?.totalXp || 0),
          });
        } else {
          setState(createDefaultState());
        }
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const saveState = useCallback(async (newState: GamificationState) => {
    await saveGamificationData(newState);
  }, []);

  const awardXp = useCallback((amount: number) => {
    setState((prev) => {
      const newTotalXp = prev.level.totalXp + amount;
      const newLevel = calculateLevel(newTotalXp);
      const leveledUp = newLevel.level > prev.level.level;

      if (leveledUp) {
        showSuccess(`🎉 Nível ${newLevel.level}! ${newLevel.title}`);
      }

      const newState = {
        ...prev,
        level: newLevel,
      };

      saveState(newState);
      return newState;
    });
  }, [saveState]);

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

      const newState = {
        ...prev,
        achievements: updatedAchievements,
        level: newLevel,
      };

      saveState(newState);
      return newState;
    });
  }, [saveState]);

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

      const newState = {
        ...prev,
        achievements: updatedAchievements,
        level: newLevel,
      };

      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const updateStreak = useCallback((type: 'login' | 'budget' | 'savings') => {
    setState((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const existingStreak = prev.streaks[type];
      const lastUpdate = existingStreak?.lastUpdate?.split('T')[0];

      if (lastUpdate === today) {
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

      let newTotalXp = prev.level.totalXp;
      if (newCurrent === 7) {
        newTotalXp += XP_REWARDS.STREAK_BONUS;
        showSuccess('🔥 Streak de 7 dias! +100 XP');
      } else if (newCurrent === 30) {
        newTotalXp += XP_REWARDS.STREAK_BONUS * 3;
        showSuccess('💎 Streak de 30 dias! +300 XP');
      }

      const newLevel = calculateLevel(newTotalXp);

      const newState = {
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

      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const getStreak = useCallback(
    (type: 'login' | 'budget' | 'savings'): Streak | null => {
      return state.streaks[type] || null;
    },
    [state.streaks]
  );

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

  const claimDailyLogin = useCallback(() => {
    updateStreak('login');
    awardXp(XP_REWARDS.DAILY_LOGIN);
  }, [updateStreak, awardXp]);

  const unlockedAchievements = state.achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = state.achievements.filter((a) => !a.isUnlocked);

  const overallProgress = state.achievements.length > 0
    ? (unlockedAchievements.length / state.achievements.length) * 100
    : 0;

  return {
    isLoading,
    level: state.level,
    achievements: state.achievements,
    unlockedAchievements,
    lockedAchievements,
    streaks: state.streaks,
    weeklyChallenge: state.weeklyChallenge,
    leaderboard: state.leaderboard,
    overallProgress,

    awardXp,
    unlockAchievement,
    updateAchievementProgress,
    updateStreak,
    getStreak,
    claimDailyLogin,

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