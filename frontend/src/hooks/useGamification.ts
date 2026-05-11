import { useCallback, useRef } from "react";
import { useIntelligence, type Achievement } from "./useIntelligence";
import { showSuccess } from "@/lib/toast";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";

export function useGamification() {
  const { gamification, loading, refresh } = useIntelligence();
  const lastAwardTimeRef = useRef<number>(0);

  const awardXp = useCallback(
    async (amount: number) => {
      if (!gamification) return;

      const now = Date.now();
      if (now - lastAwardTimeRef.current < 5000) {
        logger.debug("[useGamification] awardXp suprimido por throttle (5s)");
        return;
      }
      lastAwardTimeRef.current = now;

      try {
        await api.post("/gamification/award-xp", { amount });
      } catch {
        // Route may not exist in all environments — fail silently
      }
      refresh();
    },
    [gamification, refresh],
  );

  const unlockAchievement = useCallback(
    async (achievementId: string) => {
      try {
        await api.post("/gamification/achievement", { achievementId });
        showSuccess(`🏆 Conquista em processamento!`);
        refresh();
      } catch (error) {
        logger.error('[useGamification] Erro ao desbloquear conquista', error);
      }
    },
    [refresh],
  );

  const claimDailyLogin = useCallback(() => {
    // Backend should handle this automatically on first session,
    // but we'll call explicitly to maintain ceremony.
    awardXp(10); // Example reward
  }, [awardXp]);

  const achievements: Achievement[] = gamification?.achievements || [];
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked);

  const overallProgress =
    achievements.length > 0
      ? (unlockedAchievements.length / achievements.length) * 100
      : 0;

  return {
    isLoading: loading,
    level: gamification?.level || {
      level: 1,
      currentXp: 0,
      xpToNextLevel: 100,
      totalXp: 0,
      title: "Novato",
      perks: [],
    },
    achievements,
    unlockedAchievements,
    lockedAchievements,
    streaks: (gamification?.streaks || {}) as Record<string, { current: number; best: number }>,
    weeklyChallenge: gamification?.weeklyChallenge || null,
    leaderboard: gamification?.leaderboard || [],
    overallProgress,

    awardXp,
    unlockAchievement,
    claimDailyLogin,

    // Real Event Triggers connected to Backend AI Gamification Engine
    checkTransactionAchievement: useCallback(() => {
      api.post('/gamification/events/transaction').then(refresh).catch(() => {});
    }, [refresh]),
    checkBudgetAchievement: useCallback(() => {
      api.post('/gamification/events/budget').then(refresh).catch(() => {});
    }, [refresh]),
    checkInvestmentAchievement: useCallback(() => {
      api.post('/gamification/events/investment').then(refresh).catch(() => {});
    }, [refresh]),
    checkGoalAchievement: useCallback(() => {
      api.post('/gamification/events/goal').then(refresh).catch(() => {});
    }, [refresh]),
    checkEducationAchievement: useCallback(() => {
      api.post('/gamification/events/education').then(refresh).catch(() => {});
    }, [refresh]),
    checkSavingsAchievement: useCallback(() => {
      api.post('/gamification/events/savings').then(refresh).catch(() => {});
    }, [refresh]),
    checkPortfolioDiversification: useCallback(() => {
      api.post('/gamification/events/diversification').then(refresh).catch(() => {});
    }, [refresh]),
    checkNetWorthAchievement: useCallback(() => {
      api.post('/gamification/events/net-worth').then(refresh).catch(() => {});
    }, [refresh]),
    refresh
  };
}
