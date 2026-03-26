import { loadTransactions, saveTransactions } from "@/lib/storage";
import type { Transaction } from "@/types";
import type { ParsedIntent } from "../intent-parser";
import type { ActionResult } from "../types";

export const executeTransactionAction = async (
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
