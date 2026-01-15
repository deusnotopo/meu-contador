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
  recurrenceInterval?: "monthly" | "weekly" | "bi-weekly" | "yearly";
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
  recurrenceInterval?: "monthly" | "weekly" | "bi-weekly" | "yearly";
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

export interface OnboardingExpense {
  category: string;
  amount: number;
  month: string; // YYYY-MM
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
  targetAllocation?: number; // Target percentage (0-100)
  lastUpdate: string;
}

export interface InvestmentPortfolio {
  totalValue: number;
  totalInvested: number;
  profit: number;
  profitPercentage: number;
  assets: Investment[];
}

export interface Dividend {
  id: string;
  assetId: number;
  assetTicker: string;
  amount: number;
  date: string;
  type: "dividend" | "jcp";
}

export interface InvestmentSale {
  id: string;
  assetId: number;
  assetTicker: string;
  type: "stock" | "fii" | "crypto" | "etf";
  amount: number; // Quantity sold
  price: number; // Sale price
  date: string;
  totalValue: number; // amount * price
}

export interface TaxIndicator {
  month: string; // YYYY-MM
  totalStockSales: number;
  isOverLimit: boolean;
  estimatedTax: number;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // Monthly %
  minPayment: number;
  dueDate?: string;
  category: "credit_card" | "loan" | "overdraft" | "other";
}

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
  iconName: "Target" | "BarChart3" | "TrendingUp" | "DollarSign" | "Star"; // Changed from LucideIcon to string for serializability
  quiz?: QuizQuestion;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: "CheckCircle" | "Target" | "PiggyBank" | "CreditCard" | "Star";
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
