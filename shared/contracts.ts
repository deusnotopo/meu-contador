export const dataReliabilityValues = [
  'REAL',
  'ESTIMATED',
  'HEURISTIC',
  'BENCHMARK',
  'EXTERNAL_SOURCE',
] as const;

export type DataReliability = (typeof dataReliabilityValues)[number];

export interface UserPreferencesDto {
  theme: string;
  language: string;
  privacyMode: boolean;
  completedTours?: string[];
}

export interface UpdateUserProfileDto {
  name?: string;
  monthlyIncome?: number;
  financialGoal?: string;
  riskProfile?: string;
  businessName?: string;
  businessCnpj?: string;
  businessSector?: string;
  employmentType?: string;
  hasEmergencyFund?: boolean;
  hasDebts?: boolean;
  initialBalance?: number;
  age?: number;
  dependents?: number;
  investmentHorizon?: string;
  onboardingCompleted?: boolean;
}

export interface UserProfileDto extends UpdateUserProfileDto {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isPro?: boolean;
  preferences?: UserPreferencesDto;
}

export interface AiConversationMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiFinancialSnapshotDto {
  balance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savingsRate?: number;
  score?: number;
  topCategories?: Array<{
    category: string;
    amount: number;
    share?: number;
  }>;
  alerts?: string[];
  recommendations?: string[];
  predictions?: string[];
}

export interface AiProxyRequestDto {
  conversation: AiConversationMessageDto[];
  userMessage?: string;
  systemContext?: string;
  financialSnapshot?: AiFinancialSnapshotDto;
  data?: unknown;
  financialData?: unknown;
}

export interface AiProxyResponseDto {
  response: string;
  explanation?: {
    consideredSources: string[];
    omittedDetails: string[];
  };
}