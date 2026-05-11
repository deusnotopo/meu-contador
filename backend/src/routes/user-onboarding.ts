import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as OnboardingService from '../services/OnboardingService.js';

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

const onboardingProfileSchema = updateUserProfileSchema.extend({
  hasEmergencyFund: z.boolean().optional(),
  hasDebts: z.boolean().optional(),
});

const onboardingBudgetSchema = z.object({
  enabled: z.boolean().optional(),
  category: z.string().trim().min(1).max(80),
  amount: z.number().nonnegative().max(1_000_000_000).optional(),
});

const onboardingGoalSchema = z.object({
  enabled: z.boolean().optional(),
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  targetAmount: z.number().nonnegative().max(1_000_000_000).optional(),
  deadline: z.string().optional(),
  priority: z.number().int().min(1).max(99).optional(),
  icon: z.string().trim().max(40).optional(),
  color: z.string().trim().max(20).optional(),
});

const onboardingReminderSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  amount: z.number().nonnegative().max(1_000_000_000).optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
  category: z.string().trim().max(80).optional(),
  recurring: z.string().trim().max(20).optional(),
});

const onboardingInvestmentSchema = z.object({
  name: z.string().trim().max(120).optional(),
  ticker: z.string().trim().max(20).optional(),
  type: z.string().trim().min(1).max(40),
  quantity: z.number().positive().max(1_000_000_000).optional(),
  price: z.number().nonnegative().max(1_000_000_000).optional(),
});

const onboardingDebtSchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1).max(120),
  balance: z.number().positive().max(1_000_000_000),
  interestRate: z.number().min(0).max(10_000),
  minPayment: z.number().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(40),
});

const onboardingHistoricalExpenseSchema = z.object({
  description: z.string().trim().max(200).optional(),
  amount: z.number().nonnegative().max(1_000_000_000).optional(),
  category: z.string().trim().max(80).optional(),
  date: z.string().optional(),
  month: z.string().optional(),
}).passthrough();

const onboardingBodySchema = z.object({
  profile: onboardingProfileSchema.optional(),
  budgets: z.array(onboardingBudgetSchema).max(50).optional(),
  goals: z.array(onboardingGoalSchema).max(50).optional(),
  reminders: z.array(onboardingReminderSchema).max(50).optional(),
  investments: z.array(onboardingInvestmentSchema).max(50).optional(),
  debts: z.array(onboardingDebtSchema).max(50).optional(),
  historicalExpenses: z.array(onboardingHistoricalExpenseSchema).max(200).optional(),
  preferences: z.record(z.unknown()).optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().datetime().optional(),
});

export async function userOnboardingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // PUT /users/onboarding - Atomic Complete Setup
  app.put('/users/onboarding', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: onboardingBodySchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ success: z.boolean(), message: z.string() }),
        500: z.object({ success: z.boolean(), message: z.string() })
      },
    },
  }, async (request, reply) => {
    try {
      const result = await OnboardingService.processOnboarding(request.user.id, request.body as Parameters<typeof OnboardingService.processOnboarding>[1]);
      return result;
    } catch (error: unknown) {
      request.log.error(error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      return reply.code(500).send({ 
        success: false, 
        message: 'Falha crítica ao processar onboarding atômico',
        details: msg 
      });
    }
  });
}
