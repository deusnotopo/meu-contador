import type { Budget, Transaction } from "@/types";

export const BUDGET_CATEGORY_ICONS: Record<string, string> = {
  Moradia: "🏠",
  Mercado: "🛒",
  Delivery: "🍕",
  Transporte: "🚗",
  Saúde: "💊",
  Lazer: "🎬",
  Roupas: "👕",
  Outros: "📦",
  Viagem: "✈️",
  Emergência: "🛡️",
  Investimentos: "📈",
  Educação: "🎓",
  Imóvel: "🏡",
  Poupança: "💰",
  Reserva: "🏦",
};

export const BUDGET_GROUPS = {
  Necessidades: ["Moradia", "Transporte", "Mercado", "Saúde", "Educação"],
  Desejos: ["Delivery", "Lazer", "Roupas", "Viagem", "Outros"],
  Poupança: ["Emergência", "Investimentos", "Imóvel", "Poupança", "Reserva"],
} as const;

export const BUDGET_GROUP_ORDER = Object.keys(BUDGET_GROUPS) as Array<keyof typeof BUDGET_GROUPS>;

export function normalizeBudgetCategory(category: string) {
  const normalized = category.trim().toLowerCase();

  const aliases: Record<string, string> = {
    mercado: "Mercado",
    supermercado: "Mercado",
    alimentacao: "Mercado",
    alimentação: "Mercado",
    transporte: "Transporte",
    moradia: "Moradia",
    saude: "Saúde",
    saúde: "Saúde",
    lazer: "Lazer",
    delivery: "Delivery",
    roupas: "Roupas",
    viagem: "Viagem",
    viagens: "Viagem",
    educacao: "Educação",
    educação: "Educação",
    emergencia: "Emergência",
    emergência: "Emergência",
    investimentos: "Investimentos",
    imovel: "Imóvel",
    imóvel: "Imóvel",
    poupanca: "Poupança",
    poupança: "Poupança",
    reserva: "Reserva",
    outros: "Outros",
  };

  return aliases[normalized] || (normalized.charAt(0).toUpperCase() + normalized.slice(1));
}

export function getBudgetGroup(category: string) {
  const normalized = normalizeBudgetCategory(category);

  for (const group of BUDGET_GROUP_ORDER) {
    if (BUDGET_GROUPS[group].includes(normalized as never)) {
      return group;
    }
  }

  return "Desejos" as const;
}

export function buildSpentByCategory(transactions: Transaction[], currentMonth: string) {
  return transactions
    .filter((transaction) => transaction.type === "expense" && transaction.date.startsWith(currentMonth))
    .reduce<Record<string, number>>((accumulator, transaction) => {
      const key = normalizeBudgetCategory(transaction.category);
      accumulator[key] = (accumulator[key] || 0) + Math.abs(transaction.amount);
      return accumulator;
    }, {});
}

export function mapBudgetsWithInsights(budgets: Budget[], spentByCategory: Record<string, number>) {
  return budgets.map((budget) => {
    const category = normalizeBudgetCategory(budget.category);
    return {
      ...budget,
      category,
      icon: BUDGET_CATEGORY_ICONS[category] || "📦",
      spent: spentByCategory[category] ?? budget.spent ?? 0,
      group: getBudgetGroup(category),
    };
  });
}