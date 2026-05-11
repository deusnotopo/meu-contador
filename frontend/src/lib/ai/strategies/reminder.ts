import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import type { BillReminder } from "@/types";
import type { ParsedIntent } from "../intent-parser";
import type { ActionResult } from "../types";

export const executeReminderAction = async (
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

  try {
    const response = await api.post<BillReminder>('/reminders', {
      name,
      amount: amount || 0,
      dueDate,
      category: "Contas",
      recurring: "monthly",
    });

    const [year, month, day] = dueDate.split('-');
    const safeDate = `${day}/${month}/${year}`;

    return {
      success: true,
      message: `🔔 Lembrete criado!\n📌 ${name}\n📅 Vencimento: ${safeDate}`,
      data: response,
    };
  } catch (err) {
    logger.error('[ReminderStrategy] API create failed', err);
    return {
      success: false,
      message: "Ocorreu um erro ao tentar salvar o lembrete via API.",
    };
  }
};
