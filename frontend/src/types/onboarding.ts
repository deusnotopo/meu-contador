import type {
  OnboardingBudget,
  OnboardingGoal,
  OnboardingReminder,
} from "./index";

// ============= Preset Templates =============
export const financialGoalTemplates = {
  save: {
    name: "Economizar",
    icon: "💰",
    description: "Construir reserva e economizar dinheiro",
    longDescription: "Ideal para quem está começando e precisa de segurança.",
  },
  invest: {
    name: "Investir",
    icon: "📈",
    description: "Fazer seu dinheiro trabalhar para você",
    longDescription: "Para quem já tem reserva e busca multiplicar patrimônio.",
  },
  "debt-free": {
    name: "Quitar Dívidas",
    icon: "🎯",
    description: "Eliminar dívidas e ficar no positivo",
    longDescription: "Foco total em estancar os juros altos (Método Avalanche).",
  },
  emergency: {
    name: "Reserva de Emergência",
    icon: "🛡️",
    description: "6 meses de despesas guardados",
    longDescription: "Sua blindagem contra imprevistos.",
  },
  travel: {
    name: "Viajar",
    icon: "✈️",
    description: "Realizar a viagem dos sonhos",
    longDescription: "Planejamento para lazer sem culpa.",
  },
  house: {
    name: "Casa Própria",
    icon: "🏠",
    description: "Entrada ou compra de imóvel",
    longDescription: "Construção de patrimônio imobiliário.",
  },
  retire: {
    name: "Aposentadoria",
    icon: "🏖️",
    description: "Independência financeira",
    longDescription: "Foco no longo prazo e juros compostos.",
  },
};

// ============= Rule 50/30/20 (Scientific Standard) =============
export const scientificBudgetTemplate: OnboardingBudget[] = [
  {
    category: "Necessidades (Fixos)",
    percentage: 50,
    amount: 0,
    priority: "essential",
    enabled: true,
  },
  {
    category: "Lifestyle (Variáveis)",
    percentage: 30,
    amount: 0,
    priority: "important",
    enabled: true,
  },
  {
    category: "Futuro (Investimentos)",
    percentage: 20,
    amount: 0,
    priority: "essential",
    enabled: true,
  },
];

export const budgetTemplates: Record<string, OnboardingBudget[]> = {
  conservative: [
    { category: "Moradia", percentage: 30, amount: 0, priority: "essential", enabled: true },
    { category: "Alimentação", percentage: 15, amount: 0, priority: "essential", enabled: true },
    { category: "Transporte", percentage: 10, amount: 0, priority: "essential", enabled: true },
    { category: "Contas", percentage: 10, amount: 0, priority: "essential", enabled: true },
    { category: "Saúde", percentage: 5, amount: 0, priority: "essential", enabled: true },
    { category: "Lazer", percentage: 5, amount: 0, priority: "optional", enabled: true },
    { category: "Educação", percentage: 5, amount: 0, priority: "important", enabled: true },
    { category: "Reserva", percentage: 20, amount: 0, priority: "essential", enabled: true },
  ],
  moderate: scientificBudgetTemplate, // Recommended Default
  aggressive: [
    { category: "Necessidades", percentage: 40, amount: 0, priority: "essential", enabled: true },
    { category: "Lifestyle", percentage: 20, amount: 0, priority: "important", enabled: true },
    { category: "Investimento Pesado", percentage: 40, amount: 0, priority: "essential", enabled: true },
  ],
};

export const commonBillReminders: OnboardingReminder[] = [
  { name: "Aluguel / Condomínio", amount: 0, dueDay: 5, category: "Moradia", enabled: false },
  { name: "Energia / Água", amount: 0, dueDay: 15, category: "Contas", enabled: false },
  { name: "Internet / Celular", amount: 0, dueDay: 10, category: "Contas", enabled: false },
  { name: "Streaming (Netflix/Spotify)", amount: 0, dueDay: 1, category: "Lazer", enabled: false },
  { name: "Academia", amount: 0, dueDay: 5, category: "Saúde", enabled: false },
  { name: "Cartão de Crédito", amount: 0, dueDay: 10, category: "Outros", enabled: false },
  { name: "Seguro / Parcela Carro", amount: 0, dueDay: 15, category: "Transporte", enabled: false },
];

export const goalPresets: OnboardingGoal[] = [
  {
    name: "Reserva de Emergência",
    icon: "🛡️",
    targetAmount: 0,
    deadline: "",
    priority: 1,
    enabled: true,
  },
  {
    name: "Quitar Dívidas",
    icon: "🎯",
    targetAmount: 0,
    deadline: "",
    priority: 2,
    enabled: false,
  },
  {
    name: "Casa Própria",
    icon: "🏠",
    targetAmount: 300000,
    deadline: "",
    priority: 3,
    enabled: false,
  },
  {
    name: "Investir no Futuro",
    icon: "📈",
    targetAmount: 0,
    deadline: "",
    priority: 4,
    enabled: false,
  },
  {
    name: "Viagem dos Sonhos",
    icon: "✈️",
    targetAmount: 8000,
    deadline: "",
    priority: 5,
    enabled: false,
  },
  {
    name: "Carro Novo",
    icon: "🚗",
    targetAmount: 50000,
    deadline: "",
    priority: 6,
    enabled: false,
  },
  {
    name: "Independência Financeira",
    icon: "🏖️",
    targetAmount: 1000000,
    deadline: "",
    priority: 7,
    enabled: false,
  },
  {
    name: "Educação / Curso",
    icon: "🎓",
    targetAmount: 15000,
    deadline: "",
    priority: 8,
    enabled: false,
  },
];
