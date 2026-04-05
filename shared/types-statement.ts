import type { DataReliability } from './contracts';
import type { StatementProvenance } from './types-statement-provenance';

// ============= Statement Import Types =============

export type StatementFormat = 'ofx' | 'csv' | 'pdf' | 'image';

export type StatementSource = 
  | 'nubank' 
  | 'inter' 
  | 'itau' 
  | 'bradesco' 
  | 'santander' 
  | 'bb' 
  | 'caixa' 
  | 'c6bank' 
  | 'xp' 
  | 'rico' 
  | 'clear' 
  | 'modal' 
  | 'original' 
  | 'next' 
  | 'neon' 
  | 'picpay' 
  | 'mercado_pago' 
  | 'outros';

export type StatementAccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'unknown';

export interface StatementTransaction {
  id: string;
  importId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  categoryConfidence?: number; // 0-1
  paymentMethod?: string;
  balance?: number;
  documentNumber?: string;
  merchant?: string;
  originalDescription?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  dataReliability?: DataReliability;
  provenance?: StatementProvenance;
  status: 'pending' | 'confirmed' | 'ignored' | 'merged';
}

export interface StatementImport {
  id: string;
  userId: string;
  workspaceId?: string;
  source: StatementSource;
  format: StatementFormat;
  accountType: StatementAccountType;
  accountLastDigits?: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  periodStart?: string; // YYYY-MM-DD
  periodEnd?: string; // YYYY-MM-DD
  transactionsCount: number;
  transactionsConfirmed: number;
  transactionsIgnored: number;
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  status: 'processing' | 'ready' | 'confirmed' | 'partial' | 'error';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

export interface StatementImportJob {
  id: string;
  importId: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

// ============= Bank Adapter Types =============

export interface BankAdapterConfig {
  source: StatementSource;
  name: string;
  csvDelimiter?: string;
  csvHeaderRows?: number;
  csvColumns?: {
    date: number | string;
    description: number | string;
    amount: number | string;
    type?: number | string;
    balance?: number | string;
  };
  ofxAccountId?: string;
  pdfParser?: 'text' | 'ocr' | 'custom';
  categoryMapping?: Record<string, string>;
}

// ============= Categorization Types =============

export interface CategoryRule {
  pattern: RegExp | string;
  category: string;
  subcategory?: string;
  priority: number; // Higher = checked first
}

export interface CategorizationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  rule?: CategoryRule;
}

// ============= Import Preview Types =============

export interface ImportPreview {
  import: StatementImport;
  transactions: StatementTransaction[];
  duplicates: StatementTransaction[];
  uncategorized: StatementTransaction[];
  summary: {
    total: number;
    confirmed: number;
    pending: number;
    ignored: number;
    duplicates: number;
  };
}