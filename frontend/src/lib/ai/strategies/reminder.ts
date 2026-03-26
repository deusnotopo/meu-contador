import { loadReminders, saveReminders } from "@/lib/storage";
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
