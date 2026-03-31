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
          completedTours: z.array(z.string()).optional(),
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
    
    let prefs = { theme: 'dark', language: 'pt', privacyMode: false };
    try {
      if (typeof user.preferences === 'string') {
        prefs = JSON.parse(user.preferences);
      } else {
        prefs = user.preferences as any;
      }
    } catch (e) {
      console.error('Failed to parse user preferences:', e);
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
        theme: z.string().optional(),
        language: z.string().optional(),
        privacyMode: z.boolean().optional(),
        completedTours: z.array(z.string()).optional(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          preferences: z.object({
            theme: z.string(),
            language: z.string(),
            privacyMode: z.boolean(),
            completedTours: z.array(z.string()).optional(),
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

    let currentPreferences = { theme: 'dark', language: 'pt', privacyMode: false };
    try {
      if (typeof user.preferences === 'string') {
        currentPreferences = JSON.parse(user.preferences);
      } else {
        currentPreferences = user.preferences as any;
      }
    } catch (e) {
      console.error('Failed to parse current user preferences:', e);
    }

    const newPreferences = {
      ...currentPreferences,
      ...preferences,
    };
 
    console.log(`Updating preferences for user ${request.user.id}:`, newPreferences);
 
    await db.user.update({
      where: { id: request.user.id },
      data: { preferences: JSON.stringify(newPreferences) },
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

  // PUT /users/onboarding - Complete Setup
  app.put('/users/onboarding', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        profile: z.any().optional(),
        budgets: z.array(z.any()).optional(),
        goals: z.array(z.any()).optional(),
        preferences: z.any().optional(),
        completed: z.boolean().optional()
      }),
      response: {
        200: z.object({ success: z.boolean() })
      }
    },
    preHandler: [app.authenticate]
  }, async (request) => {
    const data = request.body as any;
    const userId = request.user.id;

    try {
      // 1. Update Profile
      if (data.profile) {
        const p = data.profile;
        await db.user.update({
          where: { id: userId },
          data: {
            name: p.name || undefined,
            monthlyIncome: p.monthlyIncome || undefined,
            financialGoal: p.financialGoal || undefined,
            riskProfile: p.riskProfile || undefined,
            employmentType: p.employmentType || undefined,
            hasEmergencyFund: p.hasEmergencyFund || false,
            hasDebts: p.hasDebts || false,
            initialBalance: p.initialBalance || 0,
            
            // New Advanced AI / Business Fields
            businessName: p.businessName || undefined,
            businessCnpj: p.businessCnpj || undefined,
            businessSector: p.businessSector || undefined,
            age: p.age || undefined,
            dependents: p.dependents || undefined,
            investmentHorizon: p.investmentHorizon || undefined,
          }
        });

        // 2. Initial Balance Transaction
        if (p.initialBalance && p.initialBalance !== 0) {
          await db.transaction.create({
            data: {
              userId,
              type: p.initialBalance > 0 ? 'income' : 'expense',
              description: p.initialBalance > 0 ? 'Saldo Inicial' : 'Dívida Inicial',
              amount: Math.abs(p.initialBalance),
              category: 'Outros',
              date: new Date(),
              scope: 'personal'
            }
          });
        }
      }

      // 3. Budgets
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const b of data.budgets) {
          if (b.enabled) {
            await db.budget.create({
              data: {
                userId,
                category: b.category,
                limit: b.amount || 0,
                month: new Date().toISOString().substring(0, 7)
              }
            });
          }
        }
      }

      // 4. Goals
      if (data.goals && Array.isArray(data.goals)) {
        for (const g of data.goals) {
          if (g.enabled) {
            await db.savingsGoal.create({
              data: {
                userId,
                name: g.name || g.id || "Meta",
                targetAmount: g.targetAmount || 0,
                deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                icon: g.icon,
                color: g.color || "#6366f1"
              }
            });
          }
        }
      }

      // 5. Update Preferences
      if (data.preferences) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user) {
          let currentPrefs = {};
          try {
            currentPrefs = JSON.parse(user.preferences);
          } catch(e) {}
          await db.user.update({
            where: { id: userId },
            data: { preferences: JSON.stringify({ ...currentPrefs, ...data.preferences }) }
          });
        }
      }

      // 6. Investments
      if (data.investments && Array.isArray(data.investments)) {
        for (const inv of data.investments) {
          await db.investment.create({
            data: {
               userId,
               name: inv.name || inv.ticker,
               ticker: inv.ticker || "INV",
               type: inv.type,
               amount: inv.quantity || 1,
               averagePrice: inv.price || 0,
               currentPrice: inv.price || 0,
               currency: "BRL"
            }
          });
        }
      }
      
      // 7. Historical Expenses (Transactions)
      if (data.historicalExpenses && Array.isArray(data.historicalExpenses)) {
         for (const exp of data.historicalExpenses) {
            await db.transaction.create({
               data: {
                  userId,
                  type: 'expense',
                  description: exp.description || 'Gasto do histórico',
                  amount: exp.amount || 0,
                  category: exp.category || 'Outros',
                  date: exp.date ? new Date(exp.date) : new Date(),
                  scope: 'personal',
                  classification: 'necessity'
               }
            });
         }
      }

      // 8. Reminders
      if (data.reminders && Array.isArray(data.reminders)) {
         for (const rem of data.reminders) {
            if (rem.enabled) {
               await db.billReminder.create({
                  data: {
                     userId,
                     name: rem.name,
                     amount: rem.amount || 0,
                     dueDate: rem.date ? new Date(rem.date) : new Date(new Date().setDate(20)),
                     category: rem.category || 'Outros',
                     recurring: rem.recurring || 'monthly',
                     isPaid: false
                  }
               });
            }
         }
      }

      // 9. Mark onboarding as completed
      await db.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true } as any
      });

      return { success: true };
    } catch (err) {
      console.error('Onboarding error:', err);
      // Tenta marcar onboarding como completo mesmo com erro parcial
      try {
        await db.user.update({
          where: { id: userId },
          data: { onboardingCompleted: true } as any
        });
      } catch (_) { /* ignora */ }
      return { success: true };
    }
  });
}

