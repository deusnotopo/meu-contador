// ============= Emotional Finance Types =============

export type EmotionType = 
  | 'happy'      // 😊 Feliz
  | 'stressed'   // 😰 Estressado
  | 'excited'    // 🤩 Animado
  | 'sad'        // 😢 Triste
  | 'anxious'    // 😟 Ansioso
  | 'proud'      // 😎 Orgulhoso
  | 'guilty'     // 😔 Culpado
  | 'neutral'    // 😐 Neutro
  | 'impulsive'  // 🤪 Impulsivo
  | 'relieved';  // 😌 Aliviado

export type PurchaseMotivation =
  | 'necessity'    // Necessidade
  | 'pleasure'     // Prazer
  | 'stress'       // Estresse
  | 'social'       // Social
  | 'impulse'      // Impulso
  | 'reward'       // Recompensa
  | 'habit'        // Hábito
  | 'investment';  // Investimento

export interface EmotionalEntry {
  id: string;
  transactionId?: string;
  date: string;
  emotion: EmotionType;
  motivation: PurchaseMotivation;
  notes?: string;
  amount?: number;
  category?: string;
  triggers?: string[];  // O que causou a emoção
  regretLevel?: number; // 1-5: Nível de arrependimento
  satisfactionLevel?: number; // 1-5: Nível de satisfação
}

export interface EmotionalPattern {
  emotion: EmotionType;
  frequency: number;
  averageSpend: number;
  topCategories: string[];
  topTriggers: string[];
  regretRate: number; // 0-100
}

export interface EmotionalInsight {
  type: 'warning' | 'tip' | 'pattern' | 'achievement';
  title: string;
  description: string;
  emotion?: EmotionType;
  recommendation?: string;
  stats?: {
    totalEmotionalSpend: number;
    regrettedAmount: number;
    happySpendPercent: number;
    stressSpendPercent: number;
  };
}

export interface WeeklyEmotionalReport {
  weekStart: string;
  weekEnd: string;
  dominantEmotion: EmotionType;
  emotionalSpend: number;
  regrettedPurchases: number;
  happyPurchases: number;
  patterns: EmotionalPattern[];
  insights: EmotionalInsight[];
}

// Emotion metadata
export const EMOTION_CONFIG: Record<EmotionType, {
  emoji: string;
  label: string;
  color: string;
  bg: string;
  isPositive: boolean;
}> = {
  happy: { emoji: '😊', label: 'Feliz', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', isPositive: true },
  stressed: { emoji: '😰', label: 'Estressado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', isPositive: false },
  excited: { emoji: '🤩', label: 'Animado', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', isPositive: true },
  sad: { emoji: '😢', label: 'Triste', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', isPositive: false },
  anxious: { emoji: '😟', label: 'Ansioso', color: '#f97316', bg: 'rgba(249,115,22,0.1)', isPositive: false },
  proud: { emoji: '😎', label: 'Orgulhoso', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', isPositive: true },
  guilty: { emoji: '😔', label: 'Culpado', color: '#64748b', bg: 'rgba(100,116,139,0.1)', isPositive: false },
  neutral: { emoji: '😐', label: 'Neutro', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', isPositive: true },
  impulsive: { emoji: '🤪', label: 'Impulsivo', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', isPositive: false },
  relieved: { emoji: '😌', label: 'Aliviado', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', isPositive: true },
};

// Motivation metadata
export const MOTIVATION_CONFIG: Record<PurchaseMotivation, {
  emoji: string;
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}> = {
  necessity: { emoji: '🏠', label: 'Necessidade', description: 'Compra essencial', riskLevel: 'low' },
  pleasure: { emoji: '🎉', label: 'Prazer', description: 'Para me sentir bem', riskLevel: 'medium' },
  stress: { emoji: '😤', label: 'Estresse', description: 'Para aliviar pressão', riskLevel: 'high' },
  social: { emoji: '👥', label: 'Social', description: 'Pressão social', riskLevel: 'medium' },
  impulse: { emoji: '⚡', label: 'Impulso', description: 'Compra por impulso', riskLevel: 'high' },
  reward: { emoji: '🎁', label: 'Recompensa', description: 'Me mereço isso', riskLevel: 'medium' },
  habit: { emoji: '🔄', label: 'Hábito', description: 'Compra automática', riskLevel: 'medium' },
  investment: { emoji: '📈', label: 'Investimento', description: 'Para o futuro', riskLevel: 'low' },
};

// Common emotional triggers
export const EMOTIONAL_TRIGGERS = [
  'Dia de pagamento',
  'Briga/discussão',
  'Redes sociais',
  'Promoção/desconto',
  'Aniversário/celebração',
  'Problema no trabalho',
  'Solidão',
  'Tédio',
  'Comemoração',
  'FOMO (medo de perder)',
  'Influência de amigos',
  'Publicidade',
  'Estresse acumulado',
  'Conquista pessoal',
];