// ============= Transaction Types =============
export interface Transaction {
  id: number;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
  recurring: boolean;
  scope: "personal" | "business";
  classification?: "necessity" | "want" | "investment" | "debt";
}

export interface TransactionFormData {
  type: "income" | "expense";
  description: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
  recurring: boolean;
  scope: "personal" | "business";
  classification?: "necessity" | "want" | "investment" | "debt";
}

// ============= Budget Types =============
export interface Budget {
  id: number;
  category: string;
  limit: number;
  spent: number;
  month: string; // YYYY-MM
}

// ============= Goals Types =============
export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
}

// ============= Bill Reminder Types =============
export interface BillReminder {
  id: number;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  recurring: "monthly" | "yearly" | "once";
}

// ============= Business Types =============
export interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CashFlowProjection {
  id: number;
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
  businessProfile?: {
    name: string;
    sector: string;
    cnpj?: string;
  };
  isPro?: boolean;
  subscriptionPlan?: "free" | "pro";
}

export interface OnboardingBudget {
  category: string;
  percentage: number;
  amount: number;
  priority: "essential" | "important" | "optional";
  enabled: boolean;
}

export interface OnboardingGoal {
  name: string;
  icon: string;
  targetAmount: number;
  deadline: string;
  priority: number;
  enabled: boolean;
}

export interface OnboardingReminder {
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  enabled: boolean;
}

export interface OnboardingData {
  profile: UserProfile;
  budgets: OnboardingBudget[];
  goals: OnboardingGoal[];
  reminders: OnboardingReminder[];
  preferences: {
    showScore: boolean;
    showPredictions: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  };
  completed: boolean;
  completedAt?: string;
}

// ============= Investment Types =============
export interface Investment {
  id: number;
  name: string;
  ticker: string;
  type: "stock" | "fii" | "crypto" | "fixed_income" | "etf";
  amount: number; // Quantity
  averagePrice: number;
  currentPrice: number;
  sector: string;
  lastUpdate: string;
}

export interface InvestmentPortfolio {
  totalValue: number;
  totalInvested: number;
  profit: number;
  profitPercentage: number;
  assets: Investment[];
}
