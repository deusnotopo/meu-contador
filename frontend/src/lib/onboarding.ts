import {
  STORAGE_KEYS,
  loadTransactions,
  pushToCloud,
  saveBudgets,
  saveGoals,
  saveInvestments,
  saveProfile,
  saveReminders,
  saveTransactions,
} from "@/lib/storage";
import type {
  BillReminder,
  Budget,
  OnboardingData,
  SavingsGoal,
  Transaction,
} from "@/types";

const ONBOARDING_KEY = STORAGE_KEYS.ONBOARDING;

export const loadOnboarding = (): OnboardingData | null => {
  try {
    const data = localStorage.getItem(ONBOARDING_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveOnboarding = (data: OnboardingData): void => {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
  pushToCloud(ONBOARDING_KEY, data);
};

export const isOnboardingComplete = (): boolean => {
  const data = loadOnboarding();
  return data?.completed === true;
};

export const resetOnboarding = (): void => {
  localStorage.removeItem(ONBOARDING_KEY);
};

export const applyOnboardingConfig = (data: OnboardingData): void => {
  // Save profile
  saveProfile(data.profile);

  // Initial balance as a transaction if > 0
  if (data.profile.initialBalance > 0) {
    const initialTransaction: Transaction = {
      id: Date.now(),
      type: "income",
      description: "Saldo Inicial (Onboarding)",
      amount: data.profile.initialBalance,
      category: "Outros",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Outro",
      notes: "Saldo inicial configurado no setup",
      recurring: false,
      scope: "personal",
    };
    saveTransactions([initialTransaction]);
  }

  // Save budgets
  const budgets: Budget[] = data.budgets
    .filter((b) => b.enabled)
    .map((b, i) => ({
      id: Date.now() + i,
      category: b.category,
      limit: b.amount,
      spent: 0,
      month: new Date().toISOString().slice(0, 7),
    }));
  saveBudgets(budgets);

  // Save goals
  const goals: SavingsGoal[] = data.goals
    .filter((g) => g.enabled)
    .map((g, i) => ({
      id: Date.now() + i + 100,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: 0,
      deadline:
        g.deadline ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      icon: g.icon,
      color: [
        "from-blue-500 to-blue-600",
        "from-purple-500 to-purple-600",
        "from-green-500 to-green-600",
      ][i % 3],
    }));
  saveGoals(goals);

  // Save reminders
  const now = new Date();
  const reminders: BillReminder[] = data.reminders
    .filter((r) => r.enabled && r.amount > 0)
    .map((r, i) => {
      const dueDate = new Date(now.getFullYear(), now.getMonth(), r.dueDay);
      if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
      return {
        id: Date.now() + i + 200,
        name: r.name,
        amount: r.amount,
        dueDate: dueDate.toISOString().split("T")[0],
        category: r.category,
        isPaid: false,
        recurring: "monthly" as const,
      };
    });
  saveReminders(reminders);

  // Save historical expenses as transactions
  if (data.historicalExpenses && data.historicalExpenses.length > 0) {
    const historicalTransactions: Transaction[] = data.historicalExpenses.map(
      (exp, i) => ({
        id: Date.now() + i + 500,
        type: "expense",
        description: `Gasto Histórico: ${exp.category}`,
        amount: exp.amount,
        category: exp.category,
        date: `${exp.month}-15`, // Mid-month as representative
        paymentMethod: "Dinheiro",
        notes: "Importado durante onboarding",
        recurring: true,
        scope: "personal",
      })
    );
    const existing = loadTransactions();
    saveTransactions([...existing, ...historicalTransactions]);
  }

  // Save investments
  if (data.investments && data.investments.length > 0) {
    saveInvestments(data.investments);
  }
};
