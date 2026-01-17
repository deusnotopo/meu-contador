import type { BillReminder as Reminder, Transaction } from "@/types";

export interface Pattern {
  description: string;
  amount: number;
  category: string;
  frequency: number;
  lastDate: string;
  isAlreadyRecurring: boolean;
}

export const detectPatterns = (
  transactions: Transaction[],
  existingReminders: Reminder[]
): Pattern[] => {
  const groups: Record<string, Transaction[]> = {};

  // Group by "normalized" description (ignoring case)
  transactions.forEach((t) => {
    if (t.type === "income") return; // Focus on expenses for now
    const key = t.description.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const patterns: Pattern[] = [];
  const reminderDescriptions = new Set(
    existingReminders.map((r) => r.name.toLowerCase().trim())
  );

  Object.entries(groups).forEach(([desc, list]) => {
    if (list.length < 2) return;

    list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const isMonthly = list.some((t, i) => {
      if (i === 0) return false;
      const prev = new Date(list[i - 1].date);
      const curr = new Date(t.date);
      const diffDays = Math.abs(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 25 && diffDays <= 35;
    });

    if (isMonthly || list.length >= 3) {
      patterns.push({
        description: list[0].description,
        amount: list[list.length - 1].amount,
        category: list[0].category,
        frequency: list.length,
        lastDate: list[list.length - 1].date,
        isAlreadyRecurring:
          reminderDescriptions.has(desc) || list.some((t) => t.recurring),
      });
    }
  });

  return patterns.filter((p) => !p.isAlreadyRecurring);
};
