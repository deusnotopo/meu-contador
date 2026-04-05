import { db } from './db';

interface UserDataExport {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
  transactions: any[];
  budgets: any[];
  goals: any[];
  investments: any[];
  debts: any[];
  reminders: any[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [user, transactions, budgets, goals, investments, debts, reminders] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    }),
    db.transaction.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        category: true,
        date: true,
        paymentMethod: true,
        scope: true,
        createdAt: true,
      },
    }),
    db.budget.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        category: true,
        limit: true,
        spent: true,
        month: true,
        createdAt: true,
      },
    }),
    db.savingsGoal.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        deadline: true,
        createdAt: true,
      },
    }),
    db.investment.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        ticker: true,
        type: true,
        amount: true,
        averagePrice: true,
        currentPrice: true,
        createdAt: true,
      },
    }),
    db.debt.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        balance: true,
        interestRate: true,
        minPayment: true,
        dueDate: true,
        category: true,
        createdAt: true,
      },
    }),
    db.billReminder.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        amount: true,
        dueDate: true,
        category: true,
        isPaid: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    user,
    transactions,
    budgets,
    goals,
    investments,
    debts,
    reminders,
  };
}

export function sanitizeExportData(data: UserDataExport): UserDataExport {
  // Remove any sensitive internal fields
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Sanitize user
  delete sanitized.user.passwordHash;
  
  // Round monetary values to 2 decimal places
  sanitized.transactions = sanitized.transactions.map((t: any) => ({
    ...t,
    amount: Math.round(t.amount * 100) / 100,
  }));
  
  sanitized.budgets = sanitized.budgets.map((b: any) => ({
    ...b,
    limit: Math.round(b.limit * 100) / 100,
    spent: Math.round(b.spent * 100) / 100,
  }));
  
  return sanitized;
}