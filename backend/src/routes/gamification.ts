import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as GamificationService from '../services/GamificationService.js';
import type { GamificationState } from '../services/GamificationService.js';

const gamificationStateSchema = z.object({
  level: z.object({
    level: z.number(),
    currentXp: z.number(),
    xpToNextLevel: z.number(),
    totalXp: z.number(),
    title: z.string(),
    perks: z.array(z.string()),
  }),
  achievements: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    category: z.string(),
    maxProgress: z.number(),
    progress: z.number(),
    isUnlocked: z.boolean(),
    unlockedAt: z.string().optional(),
    xpReward: z.number(),
  })),
  streaks: z.record(z.object({
    type: z.string(),
    current: z.number(),
    best: z.number(),
    lastUpdate: z.string(),
  })),
  weeklyChallenge: z.any().nullable(),
  leaderboard: z.array(z.any()),
});

export async function gamificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /gamification - Retrieve gamification state
  app.get('/gamification', {
    schema: {
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      response: {
        200: gamificationStateSchema,
        404: z.object({ message: z.string() }),
      },
    },
  }, async (request) => {
    return GamificationService.getState(request.user.id);
  });

  // PUT /gamification - Save gamification state
  app.put('/gamification', {
    schema: {
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      body: gamificationStateSchema,
    },
  }, async (request) => {
    await GamificationService.saveState(request.user.id, request.body as unknown as GamificationState);
    return { success: true };
  });

  // POST /gamification/award-xp - Award XP
  app.post('/gamification/award-xp', {
    schema: {
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        amount: z.number().positive(),
        reason: z.string().optional(),
      }),
      response: {
        200: z.object({ success: z.boolean(), newLevel: z.number() }),
      },
    },
  }, async (request) => {
    const { amount } = request.body as { amount: number };
    const result = await GamificationService.awardXp(request.user.id, amount);
    return { success: true, ...result };
  });
}