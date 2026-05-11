import { describe, it, expect } from 'vitest';
import { BudgetService } from './BudgetService';

describe('BudgetService Math Engine', () => {
  it('should convert decimals to cents correctly using integer math', () => {
    expect(BudgetService.toCents(10.50)).toBe(1050);
    expect(BudgetService.toCents(0.1 + 0.2)).toBe(30); // Floating point fix check
    expect(BudgetService.toCents(100)).toBe(10000);
  });

  it('should convert cents back to decimals with fixed 2 places', () => {
    expect(BudgetService.fromCents(1050)).toBe(10.50);
    expect(BudgetService.fromCents(10000)).toBe(100.00);
  });

  it('should calculate RTA (Ready-to-Assign) correctly', () => {
    const totalIncome = 5000;
    const budgets = [
      { category: 'A', limit: 1000, spent: 0 },
      { category: 'B', limit: 2000, spent: 0 },
    ] as unknown as Parameters<typeof BudgetService.calculateRTA>[1];
    // 5000 - 3000 = 2000 remaining to assign
    expect(BudgetService.calculateRTA(totalIncome, budgets)).toBe(2000);
  });

  it('should handle zero or negative RTA', () => {
    const totalIncome = 3000;
    const budgets = [{ category: 'A', limit: 4000, spent: 0 }] as unknown as Parameters<typeof BudgetService.calculateRTA>[1];
    expect(BudgetService.calculateRTA(totalIncome, budgets)).toBe(-1000);
  });

  it('should calculate Pace Index and status correctly', () => {
    const limit = 1000;
    const spent = 400;
    const dom = 10;   // 1/3 of month
    const totalDays = 30;
    
    // Expected spend at day 10: 1000 * (10/30) = 333.33
    // Pace Index: 400 / 333.33 = 1.2 (20% faster)
    
    const metrics = BudgetService.getMetrics(spent, limit, dom, totalDays);
    
    expect(metrics.percentage).toBe(40);
    expect(metrics.status).toBe('warning'); // paceIndex 1.2 > 1.1 warning threshold
    expect(metrics.projectedSpend).toBe(1200); // 400 / 10 * 30
  });

  it('should mark as critical if pace index exceeds 1.25', () => {
    const metrics = BudgetService.getMetrics(500, 1000, 10, 30);
    // Pace Index: 500 / 333.33 = 1.5
    expect(metrics.status).toBe('critical');
  });

  it('should mark as over if spent exceeds limit', () => {
    const metrics = BudgetService.getMetrics(1100, 1000, 10, 30);
    expect(metrics.status).toBe('over');
  });
});
