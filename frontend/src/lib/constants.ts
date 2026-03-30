// ============= Personal Categories =============
export const personalCategories = {
  income: [
    "Salário",
    "Freelance",
    "Investimentos",
    "Aluguel Recebido",
    "Vendas",
    "Presente",
    "Reembolso",
    "Outros",
  ],
  expense: [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde",
    "Educação",
    "Lazer",
    "Roupas",
    "Beleza",
    "Assinaturas",
    "Contas",
    "Mercado",
    "Pets",
    "Viagem",
    "Outros",
  ],
};

// ============= Business Categories =============
export const businessCategories = {
  income: [
    "Vendas de Produtos",
    "Prestação de Serviços",
    "Comissões",
    "Juros Recebidos",
    "Rendimentos",
    "Outros Recebimentos",
  ],
  expense: [
    "Fornecedores",
    "Salários",
    "Encargos",
    "Aluguel",
    "Energia",
    "Água",
    "Internet",
    "Telefone",
    "Impostos",
    "Marketing",
    "Manutenção",
    "Combustível",
    "Equipamentos",
    "Software",
    "Outros",
  ],
};

export const paymentMethods = [
  "Dinheiro",
  "Débito",
  "Crédito",
  "PIX",
  "Boleto",
  "Transferência",
];

export const CHART_COLORS = [
  "hsl(234, 89%, 60%)", // primary
  "hsl(160, 84%, 39%)", // success
  "hsl(0, 84%, 60%)", // danger
  "hsl(38, 92%, 50%)", // warning
  "hsl(280, 70%, 55%)", // purple
  "hsl(217, 91%, 60%)", // info
  "hsl(330, 80%, 60%)", // pink
  "hsl(180, 70%, 45%)", // teal
];

export const goalIcons = [
  "🏠",
  "🚗",
  "✈️",
  "📱",
  "💻",
  "🎓",
  "💍",
  "🏖️",
  "🎮",
  "📚",
  "💰",
  "🎯",
];

export const goalColors = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
];

export const initialTransactionFormData = {
  type: "expense" as const,
  description: "",
  amount: "",
  category: "",
  date: new Date().toISOString().substring(0, 10),
  paymentMethod: "pix",
  notes: "",
  recurring: false,
  scope: "personal" as const,
  classification: "necessity" as const,
};
