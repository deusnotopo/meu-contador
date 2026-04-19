import {
  STORAGE_KEYS,
  loadTransactions,
  pushToCloud,
  saveBudgets,
  saveGoals,
  saveInvestments,
  saveProfile,
  saveTransactions,
} from "@/lib/storage";
import type {
  Budget,
  Investment,
  OnboardingData,
  SavingsGoal,
  Transaction,
} from "@/types";
import { normalizeBudgetCategory } from "@/features/budgets/budget-utils";

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
      id: String(Date.now()),
      type: "income",
      description: "Saldo Inicial (Onboarding)",
      amount: data.profile.initialBalance,
      category: "Outros",
      date: new Date().toISOString().split("T")[0] || "",
      paymentMethod: "Outro",
      notes: "Saldo inicial configurado no setup",
      recurring: false,
      scope: "personal",
      currency: "BRL",
    };
    saveTransactions([initialTransaction]);
  }

  // Save budgets
  const budgets: Budget[] = data.budgets
    .filter((b) => b.enabled)
    .map((b, i) => ({
      id: String(Date.now() + i),
      category: normalizeBudgetCategory(b.category),
      limit: b.amount,
      spent: 0,
      month: new Date().toISOString().slice(0, 7),
      period: "monthly" as const,
      priority: "medium" as const,
    }));
  saveBudgets(budgets);

  // Save goals
  const goals: SavingsGoal[] = data.goals
    .filter((g) => g.enabled)
    .map((g, i) => ({
      id: String(Date.now() + i + 100),
      name: g.name ?? "Meta",
      targetAmount: g.targetAmount ?? 0,
      currentAmount: 0,
      deadline:
        g.deadline ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] ||
        "",
      icon: g.icon ?? "🎯",
      color: [
        "from-blue-500 to-blue-600",
        "from-purple-500 to-purple-600",
        "from-green-500 to-green-600",
      ][i % 3],
      category: "general",
      status: "active",
    }));
  saveGoals(goals);

  // Save historical expenses as transactions
  if (data.historicalExpenses && data.historicalExpenses.length > 0) {
    const historicalTransactions: Transaction[] = data.historicalExpenses.map(
      (exp, i) => ({
        id: String(Date.now() + i + 500),
        type: "expense",
        description: `Gasto Histórico: ${exp.category}`,
        amount: exp.amount,
        category: exp.category,
        date: `${exp.month}-15`, // Mid-month as representative
        paymentMethod: "Dinheiro",
        notes: "Importado durante onboarding",
        recurring: true,
        scope: "personal",
        currency: "BRL",
      }),
    );
    const existing = loadTransactions();
    saveTransactions([...existing, ...historicalTransactions]);
  }

  // Save investments
  if (data.investments && data.investments.length > 0) {
    const finalInvestments: Investment[] = data.investments.map((inv) => ({
      ...inv,
      id: String(inv.id),
      currency: "BRL",
      lastUpdated: new Date().toISOString(),
    }));
    saveInvestments(finalInvestments);
  }
};
