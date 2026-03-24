import {
  loadBudgets,
  loadReminders,
  loadTransactions,
  saveBudgets,
  saveReminders,
  saveTransactions,
} from "@/lib/storage";
import type { BillReminder, Budget, Transaction } from "@/types";
import type { ParsedIntent } from "./intent-parser";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Transaction | BillReminder | Budget;
}

export const executeAction = async (
  intent: ParsedIntent
): Promise<ActionResult> => {
  try {
    switch (intent.type) {
      case "transaction":
        return await executeTransactionAction(intent);

      case "reminder":
        return await executeReminderAction(intent);

      case "budget":
        return await executeBudgetAction(intent);

      default:
        return {
          success: false,
          message: "Não consegui entender o comando. Tente reformular.",
        };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return {
      success: false,
      message: "Ocorreu um erro ao executar a ação.",
    };
  }
};

const executeTransactionAction = async (
  intent: ParsedIntent
): Promise<ActionResult> => {
  if (intent.action !== "create" || !intent.data) {
    return {
      success: false,
      message: "Dados insuficientes para criar transação.",
    };
  }

  const { amount, description, type, category, date } = intent.data;

  if (!amount || !description || !type || !date) {
    return {
      success: false,
      message: "Informações incompletas para a transação.",
    };
  }

  const transaction: Transaction = {
    id: Date.now().toString(),
    amount,
    description,
    type,
    category: category || "Outros",
    date,
    paymentMethod: "Outros",
    notes: "Gerado pela Inteligência Artificial",
    recurring: false,
    scope: "personal",
  };

  const transactions = loadTransactions();
  saveTransactions([...transactions, transaction]);

  const emoji = type === "expense" ? "💸" : "💰";
  const verb = type === "expense" ? "Despesa" : "Receita";

  return {
    success: true,
    message: `${emoji} ${verb} de R$ ${amount.toFixed(
      2
    )} registrada com sucesso!\n📝 Descrição: ${description}\n🏷️ Categoria: ${category}`,
    data: transaction,
  };
};

const executeReminderAction = async (
  intent: ParsedIntent
): Promise<ActionResult> => {
  if (intent.action !== "create" || !intent.data) {
    return {
      success: false,
      message: "Dados insuficientes para criar lembrete.",
    };
  }

  const { name, dueDate, amount } = intent.data;

  if (!name || !dueDate) {
    return {
      success: false,
      message: "Informações incompletas para o lembrete.",
    };
  }

  const reminders = loadReminders();
  const newReminder: BillReminder = {
    id: Date.now().toString(),
    name,
    amount: amount || 0,
    dueDate,
    isPaid: false,
    category: "Contas",
    recurring: "monthly",
  };

  saveReminders([...reminders, newReminder]);

  return {
    success: true,
    message: `🔔 Lembrete criado!\n📌 ${name}\n📅 Vencimento: ${new Date(
      dueDate
    ).toLocaleDateString("pt-BR")}`,
    data: newReminder,
  };
};

const executeBudgetAction = async (
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
