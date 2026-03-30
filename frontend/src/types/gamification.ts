// ============= Gamification Types =============

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: 'savings' | 'budget' | 'investment' | 'education' | 'streak' | 'milestone';
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Streak {
  type: 'login' | 'budget' | 'savings';
  current: number;
  best: number;
  lastUpdate: string;
}

export interface UserLevel {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXp: number;
  title: string;
  perks: string[];
}

export interface GamificationState {
  level: UserLevel;
  achievements: Achievement[];
  streaks: Record<string, Streak>;
  weeklyChallenge: WeeklyChallenge | null;
  leaderboard: LeaderboardEntry[];
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  current: number;
  xpReward: number;
  endsAt: string;
  isCompleted: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  emoji: string;
}

// Level titles and perks
export const LEVEL_CONFIG: Record<number, { title: string; perks: string[] }> = {
  1: { title: 'Iniciante', perks: ['Acesso ao Dashboard'] },
  5: { title: 'Aprendiz', perks: ['Metas Personalizadas'] },
  10: { title: 'Organizador', perks: ['Relatórios Semanais'] },
  15: { title: 'Estrategista', perks: ['Insights da IA'] },
  20: { title: 'Expert', perks: ['Simulador Avançado'] },
  25: { title: 'Mestre', perks: ['Badge Exclusivo'] },
  30: { title: 'Lenda', perks: ['Modo Pro Grátis'] },
  50: { title: 'Guru Financeiro', perks: ['Todos os Recursos'] },
};

// XP rewards
export const XP_REWARDS = {
  DAILY_LOGIN: 10,
  ADD_TRANSACTION: 5,
  COMPLETE_BUDGET: 25,
  ACHIEVEMENT_UNLOCK: 50,
  STREAK_BONUS: 100,
  WEEKLY_CHALLENGE: 200,
  LESSON_COMPLETE: 75,
  GOAL_CREATED: 30,
  FIRST_TRANSACTION: 20,
  FIRST_BUDGET: 50,
  FIRST_INVESTMENT: 100,
};

// Predefined achievements
export const PREDEFINED_ACHIEVEMENTS: Omit<Achievement, 'isUnlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_login',
    emoji: '👋',
    name: 'Bem-vindo!',
    description: 'Fez seu primeiro login no app',
    category: 'milestone',
    xpReward: 20,
    maxProgress: 1,
    rarity: 'common',
  },
  {
    id: 'first_transaction',
    emoji: '💰',
    name: 'Primeiro Passo',
    description: 'Adicionou sua primeira transação',
    category: 'budget',
    xpReward: 30,
    maxProgress: 1,
    rarity: 'common',
  },
  {
    id: 'first_budget',
    emoji: '📊',
    name: 'Orçamento Mestre',
    description: 'Criou seu primeiro orçamento mensal',
    category: 'budget',
    xpReward: 50,
    maxProgress: 1,
    rarity: 'common',
  },
  {
    id: 'savings_goal',
    emoji: '🎯',
    name: 'Poupança Ativa',
    description: 'Definiu uma meta de economia',
    category: 'savings',
    xpReward: 40,
    maxProgress: 1,
    rarity: 'common',
  },
  {
    id: 'first_investment',
    emoji: '📈',
    name: 'Investidor Iniciante',
    description: 'Registrou seu primeiro investimento',
    category: 'investment',
    xpReward: 100,
    maxProgress: 1,
    rarity: 'rare',
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    name: 'Dedicado',
    description: 'Manteve um streak de 7 dias',
    category: 'streak',
    xpReward: 75,
    maxProgress: 7,
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    emoji: '💎',
    name: 'Consistente',
    description: 'Manteve um streak de 30 dias',
    category: 'streak',
    xpReward: 300,
    maxProgress: 30,
    rarity: 'epic',
  },
  {
    id: 'budget_master',
    emoji: '👑',
    name: 'Mestre do Orçamento',
    description: 'Manteve o orçamento por 3 meses consecutivos',
    category: 'budget',
    xpReward: 200,
    maxProgress: 3,
    rarity: 'epic',
  },
  {
    id: 'savings_1k',
    emoji: '🏦',
    name: 'Primeiro Mil',
    description: 'Acumulou R$ 1.000 em economias',
    category: 'savings',
    xpReward: 150,
    maxProgress: 1000,
    rarity: 'rare',
  },
  {
    id: 'savings_10k',
    emoji: '💰',
    name: 'Dez Mil',
    description: 'Acumulou R$ 10.000 em economias',
    category: 'savings',
    xpReward: 500,
    maxProgress: 10000,
    rarity: 'epic',
  },
  {
    id: 'education_master',
    emoji: '📚',
    name: 'Estudante Dedicado',
    description: 'Completou 10 lições na Academia',
    category: 'education',
    xpReward: 200,
    maxProgress: 10,
    rarity: 'epic',
  },
  {
    id: 'diversified_portfolio',
    emoji: '🌐',
    name: 'Diversificado',
    description: 'Possui investimentos em 4+ categorias',
    category: 'investment',
    xpReward: 250,
    maxProgress: 4,
    rarity: 'epic',
  },
  {
    id: 'millionaire',
    emoji: '🤑',
    name: 'Milionário',
    description: 'Patrimônio total ultrapassou R$ 1.000.000',
    category: 'milestone',
    xpReward: 1000,
    maxProgress: 1000000,
    rarity: 'legendary',
  },
  {
    id: 'financial_freedom',
    emoji: '🏖️',
    name: 'Liberdade Financeira',
    description: 'Atingiu independência financeira',
    category: 'milestone',
    xpReward: 2000,
    maxProgress: 1,
    rarity: 'legendary',
  },
];