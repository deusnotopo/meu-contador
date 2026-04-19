import { useCallback } from "react";
import { useIntelligence, type Achievement } from "./useIntelligence";
import { showSuccess } from "@/lib/toast";
import { api } from "@/lib/api";

export function useGamification() {
  const { gamification, loading, refresh } = useIntelligence();

  const awardXp = useCallback(
    async (amount: number) => {
      if (!gamification) return;
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
        console.error("Erro ao desbloquear conquista:", error);
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

    // Compatibility shim for event-based achievements
    checkTransactionAchievement: () => {},
    checkBudgetAchievement: () => {}, 
    checkInvestmentAchievement: () => {},
    checkGoalAchievement: () => {},
    checkEducationAchievement: () => {},
    checkSavingsAchievement: () => {},
    checkPortfolioDiversification: () => {},
    checkNetWorthAchievement: () => {},
    refresh
  };
}
