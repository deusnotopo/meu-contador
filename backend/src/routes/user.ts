import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function userRoutes(app: FastifyInstance) {
  // GET /users/preferences
  app.get('/users/preferences', {
    schema: {
      description: 'Obtém as preferências do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          theme: z.string(),
          language: z.string(),
          privacyMode: z.boolean(),
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
      throw new Error('User not found');
    }

    return user.preferences as any;
  });

  // PATCH /users/preferences
  app.patch('/users/preferences', {
    schema: {
      description: 'Atualiza as preferências do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        theme: z.string().optional(),
        language: z.string().optional(),
        privacyMode: z.boolean().optional(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          preferences: z.object({
            theme: z.string(),
            language: z.string(),
            privacyMode: z.boolean(),
          }),
        }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const preferences = request.body as any;

    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { preferences: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentPreferences = user.preferences as any;
    const newPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    console.log(`Updating preferences for user ${request.user.id}:`, newPreferences);

    await db.user.update({
      where: { id: request.user.id },
      data: { preferences: newPreferences },
    });

    return {
      success: true,
      preferences: newPreferences,
    };
  });

  // PUT /users/me - Update Profile
  app.put('/users/me', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        name: z.string().optional(),
        monthlyIncome: z.number().optional(),
        financialGoal: z.string().optional(),
        riskProfile: z.string().optional(),
        businessName: z.string().optional(),
        businessCnpj: z.string().optional(),
        businessSector: z.string().optional(),
      }),
      response: {
        200: z.any()
      }
    },
    preHandler: [app.authenticate]
  }, async (request) => {
    const data = request.body as any;
    
    // Filter out undefined
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.monthlyIncome !== undefined) updateData.monthlyIncome = data.monthlyIncome;
    if (data.financialGoal !== undefined) updateData.financialGoal = data.financialGoal;
    if (data.riskProfile !== undefined) updateData.riskProfile = data.riskProfile;
    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.businessCnpj !== undefined) updateData.businessCnpj = data.businessCnpj;
    if (data.businessSector !== undefined) updateData.businessSector = data.businessSector;

    const user = await db.user.update({
        where: { id: request.user.id },
        data: updateData
    });
    
    const { passwordHash, ...rest } = user;
    return rest;
  });
}
