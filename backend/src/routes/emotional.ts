import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import * as admin from 'firebase-admin';

// Lazy init — evita crash no boot sem Firebase service account
function getFirestore() {
  return admin.firestore();
}

const emotionalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  emotion: z.enum(['happy', 'sad', 'anxious', 'stressed', 'excited', 'guilty', 'proud', 'neutral', 'angry', 'frustrated']),
  amount: z.number().optional(),
  category: z.string().optional(),
  motivation: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  regretLevel: z.number().min(1).max(5).optional(),
  satisfactionLevel: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

const emotionalEntriesArraySchema = z.array(emotionalEntrySchema);

export async function emotionalRoutes(app: FastifyInstance) {
  // GET /emotional - Retrieve emotional entries
  app.get('/emotional', {
    schema: {
      description: 'Retrieve user emotional journal entries',
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        emotion: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50).optional(),
      }),
      response: {
        200: z.object({
          entries: emotionalEntriesArraySchema,
          total: z.number(),
        }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;
    const { startDate, endDate, emotion, limit } = request.query as {
      startDate?: string; endDate?: string; emotion?: string; limit?: number;
    };

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { emotionalData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let entries: any[] = [];

      // Try to get from database first
      if (user.emotionalData) {
        try {
          entries = JSON.parse(user.emotionalData);
        } catch (e) {
          console.error('Failed to parse emotional data from database:', e);
        }
      }

      // If not in database, try Firestore for cross-device sync
      if (!entries.length) {
        try {
          const firestore = getFirestore();
          const collectionRef = firestore.collection('emotional').doc(userId).collection('entries');
          const snapshot = await collectionRef.orderBy('date', 'desc').limit(limit || 50).get();

          entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Save to database for future use
          if (entries.length > 0) {
            await db.user.update({
              where: { id: userId },
              data: { emotionalData: JSON.stringify(entries) },
            });
          }
        } catch (e) {
          console.error('Failed to fetch from Firestore:', e);
        }
      }

      // Apply filters
      let filteredEntries = entries;

      if (startDate || endDate) {
        filteredEntries = filteredEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return entryDate >= start && entryDate <= end;
        });
      }

      if (emotion) {
        filteredEntries = filteredEntries.filter(entry => entry.emotion === emotion);
      }

      // Sort by date descending and apply limit
      filteredEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (limit) {
        filteredEntries = filteredEntries.slice(0, limit);
      }

      return {
        entries: filteredEntries,
        total: entries.length,
      };
    } catch (error) {
      console.error('Error fetching emotional entries:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // POST /emotional - Add new emotional entry
  app.post('/emotional', {
    schema: {
      description: 'Add new emotional journal entry',
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      body: emotionalEntrySchema.omit({ id: true, date: true }),
      response: {
        201: emotionalEntrySchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;
    const entryData = request.body as Omit<z.infer<typeof emotionalEntrySchema>, 'id' | 'date'>;

    try {
      // Get current entries
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { emotionalData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let entries: any[] = [];
      if (user.emotionalData) {
        try {
          entries = JSON.parse(user.emotionalData);
        } catch (e) {
          console.error('Failed to parse existing emotional data:', e);
        }
      }

      // Create new entry
      const newEntry = {
        ...entryData,
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
      };

      entries.unshift(newEntry); // Add to beginning

      // Save to database
      await db.user.update({
        where: { id: userId },
        data: { emotionalData: JSON.stringify(entries) },
      });

      // Sync to Firestore
      try {
        const firestore = getFirestore();
        const docRef = firestore.collection('emotional').doc(userId).collection('entries').doc(newEntry.id);
        await docRef.set(newEntry);
      } catch (e) {
        console.error('Failed to sync to Firestore:', e);
      }

      return reply.status(201).send(newEntry);
    } catch (error) {
      console.error('Error adding emotional entry:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid emotional entry data' });
      }
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // PUT /emotional/:id - Update emotional entry
  app.put('/emotional/:id', {
    schema: {
      description: 'Update emotional journal entry',
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      body: emotionalEntrySchema.partial().omit({ id: true, date: true }),
      response: {
        200: emotionalEntrySchema,
        404: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };
    const updates = request.body as Partial<Omit<z.infer<typeof emotionalEntrySchema>, 'id' | 'date'>>;

    try {
      // Get current entries
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { emotionalData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let entries: any[] = [];
      if (user.emotionalData) {
        try {
          entries = JSON.parse(user.emotionalData);
        } catch (e) {
          console.error('Failed to parse existing emotional data:', e);
        }
      }

      // Find and update entry
      const entryIndex = entries.findIndex(entry => entry.id === id);
      if (entryIndex === -1) {
        return reply.status(404).send({ message: 'Emotional entry not found' });
      }

      const updatedEntry = {
        ...entries[entryIndex],
        ...updates,
      };

      entries[entryIndex] = updatedEntry;

      // Save to database
      await db.user.update({
        where: { id: userId },
        data: { emotionalData: JSON.stringify(entries) },
      });

      // Sync to Firestore
      try {
        const firestore = getFirestore();
        const docRef = firestore.collection('emotional').doc(userId).collection('entries').doc(id);
        await docRef.update(updates as admin.firestore.UpdateData<admin.firestore.DocumentData>);
      } catch (e) {
        console.error('Failed to sync update to Firestore:', e);
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error updating emotional entry:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid update data' });
      }
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // DELETE /emotional/:id - Delete emotional entry
  app.delete('/emotional/:id', {
    schema: {
      description: 'Delete emotional journal entry',
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({ success: z.boolean() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };

    try {
      // Get current entries
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { emotionalData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let entries: any[] = [];
      if (user.emotionalData) {
        try {
          entries = JSON.parse(user.emotionalData);
        } catch (e) {
          console.error('Failed to parse existing emotional data:', e);
        }
      }

      // Find and remove entry
      const entryIndex = entries.findIndex(entry => entry.id === id);
      if (entryIndex === -1) {
        return reply.status(404).send({ message: 'Emotional entry not found' });
      }

      entries.splice(entryIndex, 1);

      // Save to database
      await db.user.update({
        where: { id: userId },
        data: { emotionalData: JSON.stringify(entries) },
      });

      // Delete from Firestore
      try {
        const firestore = getFirestore();
        const docRef = firestore.collection('emotional').doc(userId).collection('entries').doc(id);
        await docRef.delete();
      } catch (e) {
        console.error('Failed to delete from Firestore:', e);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting emotional entry:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /emotional/patterns - Get emotional patterns and insights
  app.get('/emotional/patterns', {
    schema: {
      description: 'Get emotional patterns and insights',
      tags: ['Emotional'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          patterns: z.array(z.object({
            emotion: z.string(),
            frequency: z.number(),
            averageSpend: z.number(),
            topCategories: z.array(z.string()),
            topTriggers: z.array(z.string()),
            regretRate: z.number(),
          })),
          insights: z.array(z.any()),
          stats: z.object({
            totalEntries: z.number(),
            thisWeekCount: z.number(),
            dominantEmotion: z.string(),
            regretRate: z.number(),
            averageSatisfaction: z.number(),
          }),
        }),
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
        select: { emotionalData: true },
      });

      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      let entries: any[] = [];
      if (user.emotionalData) {
        try {
          entries = JSON.parse(user.emotionalData);
        } catch (e) {
          console.error('Failed to parse emotional data:', e);
        }
      }

      // Calculate patterns (simplified version of frontend logic)
      const patterns = calculateEmotionalPatterns(entries);
      const insights = generateEmotionalInsights(entries, patterns);
      const stats = calculateEmotionalStats(entries, patterns);

      return {
        patterns,
        insights,
        stats,
      };
    } catch (error) {
      console.error('Error calculating emotional patterns:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });
}

// Helper functions for emotional analysis
function calculateEmotionalPatterns(entries: any[]) {
  const patternMap: Record<string, any> = {};

  entries.forEach((entry) => {
    const key = entry.emotion;
    if (!patternMap[key]) {
      patternMap[key] = {
        count: 0,
        totalSpend: 0,
        categories: {},
        triggers: {},
        regretCount: 0,
      };
    }

    const pattern = patternMap[key]!;
    pattern.count++;
    pattern.totalSpend += entry.amount || 0;

    if (entry.category) {
      pattern.categories[entry.category] = (pattern.categories[entry.category] || 0) + 1;
    }

    entry.triggers?.forEach((trigger: string) => {
      pattern.triggers[trigger] = (pattern.triggers[trigger] || 0) + 1;
    });

    if (entry.regretLevel && entry.regretLevel >= 4) {
      pattern.regretCount++;
    }
  });

  return Object.entries(patternMap).map(([emotion, data]: [string, any]) => ({
    emotion,
    frequency: data.count,
    averageSpend: data.count > 0 ? data.totalSpend / data.count : 0,
    topCategories: (Object.entries(data.categories) as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat),
    topTriggers: (Object.entries(data.triggers) as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger),
    regretRate: data.count > 0 ? (data.regretCount / data.count) * 100 : 0,
  }));
}

function generateEmotionalInsights(entries: any[], patterns: any[]) {
  const insights = [];

  if (entries.length < 3) {
    insights.push({
      type: 'tip',
      title: 'Comece seu diário emocional',
      description: 'Registre suas emoções em pelo menos 3 compras para ver padrões.',
    });
    return insights;
  }

  // High regret warning
  const regrettedEntries = entries.filter((e: any) => e.regretLevel && e.regretLevel >= 4);
  if (regrettedEntries.length >= 3) {
    const regrettedAmount = regrettedEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    insights.push({
      type: 'warning',
      title: 'Muitas compras com arrependimento',
      description: `Você se arrependeu de ${regrettedEntries.length} compras, totalizando R$ ${regrettedAmount.toLocaleString('pt-BR')}.`,
      recommendation: 'Tente esperar 24h antes de compras não essenciais.',
    });
  }

  // Stress spending pattern
  const stressPattern = patterns.find((p: any) => p.emotion === 'stressed');
  if (stressPattern && stressPattern.frequency >= 3) {
    insights.push({
      type: 'pattern',
      title: 'Você compra quando estressado',
      description: `${stressPattern.frequency} compras foram feitas sob estresse, com média de R$ ${stressPattern.averageSpend.toFixed(2)}.`,
      emotion: 'stressed',
      recommendation: 'Quando estressado, tente caminhar ou meditar antes de comprar.',
    });
  }

  return insights;
}

function calculateEmotionalStats(entries: any[], patterns: any[]) {
  const totalEntries = entries.length;
  const thisWeekEntries = getThisWeekEntries(entries);

  const dominantEmotion = patterns.length > 0
    ? patterns.reduce((a: any, b: any) => (a.frequency > b.frequency ? a : b))
    : null;

  const regretRate = totalEntries > 0
    ? (entries.filter((e: any) => e.regretLevel && e.regretLevel >= 4).length / totalEntries) * 100
    : 0;

  const averageSatisfaction = entries.length > 0
    ? entries.reduce((sum: number, e: any) => sum + (e.satisfactionLevel || 3), 0) / entries.length
    : 0;

  return {
    totalEntries,
    thisWeekCount: thisWeekEntries.length,
    dominantEmotion: dominantEmotion?.emotion || 'neutral',
    regretRate,
    averageSatisfaction,
  };
}

function getThisWeekEntries(entries: any[]) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return entries.filter((e: any) => {
    const entryDate = new Date(e.date);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });
}