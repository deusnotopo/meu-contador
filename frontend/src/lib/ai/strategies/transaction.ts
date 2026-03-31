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

  // Phase 11: Real Persistence via API
  const { api } = await import("@/lib/api");
  
  try {
    const transaction = await api.post<Transaction>("/transactions", {
      amount,
      description,
      type,
      category: category || "Outros",
      date,
      scope: "personal", // Default for AI chat entries
    });

    const emoji = type === "expense" ? "💸" : "💰";
    const verb = type === "expense" ? "Despesa" : "Receita";

    return {
      success: true,
      message: `${emoji} ${verb} de R$ ${amount.toFixed(
        2
      )} registrada com sucesso no banco de dados!\n📝 Descrição: ${description}\n🏷️ Categoria: ${category || "Outros"}`,
      data: transaction,
    };
  } catch (error) {
    console.error("AI Save Error:", error);
    return {
      success: false,
      message: "Consegui entender o comando, mas houve um erro ao salvar no servidor. Tente novamente em instantes.",
    };
  }
};
