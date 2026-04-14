import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';
import type { UpdateUserProfileDto } from '../../../shared/contracts.js';

const updateUserProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  monthlyIncome: z.number().nonnegative().max(1_000_000_000).optional(),
  financialGoal: z.string().trim().min(1).max(80).optional(),
  riskProfile: z.string().trim().min(1).max(40).optional(),
  businessName: z.string().trim().min(1).max(120).optional(),
  businessCnpj: z.string().trim().min(11).max(18).optional(),
  businessSector: z.string().trim().min(1).max(80).optional(),
  employmentType: z.string().trim().min(1).max(40).optional(),
  hasEmergencyFund: z.boolean().optional(),
  hasDebts: z.boolean().optional(),
  initialBalance: z.number().min(-1_000_000_000).max(1_000_000_000).optional(),
  age: z.number().int().min(0).max(120).optional(),
  dependents: z.number().int().min(0).max(20).optional(),
  investmentHorizon: z.string().trim().min(1).max(40).optional(),
  investorProfile: z.string().trim().max(40).optional(),
  retirementAge: z.number().int().min(18).max(99).optional(),
  fireTargetIncome: z.number().nonnegative().max(1_000_000_000).optional(),
  lgpdConsent: z.boolean().optional(),
  openFinanceBank: z.string().trim().max(80).optional(),
  insuranceTypes: z.array(z.string().trim().max(40)).optional(),
  onboardingCompleted: z.boolean().optional(),
});

const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  monthlyIncome: z.number().nullable().optional(),
  financialGoal: z.string().nullable().optional(),
  riskProfile: z.string().nullable().optional(),
  businessName: z.string().nullable().optional(),
  businessCnpj: z.string().nullable().optional(),
  businessSector: z.string().nullable().optional(),
  employmentType: z.string().nullable().optional(),
  hasEmergencyFund: z.boolean().nullable().optional(),
  hasDebts: z.boolean().nullable().optional(),
  initialBalance: z.number().nullable().optional(),
  age: z.number().nullable().optional(),
  dependents: z.number().nullable().optional(),
  investmentHorizon: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  isPro: z.boolean().optional(),
}).passthrough();

const userErrorSchema = z.object({ message: z.string() });

export async function userRoutes(app: FastifyInstance) {
  // PUT /users/me - Update Profile
  app.put('/users/me', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        ...updateUserProfileSchema.shape,
      }),
      response: {
        200: userResponseSchema,
        404: userErrorSchema,
      }
    },
    preHandler: [app.authenticate]
  }, async (request) => {
    const data = request.body as UpdateUserProfileDto;
    
    // Filter out undefined
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.monthlyIncome !== undefined) updateData.monthlyIncome = data.monthlyIncome;
    if (data.financialGoal !== undefined) updateData.financialGoal = data.financialGoal;
    if (data.riskProfile !== undefined) updateData.riskProfile = data.riskProfile;
    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.businessCnpj !== undefined) updateData.businessCnpj = data.businessCnpj;
    if (data.businessSector !== undefined) updateData.businessSector = data.businessSector;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.hasEmergencyFund !== undefined) updateData.hasEmergencyFund = data.hasEmergencyFund;
    if (data.hasDebts !== undefined) updateData.hasDebts = data.hasDebts;
    if (data.initialBalance !== undefined) updateData.initialBalance = data.initialBalance;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.dependents !== undefined) updateData.dependents = data.dependents;
    if (data.investmentHorizon !== undefined) updateData.investmentHorizon = data.investmentHorizon;
    if (data.onboardingCompleted !== undefined) updateData.onboardingCompleted = data.onboardingCompleted;

    const user = await db.user.update({
        where: { id: request.user.id },
        data: updateData
    });
    
    const { passwordHash, ...rest } = user;
    return rest;
  });

  // GET /users/gamification - Get user's gamification data
  app.get('/users/gamification', {
    schema: {
      description: 'Obtém os dados de gamificação do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ gamificationData: z.any().optional() }),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { gamificationData: true },
    });

    if (!user) return reply.status(404).send({ message: 'User not found' });

    let data = null;
    if (user.gamificationData) {
      try {
        data = typeof user.gamificationData === 'string' ? JSON.parse(user.gamificationData) : user.gamificationData;
      } catch (e) {
        data = null;
      }
    }
    return { gamificationData: data };
  });

  // PUT /users/gamification - Update user's gamification data
  app.put('/users/gamification', {
    schema: {
      description: 'Atualiza os dados de gamificação do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({ gamificationData: z.any() }),
      response: {
        200: z.object({ success: z.boolean(), gamificationData: z.any() }),
        500: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { gamificationData } = request.body as { gamificationData: unknown };
    try {
      const dataToStore = typeof gamificationData === 'string' ? gamificationData : JSON.stringify(gamificationData);
      await db.user.update({
        where: { id: request.user.id },
        data: { gamificationData: dataToStore },
      });
      return { success: true, gamificationData };
    } catch (err) {
      return reply.status(500).send({ message: 'Failed to update gamification data' });
    }
  });

  // GET /users/emotional - Get user's emotional journal entries
  app.get('/users/emotional', {
    schema: {
      description: 'Obtém os registros emocionais do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ emotionalData: z.any().optional() }),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { emotionalData: true },
    });

    if (!user) return reply.status(404).send({ message: 'User not found' });

    let data = null;
    if (user.emotionalData) {
      try {
        data = typeof user.emotionalData === 'string' ? JSON.parse(user.emotionalData) : user.emotionalData;
      } catch (e) {
        data = null;
      }
    }
    return { emotionalData: data };
  });

  // PUT /users/emotional - Update user's emotional journal entries
  app.put('/users/emotional', {
    schema: {
      description: 'Atualiza os registros emocionais do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({ emotionalData: z.any() }),
      response: {
        200: z.object({ success: z.boolean(), emotionalData: z.any() }),
        500: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { emotionalData } = request.body as { emotionalData: unknown };
    try {
      const dataToStore = typeof emotionalData === 'string' ? emotionalData : JSON.stringify(emotionalData);
      await db.user.update({
        where: { id: request.user.id },
        data: { emotionalData: dataToStore },
      });
      return { success: true, emotionalData };
    } catch (err) {
      return reply.status(500).send({ message: 'Failed to update emotional data' });
    }
  });
}
