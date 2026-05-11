/**
 * OnboardingService
 * ─────────────────
 * Orchestrates the atomic initialization of a user's environment.
 */

import { db } from "../lib/db.js";
import * as UserService from "./UserService.js";
import * as BudgetService from "./BudgetService.js";
import * as GoalService from "./GoalService.js";
import * as ReminderService from "./ReminderService.js";
import * as InvestmentService from "./InvestmentService.js";
import * as DebtService from "./DebtService.js";
import * as TransactionRepository from "../repositories/TransactionRepository.js";
import { toCents } from "../../../shared/currency.js";

export interface OnboardingBudget { category: string; amount: number }
export interface OnboardingGoal { name: string; targetAmount: number; deadline?: string; icon?: string; color?: string }
export interface OnboardingReminder { name: string; amount: number; dueDay?: number; category?: string; recurring?: string }
export interface OnboardingInvestment { name?: string; ticker?: string; type: string; quantity?: number; price?: number }
export interface OnboardingDebt { name: string; balance: number; interestRate: number; minPayment: number; category: string }
export interface OnboardingHistoricalExpense { description?: string; amount?: number; category?: string; date?: string; month?: string }

export interface OnboardingPayload {
  profile?: Record<string, unknown>;
  budgets?: OnboardingBudget[];
  goals?: OnboardingGoal[];
  reminders?: OnboardingReminder[];
  investments?: OnboardingInvestment[];
  debts?: OnboardingDebt[];
  historicalExpenses?: OnboardingHistoricalExpense[];
  preferences?: Record<string, unknown>;
  completed?: boolean;
}

export async function processOnboarding(userId: string, payload: OnboardingPayload) {
  return db.$transaction(async (tx) => {
    // 1. Update Profile & Initial Balance
    if (payload.profile) {
      await UserService.updateProfile(userId, {
        ...payload.profile,
        onboardingCompleted: payload.completed ?? true
      }, tx);
    }

    // 2. Setup Budgets
    if (payload.budgets && payload.budgets.length > 0) {
      const budgetData = payload.budgets.map((b: OnboardingBudget) => ({
        userId,
        category: b.category,
        limit: toCents(b.amount),
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
      }));
      await BudgetService.createManyBudgets(userId, budgetData, tx);
    }

    // 3. Setup Goals
    if (payload.goals && payload.goals.length > 0) {
      const goalData = payload.goals.map((g: OnboardingGoal) => ({
        userId,
        name: g.name,
        targetAmount: toCents(g.targetAmount),
        currentAmount: 0,
        deadline: g.deadline ? new Date(g.deadline) : new Date(),
        icon: g.icon,
        color: g.color
      }));
      await GoalService.createManyGoals(userId, goalData, tx); // Using repo directly via createMany
    }

    // 4. Setup Reminders (Bills)
    if (payload.reminders && payload.reminders.length > 0) {
      const reminderData = payload.reminders.map((r: OnboardingReminder) => ({
        userId,
        name: r.name,
        amount: toCents(r.amount),
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), r.dueDay || 1),
        category: r.category || 'Outros',
        recurring: r.recurring || 'monthly'
      }));
      await ReminderService.createManyReminders(userId, reminderData, tx);
    }

    // 5. Setup Investments
    if (payload.investments && payload.investments.length > 0) {
      const investmentData = payload.investments.map((i: OnboardingInvestment) => ({
        userId,
        name: i.name || i.ticker || "Investimento",
        ticker: i.ticker || "N/A",
        type: i.type,
        amount: i.quantity || 0,
        averagePrice: toCents(i.price || 0),
        currentPrice: toCents(i.price || 0)
      }));
      await InvestmentService.createManyInvestments(userId, investmentData, tx);
    }

    // 6. Setup Debts
    if (payload.debts && payload.debts.length > 0) {
      const debtData = payload.debts.map((d: OnboardingDebt) => ({
        userId,
        name: d.name,
        balance: toCents(d.balance),
        interestRate: d.interestRate,
        minPayment: toCents(d.minPayment),
        category: d.category
      }));
      await DebtService.createManyDebts(userId, debtData, tx);
    }

    // 7. Process Historical Expenses (Transactions)
    if (payload.historicalExpenses && payload.historicalExpenses.length > 0) {
      const historicalData = payload.historicalExpenses.map((h: OnboardingHistoricalExpense) => ({
        userId,
        description: h.description || "Gasto Histórico",
        amount: toCents(h.amount || 0),
        type: "expense" as const,
        category: h.category || "Outros",
        date: h.date ? new Date(h.date) : (h.month ? new Date(h.month) : new Date()),
        paymentMethod: "Manual",
        scope: "personal" as const
      }));
      await TransactionRepository.createMany(historicalData, tx);
    }

    // 8. Update Preferences if available
    if (payload.preferences) {
      await tx.user.update({
        where: { id: userId },
        data: { preferences: JSON.stringify(payload.preferences) }
      });
    }

    return { success: true };
  });
}
