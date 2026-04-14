import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';

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

      await db.$transaction(async (tx) => {
        await Promise.all([
          data.profile ? tx.user.update({
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

          data.profile?.initialBalance && data.profile.initialBalance !== 0
            ? tx.transaction.create({
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

          data.budgets?.length
            ? tx.budget.createMany({
                skipDuplicates: true,
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

          data.goals?.length
            ? tx.savingsGoal.createMany({
                skipDuplicates: true,
                data: (data.goals as any[])
                  .filter((g) => g.enabled)
                  .map((g) => ({
                    userId,
                    name: g.name || g.id || 'Meta',
                    targetAmount: g.targetAmount || 0,
                    deadline: g.deadline ? new Date(g.deadline) : nextYear,
                    icon: g.icon || '🎯',
                    color: g.color || '#6366f1',
                  })),
              })
            : Promise.resolve(),

          data.investments?.length
            ? tx.investment.createMany({
                skipDuplicates: true,
                data: (data.investments as any[]).map((inv) => ({
                  userId,
                  name: inv.name || inv.ticker || 'Investimento',
                  ticker: inv.ticker || 'INV',
                  type: inv.type,
                  amount: inv.quantity || inv.amount || 1,
                  averagePrice: inv.price || inv.averagePrice || 0,
                  currentPrice: inv.price || inv.currentPrice || 0,
                  currency: 'BRL',
                })),
              })
            : Promise.resolve(),

           data.historicalExpenses?.length
            ? tx.transaction.createMany({
                data: (data.historicalExpenses as any[]).map((exp) => ({
                  userId,
                  type: 'expense' as const,
                  description: exp.description || 'Gasto do histórico',
                  amount: exp.amount || 0,
                  category: exp.category || 'Outros',
                  date: exp.date ? new Date(exp.date) : exp.month ? new Date(exp.month + '-01T00:00:00Z') : now,
                  scope: 'personal',
                  classification: 'necessity',
                })),
              })
            : Promise.resolve(),

          (() => {
            if (!data.reminders?.length) return Promise.resolve();
            const enabledReminders = (data.reminders as any[])
              .filter((rem) => rem.enabled && rem.name)
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
              ? tx.billReminder.createMany({ skipDuplicates: true, data: enabledReminders })
              : Promise.resolve();
          })(),

          data.debts?.length
            ? tx.debt.createMany({
                skipDuplicates: true,
                data: (data.debts as any[]).map((debt) => ({
                  userId,
                  name: debt.name,
                  balance: debt.balance,
                  interestRate: debt.interestRate,
                  minPayment: debt.minPayment,
                  category: debt.category,
                })),
              })
            : Promise.resolve(),

          data.preferences
            ? (async () => {
                const user = await tx.user.findUnique({ where: { id: userId }, select: { preferences: true } });
                if (!user) return;
                let currentPrefs = {} as Record<string, unknown>;
                if (user.preferences) {
                  if (typeof user.preferences === 'object') {
                    currentPrefs = user.preferences as Record<string, unknown>;
                  } else if (typeof user.preferences === 'string') {
                    try { currentPrefs = JSON.parse(user.preferences); } catch(e) {}
                  }
                }
                await tx.user.update({
                  where: { id: userId },
                  data: { preferences: JSON.stringify({ ...currentPrefs, ...data.preferences }) },
                });
              })()
            : Promise.resolve(),
        ]);

        await tx.user.update({
          where: { id: userId },
          data: { onboardingCompleted: data.completed === true } as any,
        });
      });

      return { success: true };
    } catch (err: any) {
      const detail = err?.message || err?.code || String(err);
      const meta = err?.meta ? JSON.stringify(err.meta) : '';
      console.error(`[Onboarding] Error for user ${userId}: ${detail}${meta ? ' | meta: ' + meta : ''}`);
      return reply.status(500).send({ success: false, message: `Falha ao concluir onboarding: ${detail}` });
    }
  });
}
