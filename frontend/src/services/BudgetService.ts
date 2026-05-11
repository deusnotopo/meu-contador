/**
 * BudgetService.ts — Akita Mode Engine
 * ──────────────────────────────────────
 * Core logic for financial engineering: ZBB, Pace Index, and Projections.
 * 
 * DESIGN PRINCIPLES:
 * 1. Stateless: No side effects, purely mathematical.
 * 2. Precision: Works with cents (integers) internally.
 * 3. Domain-Driven: Reflects budgeting methodologies (ZBB, 50/30/20).
 */

import { Budget } from "@/types";
// Local helpers para manipulação segura de moeda (evita erros de ponto flutuante)
export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
export interface BudgetMetrics {
  spent: number;
  limit: number;
  remaining: number;
  percentage: number;
  paceIndex: number;
  projectedSpend: number;
  dailyAllowance: number;
  daysToBreak: number;
  status: "safe" | "warning" | "critical" | "over";
}

export class BudgetService {
  // toCents e fromCents foram extraídos para shared/currency.
  // Mantidos aqui como delegadores para compatibilidade com testes e código legado.
  static toCents(value: number): number { return toCents(value); }
  static fromCents(cents: number): number { return fromCents(cents); }

  /**
   * Calcula as métricas de um orçamento individual
   */
  static getMetrics(
    spent: number,
    limit: number,
    dayOfMonth: number,
    daysInMonth: number
  ): BudgetMetrics {
    const sCents = toCents(spent);
    const lCents = toCents(limit);

    // Guard against invalid mathematical states
    if (!Number.isFinite(sCents) || !Number.isFinite(lCents)) {
      throw new Error("Invalid numeric input: spent or limit is not a finite number.");
    }

    const remainingCents = lCents - sCents;
    
    const percentage = lCents > 0 ? (sCents / lCents) : 0;
    const monthElapsedPct = (daysInMonth > 0) ? (dayOfMonth / daysInMonth) : 0;

    // Pace Index: > 1.0 means spending faster than time elapsed (relative to budget)
    const paceIndex = monthElapsedPct > 0 ? percentage / monthElapsedPct : 0;
    
    // Simple linear projection: (spent / day) * totalDays
    const dailyRateCents = dayOfMonth > 0 ? sCents / dayOfMonth : 0;
    const projectedSpendCents = dailyRateCents * daysInMonth;
    
    const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
    const dailyAllowanceCents = daysRemaining > 0 ? Math.max(0, remainingCents / daysRemaining) : 0;
    
    const daysToBreak = dailyRateCents > 0 ? Math.floor(remainingCents / dailyRateCents) : 999;

    let status: BudgetMetrics["status"] = "safe";
    if (sCents > lCents) status = "over";
    else if (paceIndex > 1.25) status = "critical";
    else if (paceIndex > 1.1) status = "warning";

    return {
      spent,
      limit,
      remaining: fromCents(remainingCents),
      percentage: percentage * 100,
      paceIndex,
      projectedSpend: fromCents(projectedSpendCents),
      dailyAllowance: fromCents(dailyAllowanceCents),
      daysToBreak,
      status,
    };
  }

  /**
   * Calcula o 'Ready to Assign' (RTA) — Coração do Zero-Based Budgeting
   */
  static calculateRTA(income: number, budgets: Budget[]): number {
    const iCents = toCents(income);
    const bCents = budgets.reduce((acc, b) => acc + toCents(b.limit), 0);
    return fromCents(iCents - bCents);
  }

  /**
   * Returns the current month's calendar context for budget calculations.
   * Single Source of Truth — eliminates duplicated date logic across UI components.
   */
  static getCalendarContext(date: Date = new Date()): {
    dayOfMonth: number;
    daysInMonth: number;
    daysRemaining: number;
    monthElapsedPct: number;
  } {
    const dayOfMonth = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
    const monthElapsedPct = daysInMonth > 0 ? dayOfMonth / daysInMonth : 0;
    return { dayOfMonth, daysInMonth, daysRemaining, monthElapsedPct };
  }

  /**
   * Returns the current local month in YYYY-MM format.
   * Eliminates the timezone offset bug from new Date().toISOString()
   */
  static getCurrentLocalMonth(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Analisa a distribuição conforme a regra 50/30/20
   */
  static analyzeRule503020(budgets: Budget[], income: number) {
    const totalCents = toCents(income);
    if (totalCents === 0) return null;

    const sections = {
      necessity: 0,
      want: 0,
      investment: 0,
    };

    budgets.forEach(b => {
      const cents = toCents(b.limit);
      if (b.classification === "necessity") sections.necessity += cents;
      else if (b.classification === "want") sections.want += cents;
      else if (b.classification === "investment" || b.category === "Investimentos") sections.investment += cents;
    });

    return {
      necessities: (sections.necessity / totalCents) * 100,
      wants: (sections.want / totalCents) * 100,
      savings: (sections.investment / totalCents) * 100,
    };
  }
}

