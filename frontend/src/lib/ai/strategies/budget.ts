import { loadBudgets, saveBudgets } from "@/lib/storage";
import type { Budget } from "@/types";
import type { ParsedIntent } from "../intent-parser";
import type { ActionResult } from "../types";

export const executeBudgetAction = async (
  intent: ParsedIntent
): Promise<ActionResult> => {
  if (intent.action !== "create" || !intent.data) {
    return {
      success: false,
      message: "Dados insuficientes para criar orçamento.",
    };
  }

  const { limit, category } = intent.data;

  if (!limit || !category) {
    return {
      success: false,
      message: "Informações incompletas para o orçamento.",
    };
  }

  const budgets = loadBudgets();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Check if budget already exists for this category
  const existingBudget = budgets.find(
    (b) => b.category === category && b.month === currentMonth
  );

  if (existingBudget) {
    return {
      success: false,
      message: `Já existe um orçamento de R$ ${existingBudget.limit.toFixed(
        2
      )} para ${category} este mês.`,
    };
  }

  const newBudget: Budget = {
    id: Date.now().toString(),
    category,
    limit,
    spent: 0,
    month: currentMonth,
  };

  saveBudgets([...budgets, newBudget]);

  return {
    success: true,
    message: `🎯 Orçamento criado!\n🏷️ Categoria: ${category}\n💵 Limite: R$ ${limit.toFixed(
      2
    )}`,
    data: newBudget,
  };
};
