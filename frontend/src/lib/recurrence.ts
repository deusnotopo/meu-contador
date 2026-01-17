import type { Transaction } from "@/types";
import { loadTransactions, saveTransactions } from "./storage";
import { showSuccess } from "./toast";

export const checkRecurringTransactions = () => {
  const loaded = loadTransactions();
  const newTransactions: Transaction[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today

  loaded.forEach((t) => {
    if (t.recurring) {
      const transactionDate = new Date(t.date + "T00:00:00");
      const interval = t.recurrenceInterval || "monthly"; // Default to monthly for backward compatibility

      const nextDueDate = new Date(transactionDate);

      // We need to find the "next" occurrence that is essentially "pending" relative to the original date
      // But simpler logic: iterate from the original date until we hit a date that is <= today
      // AND hasn't been generated yet.

      // However, a more robust way for "catching up" is:
      // 1. Determine the latest generated instance of this transaction series.
      // (This requires tracking a 'seriesId' or relying on description+amount+interval matching heuristic).
      // Since we don't have seriesId, we'll use the heuristic:
      // "Has a transaction with same desc/amount/type exists for the calculated due date?"

      // Let's protect against infinite loops
      let safeGuard = 0;

      while (nextDueDate <= today && safeGuard < 365) {
        safeGuard++;

        // Increment based on interval
        if (interval === "weekly") {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (interval === "bi-weekly") {
          nextDueDate.setDate(nextDueDate.getDate() + 14);
        } else if (interval === "monthly") {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else if (interval === "yearly") {
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }

        // If the calculated next due date is in the future, stop
        if (nextDueDate > today) break;

        const nextDueDateStr = nextDueDate.toISOString().split("T")[0];

        // Check if this specific occurrence already exists
        const alreadyExists = loaded.some(
          (existing) =>
            existing.description === t.description &&
            existing.amount === t.amount &&
            existing.type === t.type &&
            existing.date === nextDueDateStr
        );

        if (!alreadyExists) {
          // Also check if we already added it to newTransactions in this session
          const inQueue = newTransactions.some(
            (pending) =>
              pending.description === t.description &&
              pending.amount === t.amount &&
              pending.type === t.type &&
              pending.date === nextDueDateStr
          );

          if (!inQueue) {
            newTransactions.push({
              ...t,
              id: Date.now() + Math.random(),
              date: nextDueDateStr,
              recurring: true, // Mark as recurring
              recurrenceInterval: interval, // Keep the interval
            });
          }
        }
      }
    }
  });

  if (newTransactions.length > 0) {
    const updatedList = [...loaded, ...newTransactions];
    saveTransactions(updatedList);
    showSuccess(`${newTransactions.length} transações recorrentes geradas.`);
    return true;
  }

  return false;
};
