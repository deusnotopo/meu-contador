import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { dataReliabilityValues, type UpdateUserProfileDto, type UserPreferencesDto } from '../../../shared/contracts';
import { validatePreferences } from '../lib/schemas/user-preferences';

const preferencesSchema = z.object({
  theme: z.string(),
  language: z.string(),
  privacyMode: z.boolean(),
  completedTours: z.array(z.string()).optional(),
});

const patchPreferencesSchema = preferencesSchema.partial();

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
const onboardingHistoricalExpenseSchema = z.object({
  description: z.string().trim().max(200).optional(),
  amount: z.number().nonnegative().max(1_000_000_000).optional(),
  category: z.string().trim().max(80).optional(),
  date: z.string().datetime().optional(),
});
const onboardingBodySchema = z.object({
  profile: onboardingProfileSchema.optional(),
  budgets: z.array(onboardingBudgetSchema).max(50).optional(),
  goals: z.array(onboardingGoalSchema).max(50).optional(),
  reminders: z.array(onboardingReminderSchema).max(50).optional(),
  investments: z.array(onboardingInvestmentSchema).max(50).optional(),
  historicalExpenses: z.array(onboardingHistoricalExpenseSchema).max(200).optional(),
  preferences: patchPreferencesSchema.optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().datetime().optional(),
});

export async function userRoutes(app: FastifyInstance) {
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
      throw new Error('User not found');
    }

    let prefs = { theme: 'dark', language: 'pt', privacyMode: false, completedTours: [] } as UserPreferencesDto;
    
    if (user.preferences) {
      if (typeof user.preferences === 'object') {
        prefs = { ...prefs, ...(user.preferences as any) };
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
      throw new Error('User not found');
    }

    // preferences is now Json — merge objects directly, no parse/stringify
    let current = { theme: 'dark', language: 'pt', privacyMode: false, completedTours: [] } as UserPreferencesDto;
    if (user.preferences) {
      if (typeof user.preferences === 'object') {
        current = { ...current, ...(user.preferences as any) };
      } else if (typeof user.preferences === 'string') {
        try {
          current = { ...current, ...JSON.parse(user.preferences) };
        } catch(e) {}
      }
    }

    // Validate merged preferences using robust schema
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

  // PUT /users/onboarding - Complete Setup
  app.put('/users/onboarding', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: onboardingBodySchema,
      response: {
        200: z.object({ success: z.boolean() }),
        500: z.object({ success: z.boolean(), message: z.string() })
      }
    },
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const data = request.body as any;
    const userId = request.user.id;

    try {
      const now = new Date();
      const currentMonth = now.toISOString().substring(0, 7);
      const nextYear = new Date(now);
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      // All bulk operations run in parallel — from up to ~350 sequential queries
      // down to at most 8 queries total.
      await Promise.all([
        // 1. Update Profile
        data.profile ? db.user.update({
          where: { id: userId },
          data: {
            name: data.profile.name || undefined,
            monthlyIncome: data.profile.monthlyIncome || undefined,
            financialGoal: data.profile.financialGoal || undefined,
            riskProfile: data.profile.riskProfile || undefined,
            employmentType: data.profile.employmentType || undefined,
            hasEmergencyFund: data.profile.hasEmergencyFund ?? false,
            hasDebts: data.profile.hasDebts ?? false,
            initialBalance: data.profile.initialBalance ?? 0,
            businessName: data.profile.businessName || undefined,
            businessCnpj: data.profile.businessCnpj || undefined,
            businessSector: data.profile.businessSector || undefined,
            age: data.profile.age || undefined,
            dependents: data.profile.dependents ?? undefined,
            investmentHorizon: data.profile.investmentHorizon || undefined,
            investorProfile: data.profile.investorProfile || undefined,
            retirementAge: data.profile.retirementAge || undefined,
            fireTargetIncome: data.profile.fireTargetIncome || undefined,
            lgpdConsent: data.profile.lgpdConsent ?? false,
            lgpdConsentAt: data.profile.lgpdConsent ? new Date() : undefined,
            openFinanceBank: data.profile.openFinanceBank || undefined,
            insuranceTypes: data.profile.insuranceTypes?.length
              ? JSON.stringify(data.profile.insuranceTypes)
              : undefined,
          }
        }) : Promise.resolve(),

        // 2. Initial Balance Transaction (single record — stays as create)
        data.profile?.initialBalance && data.profile.initialBalance !== 0
          ? db.transaction.create({
              data: {
                userId,
                type: data.profile.initialBalance > 0 ? 'income' : 'expense',
                description: data.profile.initialBalance > 0 ? 'Saldo Inicial' : 'Dívida Inicial',
                amount: Math.abs(data.profile.initialBalance),
                category: 'Outros',
                date: now,
                scope: 'personal',
              }
            })
          : Promise.resolve(),

        // 3. Budgets — createMany replaces N sequential creates
        data.budgets?.length
          ? db.budget.createMany({
              data: (data.budgets as any[])
                .filter((b) => b.enabled)
                .map((b) => ({
                  userId,
                  category: b.category,
                  limit: b.amount || 0,
                  month: currentMonth,
                })),
            })
          : Promise.resolve(),

        // 4. Goals — createMany
        data.goals?.length
          ? db.savingsGoal.createMany({
              data: (data.goals as any[])
                .filter((g) => g.enabled)
                .map((g) => ({
                  userId,
                  name: g.name || g.id || 'Meta',
                  targetAmount: g.targetAmount || 0,
                  deadline: nextYear,
                  icon: g.icon,
                  color: g.color || '#6366f1',
                })),
            })
          : Promise.resolve(),

        // 5. Investments — createMany
        data.investments?.length
          ? db.investment.createMany({
              data: (data.investments as any[]).map((inv) => ({
                userId,
                name: inv.name || inv.ticker,
                ticker: inv.ticker || 'INV',
                type: inv.type,
                amount: inv.quantity || 1,
                averagePrice: inv.price || 0,
                currentPrice: inv.price || 0,
                currency: 'BRL',
              })),
            })
          : Promise.resolve(),

        // 6. Historical Expenses — createMany (up to 200 records)
        data.historicalExpenses?.length
          ? db.transaction.createMany({
              data: (data.historicalExpenses as any[]).map((exp) => ({
                userId,
                type: 'expense' as const,
                description: exp.description || 'Gasto do histórico',
                amount: exp.amount || 0,
                category: exp.category || 'Outros',
                date: exp.date ? new Date(exp.date) : now,
                scope: 'personal',
                classification: 'necessity',
              })),
            })
          : Promise.resolve(),

        // 7. Reminders — pre-calculate dates then createMany
        (() => {
          if (!data.reminders?.length) return Promise.resolve();
          const enabledReminders = (data.reminders as any[])
            .filter((rem) => rem.enabled)
            .map((rem) => {
              const targetDay = Number(rem.dueDay) || 10;
              const nextDate = new Date(now);
              nextDate.setDate(targetDay);
              if (nextDate < now) nextDate.setMonth(nextDate.getMonth() + 1);
              return {
                userId,
                name: rem.name || 'Conta',
                amount: Number(rem.amount) || 0,
                dueDate: nextDate,
                category: rem.category || 'Outros',
                recurring: rem.recurring || 'monthly',
                isPaid: false,
              };
            });
          return enabledReminders.length
            ? db.billReminder.createMany({ data: enabledReminders })
            : Promise.resolve();
        })(),

        // 8. Preferences — preferences is now Json, merge directly
        data.preferences
          ? (async () => {
              const user = await db.user.findUnique({ where: { id: userId }, select: { preferences: true } });
              if (!user) return;
              let currentPrefs = {} as Record<string, unknown>;
              if (user.preferences) {
                if (typeof user.preferences === 'object') {
                  currentPrefs = user.preferences as Record<string, unknown>;
                } else if (typeof user.preferences === 'string') {
                  try { currentPrefs = JSON.parse(user.preferences); } catch(e) {}
                }
              }              await db.user.update({
                where: { id: userId },
                data: { preferences: JSON.stringify({ ...currentPrefs, ...data.preferences }) },
              });
            })()
          : Promise.resolve(),
      ]);

      // 9. Mark onboarding as completed
      await db.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true } as any,
      });

      return { success: true };
    } catch (err) {
      console.error('Onboarding error:', err);
      return reply.status(500).send({ success: false, message: 'Falha ao concluir onboarding' });
    }
  });

  // GET /users/gamification - Get user's gamification data
  app.get('/users/gamification', {
    schema: {
      description: 'Obtém os dados de gamificação do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          gamificationData: z.any().optional(),
        }),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { gamificationData: true },
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    let data = null;
    if (user.gamificationData) {
      try {
        data = typeof user.gamificationData === 'string' 
          ? JSON.parse(user.gamificationData) 
          : user.gamificationData;
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
      body: z.object({
        gamificationData: z.any(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          gamificationData: z.any(),
        }),
        500: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { gamificationData } = request.body as { gamificationData: unknown };

    try {
      const dataToStore = typeof gamificationData === 'string' 
        ? gamificationData 
        : JSON.stringify(gamificationData);

      await db.user.update({
        where: { id: request.user.id },
        data: { gamificationData: dataToStore },
      });

      return {
        success: true,
        gamificationData,
      };
    } catch (err) {
      console.error('Gamification update error:', err);
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
        200: z.object({
          emotionalData: z.any().optional(),
        }),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { emotionalData: true },
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    let data = null;
    if (user.emotionalData) {
      try {
        data = typeof user.emotionalData === 'string' 
          ? JSON.parse(user.emotionalData) 
          : user.emotionalData;
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
      body: z.object({
        emotionalData: z.any(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          emotionalData: z.any(),
        }),
        500: userErrorSchema,
      },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { emotionalData } = request.body as { emotionalData: unknown };

    try {
      const dataToStore = typeof emotionalData === 'string' 
        ? emotionalData 
        : JSON.stringify(emotionalData);

      await db.user.update({
        where: { id: request.user.id },
        data: { emotionalData: dataToStore },
      });

      return {
        success: true,
        emotionalData,
      };
    } catch (err) {
      console.error('Emotional data update error:', err);
      return reply.status(500).send({ message: 'Failed to update emotional data' });
    }
  });

  // GET /users/export - LGPD Data Export
  app.get('/users/export', {
    schema: {
      description: 'Exporta todos os dados do usuário (LGPD compliance)',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.any(),
        404: userErrorSchema,
      },
    },
    preHandler: [app.authenticate, (app as any).proGuard],
  }, async (request, reply) => {
    const userId = request.user.id;

    const userData = await db.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
        },
        budgets: {
          where: { deletedAt: null },
        },
        goals: {
          where: { deletedAt: null },
        },
        investments: {
          where: { deletedAt: null },
          include: {
            dividends: true,
            sales: true,
          },
        },
        debts: {
          where: { deletedAt: null },
        },
        reminders: {
          where: { deletedAt: null },
        },
        bankAccounts: {
          where: { deletedAt: null },
        },
      },
    });

    if (!userData) {
      return reply.status(404).send({ message: 'User not found' });
    }

    // Remove sensitive fields
    const { passwordHash, ...exportData } = userData;

    // Log export for audit
    await db.auditLog.create({
      data: {
        userId,
        action: 'DATA_EXPORT',
        resource: 'user',
        resourceId: userId,
        metadata: JSON.stringify({ exportedAt: new Date().toISOString() }),
      },
    });

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
    
    return exportData;
  });
}


