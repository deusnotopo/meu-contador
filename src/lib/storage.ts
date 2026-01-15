import type {
  BillReminder,
  Budget,
  CashFlowProjection,
  EducationProgress,
  Investment,
  Invoice,
  SavingsGoal,
  Transaction,
} from "@/types";
import { auth } from "./firebase";
import { loadFromCloud, syncToCloud } from "./firestore-sync";

export const STORAGE_KEYS = {
  TRANSACTIONS: "meu_contador_transactions",
  BUDGETS: "meu_contador_budgets",
  GOALS: "meu_contador_goals",
  REMINDERS: "meu_contador_reminders",
  INVOICES: "meu_contador_invoices",
  CASH_FLOW: "meu_contador_cash_flow",
  PROFILE: "meu_contador_profile",
  ONBOARDING: "meu_contador_onboarding",
  INVESTMENTS: "meu_contador_investments",
  DIVIDENDS: "meu_contador_dividends",
  PRIVACY_MODE: "meu_contador_privacy_mode",
  EDUCATION_PROGRESS: "meu_contador_education_progress",
  INVESTMENT_SALES: "meu_contador_investment_sales",
};

// Helper to push to cloud if user exists
export const pushToCloud = async (key: string, data: unknown) => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    try {
      window.dispatchEvent(new Event("sync:start"));

      // Profile always goes to 'users'
      if (key === STORAGE_KEYS.PROFILE) {
        await syncToCloud(userId, key, data, "users");
      } else {
        // Other data goes to current workspace
        const profile = loadProfile();
        const workspaceId = profile?.currentWorkspaceId || userId;
        const collection = profile?.currentWorkspaceId ? "workspaces" : "users";
        await syncToCloud(workspaceId, key, data, collection);
      }

      window.dispatchEvent(new Event("sync:end"));
    } catch (error) {
      console.error("Sync error:", error);
      window.dispatchEvent(new Event("sync:error"));
    }
  }
};

/**
 * Downloads all data from Firestore and updates localStorage.
 * Used upon login to restore user state.
 */
export const syncAllData = async (userId: string) => {
  if (!userId) return;

  try {
    console.log(`[Sync] Starting sync sequence for user ${userId}...`);

    // 1. Sync Profile FIRST (Always from users collection)
    try {
      const cloudProfile = await loadFromCloud(
        userId,
        STORAGE_KEYS.PROFILE,
        "users"
      );
      if (cloudProfile) {
        localStorage.setItem(
          STORAGE_KEYS.PROFILE,
          JSON.stringify(cloudProfile)
        );
        window.dispatchEvent(
          new CustomEvent(STORAGE_EVENT, {
            detail: { key: STORAGE_KEYS.PROFILE, data: cloudProfile },
          })
        );
      }
    } catch (e) {
      console.error("[Sync] Failed to sync profile:", e);
    }

    // 2. Determine Sync Target (Workspace vs Personal)
    const profile = loadProfile();
    const workspaceId = profile?.currentWorkspaceId || userId;
    const collectionName = profile?.currentWorkspaceId ? "workspaces" : "users";

    console.log(
      `[Sync] Target: ${collectionName}/${workspaceId} (Workspace Mode: ${!!profile?.currentWorkspaceId})`
    );

    // 3. Sync all other keys from target
    const keys = Object.values(STORAGE_KEYS).filter(
      (k) => k !== STORAGE_KEYS.PROFILE
    );

    await Promise.all(
      keys.map(async (key) => {
        try {
          const cloudData = await loadFromCloud(
            workspaceId,
            key,
            collectionName
          );
          if (cloudData) {
            localStorage.setItem(key, JSON.stringify(cloudData));
            // Trigger local update for hooks
            window.dispatchEvent(
              new CustomEvent(STORAGE_EVENT, {
                detail: { key, data: cloudData },
              })
            );
          }
        } catch (err) {
          console.error(`[Sync] error for key ${key}:`, err);
        }
      })
    );
    console.log("[Sync] All keys processed.");
  } catch (error) {
    console.error("[Sync] Critical failure during syncAllData:", error);
  }
};

export const STORAGE_EVENT = "storage-local";

const persistData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, { detail: { key, data } })
  );
  pushToCloud(key, data);

  // Update Education Progress dynamically
  updateEducationOnAction(key, data);
};

const updateEducationOnAction = (key: string, data: unknown) => {
  const currentProgress = loadEducationProgress() || {
    completedLessons: [],
    unlockedAchievements: [],
    points: 0,
    streak: 0,
  };

  let updated = false;

  // Achievement: First Transaction
  if (
    key === STORAGE_KEYS.TRANSACTIONS &&
    Array.isArray(data) &&
    data.length > 0 &&
    !currentProgress.unlockedAchievements.includes("first-transaction")
  ) {
    currentProgress.unlockedAchievements.push("first-transaction");
    currentProgress.points += 50;
    updated = true;
  }

  // Achievement: Budget Master (if they have at least 1 budget)
  if (
    key === STORAGE_KEYS.BUDGETS &&
    data.length > 0 &&
    !currentProgress.unlockedAchievements.includes("budget-master")
  ) {
    currentProgress.unlockedAchievements.push("budget-master");
    currentProgress.points += 100;
    updated = true;
  }

  // General points for activity
  if (key === STORAGE_KEYS.TRANSACTIONS || key === STORAGE_KEYS.GOALS) {
    currentProgress.points += 2;
    updated = true;
  }

  if (updated) {
    localStorage.setItem(
      STORAGE_KEYS.EDUCATION_PROGRESS,
      JSON.stringify(currentProgress)
    );
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT, {
        detail: { key: STORAGE_KEYS.EDUCATION_PROGRESS, data: currentProgress },
      })
    );
    pushToCloud(STORAGE_KEYS.EDUCATION_PROGRESS, currentProgress);
  }
};

export const saveFromCloud = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, { detail: { key, data } })
  );
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
  persistData(STORAGE_KEYS.TRANSACTIONS, transactions);
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

export const exportTransactionsToCSV = (transactions: Transaction[]): void => {
  const headers = [
    "Data",
    "Descrição",
    "Tipo",
    "Categoria",
    "Valor",
    "Método",
    "Status",
    "Escopo",
  ];
  const rows = transactions.map((t) => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    t.type === "income" ? "Receita" : "Despesa",
    t.category,
    t.amount.toString().replace(".", ","),
    t.paymentMethod || "",
    t.status || "Pendente",
    t.scope,
  ]);

  const csvContent = [headers, ...rows].map((e) => e.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meu-contador-extrato-${
    new Date().toISOString().split("T")[0]
  }.csv`;
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
  persistData(STORAGE_KEYS.BUDGETS, budgets);
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
  persistData(STORAGE_KEYS.GOALS, goals);
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
  persistData(STORAGE_KEYS.REMINDERS, reminders);
};

export const addReminder = (
  reminder: Omit<BillReminder, "id" | "isPaid">
): void => {
  const reminders = loadReminders();
  const newReminder: BillReminder = {
    ...reminder,
    id: Date.now(),
    isPaid: false,
  };
  saveReminders([...reminders, newReminder]);
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
  persistData(STORAGE_KEYS.INVOICES, invoices);
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
  persistData(STORAGE_KEYS.CASH_FLOW, cashFlow);
};

// ============= Profile =============
export const loadProfile = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveProfile = (d: UserProfile) => {
  persistData(STORAGE_KEYS.PROFILE, d);
};

// ============= Education =============
export const loadEducationProgress = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EDUCATION_PROGRESS);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveEducationProgress = (progress: EducationProgress) => {
  persistData(STORAGE_KEYS.EDUCATION_PROGRESS, progress);
};

// ============= Investments =============
export const loadInvestments = (): Investment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveInvestments = (investments: Investment[]): void => {
  persistData(STORAGE_KEYS.INVESTMENTS, investments);
};

// ============= Dividends =============
export const loadDividends = (): Dividend[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveDividends = (dividends: Dividend[]): void => {
  persistData(STORAGE_KEYS.DIVIDENDS, dividends);
};

// ============= Investment Sales =============
export const loadInvestmentSales = (): InvestmentSale[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVESTMENT_SALES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveInvestmentSales = (sales: InvestmentSale[]): void => {
  persistData(STORAGE_KEYS.INVESTMENT_SALES, sales);
};

// ============= Privacy Mode =============
export const loadPrivacyMode = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.PRIVACY_MODE) === "true";
};

export const savePrivacyMode = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, String(enabled));
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
    investments: loadInvestments(),
    profile: loadProfile(),
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meu-contador-backup-${
    new Date().toISOString().split("T")[0]
  }.json`;
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
        if (backup.investments) saveInvestments(backup.investments);
        if (backup.profile) saveProfile(backup.profile);

        resolve();
      } catch (error) {
        reject(new Error("Erro ao processar arquivo de backup"));
      }
    };
    reader.readAsText(file);
  });
};
