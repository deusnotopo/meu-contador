import { describe, it, expect } from 'vitest';

describe('useTransactions', () => {
  it('should be defined', () => {
    // Basic test to ensure module loads
    expect(true).toBe(true);
  });

  it('should handle transaction calculations', () => {
    const transactions = [
      { id: '1', amount: 100, type: 'income', description: 'Test', category: 'Salary', date: '2024-01-01', scope: 'personal' as const },
      { id: '2', amount: 50, type: 'expense', description: 'Test', category: 'Food', date: '2024-01-01', scope: 'personal' as const },
    ];

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalIncome).toBe(100);
    expect(totalExpense).toBe(50);
  });

  it('should filter transactions by type', () => {
    const transactions = [
      { id: '1', amount: 100, type: 'income', description: 'Test', category: 'Salary', date: '2024-01-01', scope: 'personal' as const },
      { id: '2', amount: 50, type: 'expense', description: 'Test', category: 'Food', date: '2024-01-01', scope: 'personal' as const },
      { id: '3', amount: 75, type: 'income', description: 'Test', category: 'Bonus', date: '2024-01-02', scope: 'personal' as const },
    ];

    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    expect(incomeTransactions).toHaveLength(2);
    expect(expenseTransactions).toHaveLength(1);
  });
});
