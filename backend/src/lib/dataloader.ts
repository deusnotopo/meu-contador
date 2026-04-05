import DataLoader from 'dataloader';
import { db } from './db';

// Batch load users
export const userLoader = new DataLoader(async (userIds: readonly string[]) => {
  const users = await db.user.findMany({
    where: { 
      id: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id) || null);
});

// Batch load transactions by userId
export const transactionLoader = new DataLoader(async (userIds: readonly string[]) => {
  const transactions = await db.transaction.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
    orderBy: { date: 'desc' },
  });
  
  const grouped = new Map<string, typeof transactions>();
  transactions.forEach(t => {
    if (!grouped.has(t.userId)) {
      grouped.set(t.userId, []);
    }
    grouped.get(t.userId)!.push(t);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Batch load budgets by userId
export const budgetLoader = new DataLoader(async (userIds: readonly string[]) => {
  const budgets = await db.budget.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const grouped = new Map<string, typeof budgets>();
  budgets.forEach(b => {
    if (!grouped.has(b.userId)) {
      grouped.set(b.userId, []);
    }
    grouped.get(b.userId)!.push(b);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Batch load investments by userId
export const investmentLoader = new DataLoader(async (userIds: readonly string[]) => {
  const investments = await db.investment.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const grouped = new Map<string, typeof investments>();
  investments.forEach(inv => {
    if (!grouped.has(inv.userId)) {
      grouped.set(inv.userId, []);
    }
    grouped.get(inv.userId)!.push(inv);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Batch load debts by userId
export const debtLoader = new DataLoader(async (userIds: readonly string[]) => {
  const debts = await db.debt.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const grouped = new Map<string, typeof debts>();
  debts.forEach(d => {
    if (!grouped.has(d.userId)) {
      grouped.set(d.userId, []);
    }
    grouped.get(d.userId)!.push(d);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Batch load savings goals by userId
export const savingsGoalLoader = new DataLoader(async (userIds: readonly string[]) => {
  const goals = await db.savingsGoal.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const grouped = new Map<string, typeof goals>();
  goals.forEach(g => {
    if (!grouped.has(g.userId)) {
      grouped.set(g.userId, []);
    }
    grouped.get(g.userId)!.push(g);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Batch load bank accounts by userId
export const bankAccountLoader = new DataLoader(async (userIds: readonly string[]) => {
  const accounts = await db.bankAccount.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const grouped = new Map<string, typeof accounts>();
  accounts.forEach(a => {
    if (!grouped.has(a.userId)) {
      grouped.set(a.userId, []);
    }
    grouped.get(a.userId)!.push(a);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Batch load bill reminders by userId
export const billReminderLoader = new DataLoader(async (userIds: readonly string[]) => {
  const reminders = await db.billReminder.findMany({
    where: { 
      userId: { in: [...userIds] },
      deletedAt: null,
    },
  });
  
  const grouped = new Map<string, typeof reminders>();
  reminders.forEach(r => {
    if (!grouped.has(r.userId)) {
      grouped.set(r.userId, []);
    }
    grouped.get(r.userId)!.push(r);
  });
  
  return userIds.map(id => grouped.get(id) || []);
});

// Clear all loaders (useful for testing or cache invalidation)
export function clearAllLoaders() {
  userLoader.clearAll();
  transactionLoader.clearAll();
  budgetLoader.clearAll();
  investmentLoader.clearAll();
  debtLoader.clearAll();
  savingsGoalLoader.clearAll();
  bankAccountLoader.clearAll();
  billReminderLoader.clearAll();
}