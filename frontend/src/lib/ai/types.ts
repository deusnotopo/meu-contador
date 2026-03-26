import type { BillReminder, Budget, Transaction } from "@/types";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Transaction | BillReminder | Budget;
}
