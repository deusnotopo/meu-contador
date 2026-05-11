import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { type UserPreferencesDto } from '../../../shared/contracts.js';

const defaultUserPreferences: UserPreferencesDto = {
  theme: 'dark',
  language: 'pt',
  privacyMode: false,
  completedTours: [],
  showScore: true,
  showPredictions: true,
  weeklyReport: true,
  alerts: true,
};
import { validatePreferences } from '../lib/schemas/user-preferences.js';

const preferencesSchema = z.object({
  theme: z.string(),
  language: z.string(),
  privacyMode: z.boolean(),
  completedTours: z.array(z.string()).optional(),
});

const patchPreferencesSchema = preferencesSchema.partial();
const userErrorSchema = z.object({ message: z.string() });

export async function userPreferencesRoutes(app: FastifyInstance) {
  // GET /users/preferences
  app.get('/users/preferences', {
    schema: {
      description: 'Obtém as preferências do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          theme: preferencesSchema.shape.theme,
          language: preferencesSchema.shape.language,
          privacyMode: preferencesSchema.shape.privacyMode,
          completedTours: preferencesSchema.shape.completedTours,
        }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { preferences: true },
    });

    if (!user) {
      return defaultUserPreferences;
    }

    let prefs: UserPreferencesDto = { ...defaultUserPreferences };
    
    if (user.preferences) {
      if (typeof user.preferences === 'object') {
        prefs = { ...prefs, ...(user.preferences as Record<string, unknown>) };
      } else if (typeof user.preferences === 'string') {
        try {
          prefs = { ...prefs, ...JSON.parse(user.preferences) };
        } catch(e) {}
      }
    }

    return prefs;
  });

  // PATCH /users/preferences
  app.patch('/users/preferences', {
    schema: {
      description: 'Atualiza as preferências do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        theme: patchPreferencesSchema.shape.theme,
        language: patchPreferencesSchema.shape.language,
        privacyMode: patchPreferencesSchema.shape.privacyMode,
        completedTours: patchPreferencesSchema.shape.completedTours,
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          preferences: preferencesSchema,
        }),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const incoming = request.body as Partial<UserPreferencesDto>;

    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { preferences: true },
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found', error: 'User not found' });
    }

    let current: UserPreferencesDto = { ...defaultUserPreferences };
    if (user.preferences) {
      if (typeof user.preferences === 'object') {
        current = { ...current, ...(user.preferences as Record<string, unknown>) };
      } else if (typeof user.preferences === 'string') {
        try {
          current = { ...current, ...JSON.parse(user.preferences) };
        } catch(e) {}
      }
    }

    const mergedPreferences = { ...current, ...incoming };
    const validatedPreferences = validatePreferences(mergedPreferences);

    await db.user.update({
      where: { id: request.user.id },
      data: { preferences: JSON.stringify(validatedPreferences) },
    });

    return {
      success: true,
      preferences: validatedPreferences,
    };
  });
}
