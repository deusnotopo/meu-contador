import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as UserService from '../services/UserService.js';
import * as UserRepository from '../repositories/UserRepository.js';
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
  app.addHook('preHandler', app.authenticate);

  // PUT /users/me - Update Profile
  app.put('/users/me', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: updateUserProfileSchema,
      response: {
        200: userResponseSchema,
        404: userErrorSchema,
      }
    }
  }, async (request) => {
    const data = request.body as UpdateUserProfileDto;
    return UserService.updateProfile(request.user.id, data);
  });

  // GET /users/gamification - Get user's gamification data
  app.get('/users/gamification', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ gamificationData: z.any().optional() }),
        404: userErrorSchema,
      },
    }
  }, async (request, reply) => {
    const data = await UserService.getGamificationData(request.user.id);
    return { gamificationData: data };
  });

  // PUT /users/gamification - Update user's gamification data
  app.put('/users/gamification', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({ gamificationData: z.any() }),
      response: {
        200: z.object({ success: z.boolean(), gamificationData: z.any() }),
        500: userErrorSchema,
      },
    }
  }, async (request) => {
    const { gamificationData } = request.body as { gamificationData: Record<string, unknown> };
    const data = await UserService.updateGamificationData(request.user.id, gamificationData as Record<string, unknown>);
    return { success: true, gamificationData: data };
  });

  // GET /users/emotional - Get user's emotional journal entries
  app.get('/users/emotional', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ emotionalData: z.any().optional() }),
        404: userErrorSchema,
      },
    }
  }, async (request) => {
    const data = await UserService.getEmotionalData(request.user.id);
    return { emotionalData: data };
  });

  // PUT /users/emotional - Update user's emotional journal entries
  app.put('/users/emotional', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({ emotionalData: z.any() }),
      response: {
        200: z.object({ success: z.boolean(), emotionalData: z.any() }),
        500: userErrorSchema,
      },
    }
  }, async (request) => {
    const { emotionalData } = request.body as { emotionalData: Record<string, unknown> };
    const data = await UserService.updateEmotionalData(request.user.id, emotionalData as Record<string, unknown>);
    return { success: true, emotionalData: data };
  });

  // DELETE /users/me - Delete User Account
  app.delete('/users/me', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ success: z.boolean() }),
        400: userErrorSchema,
        500: userErrorSchema,
      },
    }
  }, async (request, reply) => {
    const result = await UserService.deleteAccount(request.user.id);
    if (!result) return reply.status(400).send({ message: 'Falha ao excluir conta. Talvez já tenha sido excluída.' });
    
    // Wipe cookies gracefully on the backend
    reply.header('Set-Cookie', [
      'mc_access_token=; Max-Age=0; HttpOnly; Path=/',
      'mc_refresh_token=; Max-Age=0; HttpOnly; Path=/',
      'mc_csrf_token=; Max-Age=0; Path=/'
    ]);

    return { success: true };
  });
}
