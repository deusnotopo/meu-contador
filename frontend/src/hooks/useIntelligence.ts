import { useIntelligenceContext } from "@/context/IntelligenceContext";
import { useCallback } from "react";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { z } from "zod";
const DecisionSchema = z.object({
  message: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  category: z.string(),
  trace: z.array(z.string()).optional(),
});

const RegimePointSchema = z.object({
  month: z.string(),
  regime: z.enum(['EXPANSION', 'STABILITY', 'CONTRACTION']),
  surplusRatio: z.number(),
  confidence: z.number(),
});

const RegimeResultSchema = z.object({
  currentRegime: z.enum(['EXPANSION', 'STABILITY', 'CONTRACTION']),
  regimeSince: z.string(),
  daysInRegime: z.number(),
  confidence: z.number(),
  trend: z.enum(['IMPROVING', 'STABLE', 'DETERIORATING']),
  history: z.array(RegimePointSchema),
  changePoints: z.array(z.string()),
});

const DashboardIntelligenceSchema = z.object({
  wealthSurvivalDays: z.number(),
  fireProgress: z.number(),
  yearsToFire: z.number(),
  monthlyAvgExpenses: z.number(),
  monthlyAvgSurplus: z.number(),
  opportunityCost10yr: z.number(),
  netWorth: z.number(),
  assets: z.number(),
  liabilities: z.number(),
  optimizationTips: z.array(z.string()),
  decisions: z.array(DecisionSchema).default([]),
  regime: z.nullable(RegimeResultSchema).default(null),
});

const ContextualRecommendationSchema = z.object({
  lesson: z.object({ id: z.string(), title: z.string() }).nullable(),
  reason: z.string()
});

const EducationStateSchema = z.object({
  completedModules: z.array(z.string()),
  xp: z.number(),
  streak: z.number(),
  lastActiveDate: z.string().nullable(),
  recommendation: ContextualRecommendationSchema.nullable()
});

const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  emoji: z.string(),
  isUnlocked: z.boolean(),
  unlockedAt: z.string().optional(),
  category: z.string().optional(),
  xpReward: z.number().optional(),
  progress: z.number().optional(),
  maxProgress: z.number().optional(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional()
});

const StreakDataSchema = z.object({
  current: z.number(),
  longest: z.number(),
  lastActiveDate: z.string().nullable()
});

const WeeklyChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  progress: z.number(),
  target: z.number(),
  reward: z.number()
});

const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  xp: z.number(),
  level: z.number()
});

const GamificationStateSchema = z.object({
  level: z.object({
    level: z.number(),
    currentXp: z.number(),
    xpToNextLevel: z.number(),
    totalXp: z.number(),
    title: z.string(),
    perks: z.array(z.string())
  }),
  achievements: z.array(AchievementSchema).default([]),
  streaks: StreakDataSchema,
  weeklyChallenge: z.nullable(WeeklyChallengeSchema).optional(),
  leaderboard: z.array(LeaderboardEntrySchema).optional()
});

export const UnifiedIntelligenceStateSchema = z.object({
  financial: DashboardIntelligenceSchema,
  education: z.nullable(EducationStateSchema).default(null),
  gamification: z.nullable(GamificationStateSchema).default(null),
  serverTime: z.string(),
});

export type DashboardIntelligence = z.infer<typeof DashboardIntelligenceSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type StreakData = z.infer<typeof StreakDataSchema>;
export type WeeklyChallenge = z.infer<typeof WeeklyChallengeSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type UnifiedIntelligenceState = z.infer<typeof UnifiedIntelligenceStateSchema>;

export const useIntelligence = () => {
  const { state, loading, error, refresh } = useIntelligenceContext();

  const simulate = useCallback(async (params: {
    additionalMonthlyDeposit: number;
    expectedAnnualYield: number;
    horizonYears: number;
  }) => {
    try {
      const response = await api.post<SimulationResult>(
        "/intelligence/simulate",
        params,
        {
          schema: z.object({
            timeline: z.array(z.object({
              month: z.number(),
              balance: z.number(),
              fireProgress: z.number(),
            })),
            monteCarlo: z.array(z.object({
              month: z.number(),
              p5: z.number(),
              p50: z.number(),
              p95: z.number(),
            })),
            finalBalance: z.number(),
            yearsToFireDelta: z.number(),
          })
        }
      );
      return response;
    } catch (err: unknown) {
      logger.error('[useIntelligence] Error simulating scenario', err);
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
