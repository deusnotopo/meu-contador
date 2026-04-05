import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import * as admin from 'firebase-admin';

// Lazy init — evita crash no boot caso o Firebase Admin não esteja configurado com service account
function getFirestore() {
  return admin.firestore();
}

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
  // GET /gamification - Retrieve gamification state
  app.get('/gamification', {
    schema: {
      description: 'Retrieve user gamification state',
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      response: {
        200: gamificationStateSchema,
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { gamificationData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let gamificationState = null;

      // Try to get from database first
      if (user.gamificationData) {
        try {
          gamificationState = JSON.parse(user.gamificationData);
        } catch (e) {
          console.error('Failed to parse gamification data from database:', e);
        }
      }

      // If not in database, try Firestore for cross-device sync
      if (!gamificationState) {
        try {
          const firestore = getFirestore();
          const docRef = firestore.collection('gamification').doc(userId);
          const doc = await docRef.get();
          if (doc.exists) {
            gamificationState = doc.data();
            // Save to database for future use
            await db.user.update({
              where: { id: userId },
              data: { gamificationData: JSON.stringify(gamificationState) },
            });
          }
        } catch (e) {
          console.error('Failed to fetch from Firestore:', e);
        }
      }

      // Default state if nothing found
      if (!gamificationState) {
        gamificationState = {
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
      }

      return gamificationState;
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // PUT /gamification - Save gamification state
  app.put('/gamification', {
    schema: {
      description: 'Save user gamification state',
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      body: gamificationStateSchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;
    const gamificationState = request.body;

    try {
      // Validate the state
      gamificationStateSchema.parse(gamificationState);

      const gamificationData = JSON.stringify(gamificationState);

      // Save to database
      await db.user.update({
        where: { id: userId },
        data: { gamificationData },
      });

      // Sync to Firestore for cross-device access
      try {
        const firestore = getFirestore();
        const docRef = firestore.collection('gamification').doc(userId);
        await docRef.set(gamificationState as admin.firestore.DocumentData);
      } catch (e) {
        console.error('Failed to sync to Firestore:', e);
        // Don't fail the request if Firestore sync fails
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving gamification data:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid gamification data' });
      }
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // PATCH /gamification/xp - Award XP
  app.patch('/gamification/xp', {
    schema: {
      description: 'Award XP to user',
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        amount: z.number().positive(),
        reason: z.string().optional(),
      }),
      response: {
        200: z.object({ success: z.boolean(), newLevel: z.number() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;
    const { amount, reason } = request.body as { amount: number; reason?: string };

    try {
      // Get current state
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { gamificationData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let currentState = {
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

      if (user.gamificationData) {
        try {
          currentState = JSON.parse(user.gamificationData);
        } catch (e) {
          console.error('Failed to parse existing gamification data:', e);
        }
      }

      // Calculate new XP and level
      const newTotalXp = currentState.level.totalXp + amount;
      const newLevel = calculateLevel(newTotalXp);

      const updatedState = {
        ...currentState,
        level: newLevel,
      };

      // Save updated state
      const gamificationData = JSON.stringify(updatedState);
      await db.user.update({
        where: { id: userId },
        data: { gamificationData },
      });

      // Sync to Firestore
      try {
        const firestore = getFirestore();
        const docRef = firestore.collection('gamification').doc(userId);
        await docRef.set(updatedState);
      } catch (e) {
        console.error('Failed to sync XP award to Firestore:', e);
      }

      return { success: true, newLevel: newLevel.level };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });
}

// Level calculation function (matches frontend logic)
function calculateLevel(totalXp: number) {
  let level = 1;
  let xpRemaining = totalXp;
  let xpForCurrentLevel = 100;

  while (xpRemaining >= xpForCurrentLevel) {
    xpRemaining -= xpForCurrentLevel;
    level++;
    xpForCurrentLevel = Math.floor(xpForCurrentLevel * 1.5);
  }

  return {
    level,
    currentXp: xpRemaining,
    xpToNextLevel: xpForCurrentLevel,
    totalXp,
    title: getLevelTitle(level),
    perks: getLevelPerks(level),
  };
}

function getLevelTitle(level: number): string {
  const titles = {
    1: 'Iniciante',
    2: 'Aprendiz',
    3: 'Intermediário',
    4: 'Avançado',
    5: 'Especialista',
    10: 'Mestre',
    15: 'Guru',
    20: 'Lenda',
  };
  return titles[level as keyof typeof titles] || 'Guru Financeiro';
}

function getLevelPerks(level: number): string[] {
  const perks = [];
  if (level >= 2) perks.push('Relatórios Avançados');
  if (level >= 5) perks.push('IA Premium');
  if (level >= 10) perks.push('Análises Preditivas');
  if (level >= 15) perks.push('Consultoria Personalizada');
  return perks;
}