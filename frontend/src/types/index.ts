import type { EmotionType, PurchaseMotivation } from "./emotional";

export type Currency = "BRL" | "USD" | "EUR" | "GBP";

import {
  TransactionSchema,
  InvestmentSchema,
  DebtSchema,
  GoalSchema,
  BudgetSchema,
  InvoiceSchema,
  ReminderSchema,
  ProvisionSchema,
} from "@/lib/schemas";
import { z } from "zod";

export type Transaction = z.infer<typeof TransactionSchema>;
export type Provision = z.infer<typeof ProvisionSchema>;

export interface TransactionFormData {
  type: "income" | "expense";
  description: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
  recurring: boolean;
  recurrenceInterval?: "monthly" | "weekly" | "bi-weekly" | "yearly";
  scope: "personal" | "business";
  classification?: "necessity" | "want" | "investment" | "debt";
  mood?: EmotionType;
  motivation?: PurchaseMotivation;
  currency?: "BRL" | "USD" | "EUR" | "GBP";
  exchangeRate?: string;
  receiptUrl?: string;
}

// ============= Budget Types =============
export type Budget = z.infer<typeof BudgetSchema>;

// ============= Goals Types =============
export type SavingsGoal = z.infer<typeof GoalSchema>;

// ============= Bill Reminder Types =============
export type BillReminder = z.infer<typeof ReminderSchema>;

// ============= Business Types =============
export type Invoice = z.infer<typeof InvoiceSchema>;

export interface CashFlowProjection {
  id: string;
  description: string;
  amount: number;
  type: "inflow" | "outflow";
  expectedDate: string;
  probability: number; // 0-100
  category: string;
}

// ============= Chart Types =============
export interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface CategoryChartData {
  name: string;
  receitas: number;
  despesas: number;
}

// ============= Financial Health Types =============
export interface FinancialHealth {
  score: number; // 0-100
  savingsRate: number;
  debtRatio: number;
  emergencyFundMonths: number;
  budgetAdherence: number;
  tips: string[];
}

export interface SpendingPrediction {
  category: string;
  predictedAmount: number;
  lastMonthAmount: number;
  trend: "up" | "down" | "stable";
  percentChange: number;
}

export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface WorkspaceMetadata {
  id: string;
  name: string;
  ownerId: string;
  members: Record<string, WorkspaceRole>;
  createdAt: string;
}

export interface Reconciliation {
  id: string;
  workspaceId: string;
  bankAccountId: string;
  calculatedBalance: number;
  actualBalance: number;
  discrepancy: number;
  status: "matched" | "discrepancy" | "pending";
  reconciledAt: string | null;
  lastSyncAt: string;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  workspaceId: string;
  expiresAt: string;
  createdAt: string;
}

// ============= Onboarding Types =============
export interface UserProfile {
  name: string;
  monthlyIncome: number;
  financialGoal:
    | "save"
    | "invest"
    | "debt-free"
    | "emergency"
    | "travel"
    | "house"
    | "retire";
  riskProfile: "conservative" | "moderate" | "aggressive";
  hasEmergencyFund: boolean;
  hasDebts: boolean;
  initialBalance: number;
  businessName?: string;
  businessSector?: string;
  businessCnpj?: string;
  currentWorkspaceId?: string;
  workspaces?: string[]; // List of workspace IDs user has access to
  workspaceRoles?: Record<string, WorkspaceRole>; // Map of workspaceId -> role
  isPro?: boolean;
  employmentType?: "clt" | "pj";
  subscriptionPlan?: "free" | "pro";
  age?: number;
  retirementAge?: number;
  fireTargetIncome?: number;
  investorProfile?: string;
  investmentHorizon?: string;
  dependents?: number;
  lgpdConsent?: boolean;
  openFinanceBank?: string;
  insuranceTypes?: string[];
  educationTrack?: string;
}

export interface OnboardingBudget {
  category: string;
  percentage: number;
  amount: number;
  priority: "essential" | "important" | "optional";
  enabled: boolean;
}

export interface OnboardingGoal {
  name?: string;
  icon?: string;
  targetAmount?: number;
  deadline?: string;
  priority?: number;
  enabled: boolean;
}

export interface OnboardingReminder {
  name?: string;
  amount?: number;
  dueDay?: number;
  category?: string;
  enabled: boolean;
}

export interface OnboardingExpense {
  category: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface OnboardingDebt {
  id?: string;
  name: string;
  balance: number;
  interestRate: number; // %/mês
  minPayment: number;
  category: "credit_card" | "loan" | "overdraft" | "other";
}

export interface OnboardingData {
  profile: UserProfile;
  budgets: OnboardingBudget[];
  goals: OnboardingGoal[];
  reminders: OnboardingReminder[];
  historicalExpenses?: OnboardingExpense[];
  preferences: {
    showScore: boolean;
    showPredictions: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  };
  investments?: OnboardingInvestment[];
  completed: boolean;
  completedAt?: string;
}

// ============= Investment Types =============

/** Ativo de investimento usado no wizard de onboarding (id temporário numérico) */
export interface OnboardingInvestment {
  id: number;
  name: string;
  ticker: string;
  type: "stock" | "fii" | "crypto" | "fixed_income" | "etf";
  amount: number;
  averagePrice: number;
  currentPrice: number;
  sector: string;
  lastUpdate: string;
}

/** Investment com relações carregadas (sales e dividends) retornadas pelo backend */
export interface InvestmentWithRelations extends Investment {
  sales?: InvestmentSale[];
  dividends?: Dividend[];
}

export type Investment = z.infer<typeof InvestmentSchema>;

export interface InvestmentPortfolio {
  totalValue: number;
  totalInvested: number;
  profit: number;
  profitPercentage: number;
  assets: Investment[];
}

export interface Dividend {
  id: string;
  assetId: string;
  assetTicker: string;
  amount: number;
  date: string;
  type: "dividend" | "jcp";
}

export interface InvestmentSale {
  id: string;
  assetId: string;
  assetTicker: string;
  type: "stock" | "fii" | "crypto" | "fixed_income" | "etf";
  amount: number; // Quantity sold
  price: number; // Sale price
  date: string;
  totalValue: number; // amount * price
  currency?: "BRL" | "USD" | "EUR" | "GBP";
}

export interface TaxIndicator {
  month: string; // YYYY-MM
  totalStockSales: number;
  isOverLimit: boolean;
  estimatedTax: number;
}

export type Debt = z.infer<typeof DebtSchema>;

// ============= Education Types =============
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number; // Index 0-3
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown supported
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  completed: boolean;
  category: string;
  iconName:
    | "Target"
    | "BarChart3"
    | "TrendingUp"
    | "DollarSign"
    | "Star"
    | "PiggyBank"
    | "CheckCircle"
    | "CreditCard"
    | "Trophy"; // Added missing icons
  quiz?: QuizQuestion;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName:
    | "CheckCircle"
    | "Target"
    | "PiggyBank"
    | "CreditCard"
    | "Star"
    | "Trophy";
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface EducationProgress {
  completedLessons: string[];
  unlockedAchievements: string[];
  points: number;
  streak: number;
}
