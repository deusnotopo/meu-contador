// 🔗 Tipos Compartilhados - Antigravity
// Este arquivo deve ser importado por frontend e backend

// ============================================
// USUÁRIO
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  currency: 'BRL' | 'USD' | 'EUR';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============================================
// TRANSAÇÕES
// ============================================

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'vestuario'
  | 'servicos'
  | 'investimentos'
  | 'outros';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  attachments?: Attachment[];
  recurring?: RecurringConfig;
}

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: Date;
  occurrences?: number;
}

// ============================================
// ORÇAMENTOS (ENVELOPES)
// ============================================

export interface Envelope {
  id: string;
  userId: string;
  name: string;
  category: TransactionCategory;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  color: string;
  icon?: string;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// METAS
// ============================================

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  deadline: Date;
  status: GoalStatus;
  category?: TransactionCategory;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INVESTIMENTOS
// ============================================

export type InvestmentType =
  | 'renda_fixa'
  | 'renda_variavel'
  | 'fundos'
  | 'criptomoedas'
  | 'imoveis'
  | 'outros';

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: InvestmentType;
  amount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  purchaseDate: Date;
  maturityDate?: Date;
  institution: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DÍVIDAS
// ============================================

export type DebtStatus = 'pending' | 'paid' | 'overdue' | 'negotiating';

export interface Debt {
  id: string;
  userId: string;
  creditor: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  interestRate: number;
  dueDate: Date;
  status: DebtStatus;
  installments?: Installment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Installment {
  number: number;
  amount: number;
  dueDate: Date;
  paid: boolean;
  paidDate?: Date;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  investmentsTotal: number;
  debtsTotal: number;
  goalsProgress: number;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// FILTROS E ORDENAÇÃO
// ============================================

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// ============================================
// FORMULÁRIOS
// ============================================

export interface TransactionFormData {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  tags?: string[];
  recurring?: RecurringConfig;
}

export interface GoalFormData {
  title: string;
  description?: string;
  targetAmount: number;
  deadline: string;
  category?: TransactionCategory;
}

export interface InvestmentFormData {
  name: string;
  type: InvestmentType;
  amount: number;
  purchaseDate: string;
  maturityDate?: string;
  institution: string;
}

// ============================================
// CONSTANTES
// ============================================

export const TRANSACTION_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'vestuario', label: 'Vestuário' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'investimentos', label: 'Investimentos' },
  { value: 'outros', label: 'Outros' },
];

export const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'renda_fixa', label: 'Renda Fixa' },
  { value: 'renda_variavel', label: 'Renda Variável' },
  { value: 'fundos', label: 'Fundos' },
  { value: 'criptomoedas', label: 'Criptomoedas' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'outros', label: 'Outros' },
];

export const CURRENCIES = {
  BRL: { symbol: 'R$', name: 'Real' },
  USD: { symbol: '$', name: 'Dólar' },
  EUR: { symbol: '€', name: 'Euro' },
} as const;