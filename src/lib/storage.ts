import type {
  BillReminder,
  Budget,
  CashFlowProjection,
  Invoice,
  SavingsGoal,
  Transaction,
} from "@/types";
import { auth } from "./firebase";
import { loadFromCloud, syncToCloud } from "./firestore-sync";

const STORAGE_KEYS = {
  TRANSACTIONS: "meu_contador_transactions",
  BUDGETS: "meu_contador_budgets",
  GOALS: "meu_contador_goals",
  REMINDERS: "meu_contador_reminders",
  INVOICES: "meu_contador_invoices",
  CASH_FLOW: "meu_contador_cash_flow",
  PROFILE: "meu_contador_profile",
  ONBOARDING: "meu_contador_onboarding",
};

// Helper to push to cloud if user exists
const pushToCloud = (key: string, data: any) => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    syncToCloud(userId, key, data);
  }
};

/**
 * Downloads all data from Firestore and updates localStorage.
 * Used upon login to restore user state.
 */
export const syncAllData = async (userId: string) => {
  if (!userId) return;

  const keys = Object.values(STORAGE_KEYS);
  for (const key of keys) {
    const cloudData = await loadFromCloud(userId, key);
    if (cloudData) {
      localStorage.setItem(key, JSON.stringify(cloudData));
    }
  }
};

// ============= Transactions =============
export const loadTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (data) {
      const parsed = JSON.parse(data);
      // Add default scope for legacy data
      return parsed.map((t: Partial<Transaction>) => ({
        ...t,
        scope: t.scope || "personal",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading transactions:", error);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  pushToCloud(STORAGE_KEYS.TRANSACTIONS, transactions);
};

export const exportTransactions = (transactions: Transaction[]): void => {
  const dataStr = JSON.stringify(transactions, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meu-contador-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const importTransactions = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          resolve(
            imported.map((t: Partial<Transaction>) => ({
              ...t,
              scope: t.scope || "personal",
            })) as Transaction[]
          );
        } else {
          reject(new Error("Formato de arquivo inválido"));
        }
      } catch (error) {
        reject(new Error("Erro ao importar dados"));
      }
    };
    reader.readAsText(file);
  });
};

// ============= Budgets =============
export const loadBudgets = (): Budget[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveBudgets = (budgets: Budget[]): void => {
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  pushToCloud(STORAGE_KEYS.BUDGETS, budgets);
};

// ============= Goals =============
export const loadGoals = (): SavingsGoal[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveGoals = (goals: SavingsGoal[]): void => {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  pushToCloud(STORAGE_KEYS.GOALS, goals);
};

// ============= Reminders =============
export const loadReminders = (): BillReminder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveReminders = (reminders: BillReminder[]): void => {
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  pushToCloud(STORAGE_KEYS.REMINDERS, reminders);
};

// ============= Invoices =============
export const loadInvoices = (): Invoice[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  pushToCloud(STORAGE_KEYS.INVOICES, invoices);
};

// ============= Cash Flow =============
export const loadCashFlow = (): CashFlowProjection[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CASH_FLOW);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCashFlow = (cashFlow: CashFlowProjection[]): void => {
  localStorage.setItem(STORAGE_KEYS.CASH_FLOW, JSON.stringify(cashFlow));
  pushToCloud(STORAGE_KEYS.CASH_FLOW, cashFlow);
};

// ============= Profile =============
export const loadProfile = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// ============= Full Backup =============
export const exportFullBackup = () => {
  const backup = {
    transactions: loadTransactions(),
    budgets: loadBudgets(),
    goals: loadGoals(),
    reminders: loadReminders(),
    invoices: loadInvoices(),
    cashFlow: loadCashFlow(),
    profile: loadProfile(),
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meu-contador-backup-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const importFullBackup = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (!backup.timestamp || !backup.version) {
           reject(new Error("Arquivo de backup inválido"));
           return;
        }

        // Restore all keys
        if (backup.transactions) saveTransactions(backup.transactions);
        if (backup.budgets) saveBudgets(backup.budgets);
        if (backup.goals) saveGoals(backup.goals);
        if (backup.reminders) saveReminders(backup.reminders);
        if (backup.invoices) saveInvoices(backup.invoices);
        if (backup.cashFlow) saveCashFlow(backup.cashFlow);
        if (backup.profile) saveProfile(backup.profile);

        resolve();
      } catch (error) {
        reject(new Error("Erro ao processar arquivo de backup"));
      }
    };
    reader.readAsText(file);
  });
};
