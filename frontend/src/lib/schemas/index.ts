import { z } from "zod";

/**
 * Contrato para Transações Financeiras
 */
export const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  type: z.enum(["income", "expense"]),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  category: z.string().min(1),
  date: z.string(), // ISO string
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean().default(false),
  recurrenceInterval: z
    .enum(["monthly", "weekly", "bi-weekly", "yearly"])
    .nullable()
    .optional(),
  scope: z.enum(["personal", "business"]).default("personal"),
  classification: z
    .enum(["necessity", "want", "investment", "debt"])
    .nullable()
    .optional(),
  currency: z.string().default("BRL"),
  receiptUrl: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Contrato para Investimentos
 */
export const InvestmentSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1),
  ticker: z.string().min(1),
  type: z.enum(["stock", "fii", "crypto", "fixed_income", "etf"]),
  amount: z.number(), // Quantity
  averagePrice: z.number().nonnegative(),
  currentPrice: z.number().nonnegative(),
  currency: z.string().default("BRL"),
  sector: z.string().nullable().optional(),
  lastUpdated: z.string().optional(),
  targetAllocation: z.number().nullable().optional(),
});

export type Investment = z.infer<typeof InvestmentSchema>;

/**
 * Contrato para Dívidas
 */
export const DebtSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1),
  balance: z.number().nonnegative(),
  interestRate: z.number().nonnegative(),
  minPayment: z.number().nonnegative().optional(),
  dueDate: z.string().nullable().optional(),
  category: z
    .enum(["credit_card", "loan", "overdraft", "other"])
    .default("other"),
});

export type Debt = z.infer<typeof DebtSchema>;

/**
 * Contrato para Metas
 */
export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1),
  targetAmount: z.number().min(0),
  currentAmount: z.number().min(0),
  deadline: z.string().optional(),
  category: z.string().default("general"),
  status: z.enum(["active", "completed", "paused"]).default("active"),
  icon: z.string().optional(),
  color: z.string().nullable().optional(),
});

export const BudgetSchema = z.object({
  id: z.string(),
  category: z.string().min(1, "Categoria é obrigatória"),
  limit: z.number().nonnegative("Limite não pode ser negativo"),
  spent: z.number().nonnegative().default(0),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato deve ser YYYY-MM"),
  period: z.enum(["monthly", "weekly", "yearly"]).default("monthly"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  classification: z.enum(["necessity", "want", "investment", "debt", "emergency"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

/**
 * Contrato para Perfil de Usuário
 */
export const UserProfileSchema = z.object({
  id: z.string(),
  uid: z.string().optional(), // Alias para compatibilidade
  email: z.string().email(),
  name: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  photoURL: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().default(false),
  isPro: z.boolean().default(false),
  monthlyIncome: z.number().nonnegative().default(0),
  financialGoal: z
    .enum([
      "save",
      "invest",
      "debt-free",
      "emergency",
      "travel",
      "house",
      "retire",
    ])
    .default("save"),
  riskProfile: z
    .enum(["conservative", "moderate", "aggressive"])
    .default("moderate"),
  hasEmergencyFund: z.boolean().default(false),
  hasDebts: z.boolean().default(false),
  initialBalance: z.number().default(0),
  age: z.number().optional(),
  retirementAge: z.number().optional(),
  dependents: z.number().default(0),
  employmentType: z.enum(["clt", "pj"]).default("clt"),
  investmentHorizon: z.string().optional(),
  businessName: z.string().nullable().optional(),
  businessCnpj: z.string().nullable().optional(),
  businessSector: z.string().optional(),
  currentWorkspaceId: z.string().optional(),
  preferences: z
    .union([
      z.object({
        currency: z.string().default("BRL"),
        theme: z.enum(["light", "dark"]).default("dark"),
      }),
      z.string(),
    ])
    .optional(),
  workspaceRoles: z.record(z.unknown()).optional(),
  createdAt: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Contrato para Notas Fiscais (Invoices)
 */
export const InvoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  issueDate: z.string(),
  amount: z.number().nonnegative(),
  status: z.enum(["pending", "paid", "canceled", "overdue"]),
  customerName: z.string(),
  customerTaxId: z.string(),
  client: z.string().optional(),
  dueDate: z.string().optional(),
  xmlUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      }),
    )
    .optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * Contrato para Provisões
 */
export const ProvisionSchema = z.object({
  id: z.string(),
  name: z.string(),
  month: z.union([z.number(), z.string()]),
  yearlyAmount: z.number().nonnegative(),
  accumulated: z.number().nonnegative(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  description: z.string().optional(), // Mantendo para compatibilidade futura
  status: z.enum(["active", "completed", "canceled"]).default("active"),
});

export type Provision = z.infer<typeof ProvisionSchema>;

/**
 * Contrato para Lembretes
 */
export const ReminderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  amount: z.number().default(0),
  dueDate: z.string(),
  category: z.string().default("Geral"),
  isPaid: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  type: z.enum(["payment", "meeting", "general"]).default("general"),
  completed: z.boolean().default(false),
  recurring: z.string().optional(),
});

export type Reminder = z.infer<typeof ReminderSchema>;

/**
 * Contrato para Educação / Academy
 */
export const EducationContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["article", "video", "course"]),
  category: z.string(),
  durationMinutes: z.number().optional(),
  thumbnail: z.string().optional(),
  url: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  completed: z.boolean().default(false),
});

export type EducationContent = z.infer<typeof EducationContentSchema>;

/**
 * Fluxo de Caixa (Projeção)
 */
export const CashFlowItemSchema = z.object({
  date: z.string(),
  dateFormatted: z.string().optional(),
  weekday: z.string().optional(),
  inflows: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number(),
        category: z.string(),
      }),
    )
    .default([]),
  outflows: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number(),
        category: z.string(),
      }),
    )
    .default([]),
  netFlow: z.number(),
  projectedBalance: z.number(),
  isCritical: z.boolean().default(false),
  isToday: z.boolean().optional(),
  isWeekend: z.boolean().optional(),
});

export const CashFlowSummarySchema = z.object({
  currentBalance: z.number(),
  projectedBalance30Days: z.number().default(0),
  projectedBalanceEnd: z.number().optional(), // Alias vindo do backend
  totalInflows30Days: z.number().optional(),
  totalInflows: z.number().optional(), // Alias vindo do backend
  totalOutflows30Days: z.number().optional(),
  totalOutflows: z.number().optional(), // Alias vindo do backend
  safeToSpend: z.number().default(0),
  committedNext7Days: z.number().default(0),
  nextIncomeDate: z.string().nullable().optional(),
  criticalDays: z.number().default(0),
  positiveDays: z.number().optional(),
  negativeDays: z.number().optional(),
  averageDailyFlow: z.number().default(0),
  burnRate: z.number().nullable().optional(),
});

export const RecurringItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  dueDay: z.number(),
  frequency: z.enum(["monthly", "weekly", "yearly"]).default("monthly"),
});

export const CashFlowProjectionSchema = z.object({
  projection: z.array(CashFlowItemSchema),
  summary: CashFlowSummarySchema,
  recurring: z.array(RecurringItemSchema).default([]),
});

export const CashFlowSchema = z.array(CashFlowItemSchema);

export type CashFlowItem = z.infer<typeof CashFlowItemSchema>;
export type CashFlow = z.infer<typeof CashFlowSchema>;
