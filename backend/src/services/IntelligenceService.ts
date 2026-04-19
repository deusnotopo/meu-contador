/**
 * IntelligenceService
 * ───────────────────
 * Centralizes financial engineering and logic.
 * Calculates FIRE progress, survivability, and optimization tips.
 */

import { db } from "../lib/db.js";
import * as TransactionRepository from "../repositories/TransactionRepository.js";
import * as InvestmentRepository from "../repositories/InvestmentRepository.js";
import * as DebtRepository from "../repositories/DebtRepository.js";

export interface DashboardIntelligence {
  wealthSurvivalDays: number;
  fireProgress: number; // percentage 0-100
  yearsToFire: number;
  monthlyAvgExpenses: number;
  monthlyAvgSurplus: number;
  opportunityCost10yr: number;
  optimizationTips: string[];
}

const FIRE_WITHDRAWAL_RATE = 0.04; // 4% Rule

export async function getDashboardSummary(userId: string): Promise<DashboardIntelligence> {
  // 1. Gather raw data via standardized Repositories (already formatted cents → R$)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [user, txPage, investments, debts] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    // Use raw query for date-filtered lookup (Repository doesn't expose date filter yet)
    db.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: ninetyDaysAgo } },
      select: { type: true, amount: true, classification: true },
    }),
    db.investment.findMany({ where: { userId, deletedAt: null }, select: { amount: true, currentPrice: true } }),
    db.debt.findMany({ where: { userId, deletedAt: null }, select: { balance: true } }),
  ]);

  if (!user) throw new Error("User not found");

  // 2. Calculate Monthly Average Expenses (Last 3 months)
  // NOTE: amounts from db are in CENTS, convert to R$ for output
  const expenses = txPage.filter(tx => tx.type === 'expense');
  const totalExpensesCents = expenses.reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyAvgExpensesCents = totalExpensesCents / 3;

  // 3. Calculate Monthly Average Income
  const income = txPage.filter(tx => tx.type === 'income');
  const totalIncomeCents = income.reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyAvgIncomeCents = totalIncomeCents / 3;

  const monthlyAvgSurplusCents = Math.max(0, monthlyAvgIncomeCents - monthlyAvgExpensesCents);

  // 4. Calculate Liquid Assets (prices stored in cents per unit)
  const totalInvestedCents = investments.reduce((acc, inv) => acc + (inv.amount * inv.currentPrice), 0);
  const totalDebtCents = debts.reduce((acc, d) => acc + d.balance, 0);

  // 5. Survivability (Days of survival using liquid assets vs daily burn rate)
  const dailyBurnRateCents = monthlyAvgExpensesCents / 30;
  const wealthSurvivalDays = dailyBurnRateCents > 0 ? Math.floor(totalInvestedCents / dailyBurnRateCents) : 0;

  // 6. FIRE Calculation (4% Rule)
  const annualExpensesCents = monthlyAvgExpensesCents * 12;
  const fireTargetCents = annualExpensesCents > 0 ? annualExpensesCents / FIRE_WITHDRAWAL_RATE : 1;
  const fireProgress = Math.min(100, (totalInvestedCents / fireTargetCents) * 100);

  // Years to FIRE = (Target - Current) / Annual Saving
  const annualSavingsCents = monthlyAvgSurplusCents * 12;
  const yearsToFire = annualSavingsCents > 0 ? (fireTargetCents - totalInvestedCents) / annualSavingsCents : Infinity;

  // 7. Opportunity Cost (Want classification spending)
  const wantSpendingCents = expenses
    .filter(tx => tx.classification === 'want')
    .reduce((acc, tx) => acc + tx.amount, 0) / 3;

  // Future Value at ~5% real return over 10 years (simplified multiplier 1.5x)
  const opportunityCost10yrCents = wantSpendingCents * 12 * 10 * 1.5;

  // 8. Dynamic Tips
  const tips: string[] = [];
  if (totalDebtCents > totalInvestedCents) tips.push("⚠️ Suas dívidas superam seus investimentos. Priorize a quitação de juros altos.");
  if (fireProgress > 50) tips.push("🔥 Você já percorreu mais da metade do caminho para a Liberdade Financeira!");
  if (wealthSurvivalDays < 180) tips.push("🛡️ Seu Fator de Sobrevivência está abaixo de 6 meses. Considere fortalecer sua reserva.");

  return {
    wealthSurvivalDays,
    fireProgress: parseFloat(fireProgress.toFixed(2)),
    yearsToFire: yearsToFire === Infinity ? 999 : parseFloat(yearsToFire.toFixed(1)),
    monthlyAvgExpenses: monthlyAvgExpensesCents / 100, // Return in R$ for FE
    monthlyAvgSurplus: monthlyAvgSurplusCents / 100,
    opportunityCost10yr: opportunityCost10yrCents / 100,
    optimizationTips: tips,
  };
}


export interface SimulationParams {
  additionalMonthlyDeposit: number;
  expectedAnnualYield: number;
  horizonYears: number;
}

export interface SimulationResult {
  timeline: { month: number; balance: number; fireProgress: number }[];
  finalBalance: number;
  yearsToFireDelta: number;
}

export async function calculateProjection(userId: string, params: SimulationParams): Promise<SimulationResult> {
  const [investments, transactions] = await Promise.all([
    db.investment.findMany({ where: { userId, deletedAt: null } }),
    db.transaction.findMany({ where: { userId, deletedAt: null, type: 'expense', date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }),
  ]);

  const currentPrincipal = investments.reduce((acc, inv) => acc + (inv.amount * inv.currentPrice), 0);
  const monthlyExpenses = transactions.reduce((acc, tx) => acc + tx.amount, 0) / 3;
  const annualExpenses = monthlyExpenses * 12;
  const fireTarget = annualExpenses > 0 ? annualExpenses / FIRE_WITHDRAWAL_RATE : 1;

  const monthlyDeposit = params.additionalMonthlyDeposit * 100; // to cents
  const monthlyRate = Math.pow(1 + params.expectedAnnualYield / 100, 1 / 12) - 1;
  const totalMonths = params.horizonYears * 12;

  const timeline: { month: number; balance: number; fireProgress: number }[] = [];
  let currentBalance = currentPrincipal;

  for (let m = 0; m <= totalMonths; m++) {
    timeline.push({
      month: m,
      balance: Math.round(currentBalance / 100),
      fireProgress: parseFloat(Math.min(100, (currentBalance / fireTarget) * 100).toFixed(2))
    });

    currentBalance = currentBalance * (1 + monthlyRate) + monthlyDeposit;
  }

  // Calculate years to FIRE delta (simple estimate)
  return {
    timeline,
    finalBalance: Math.round(currentBalance / 100),
    yearsToFireDelta: 0, // Logic for delta can be more complex, keeping it 0 for now
  };
}

// ── Anomaly Detection Engine ─────────────────────────────────────────────────
// Uses a 1.5x spike threshold: if current-month spending in any category
// exceeds the 90-day average by 50% or more, it's flagged as an anomaly.
// This gives early warning without triggering on normal daily variance.

const ANOMALY_SPIKE_MULTIPLIER = 1.5;
const NOTIFICATION_COOLDOWN_HOURS = 24; // Prevent duplicate alerts

export interface AnomalyResult {
  category: string;
  currentMonthAmount: number;    // In cents
  historicalAverage: number;     // In cents (monthly avg)
  spikeMultiplier: number;       // e.g. 2.1 = 210% of average
  detected: boolean;
}

export async function detectAnomalies(
  userId: string
): Promise<AnomalyResult[]> {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Fetch current month + historical transactions in one query
  const allTransactions = await db.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      deletedAt: null,
      date: { gte: ninetyDaysAgo },
    },
    select: { category: true, amount: true, date: true },
  });

  // Split current month vs. historical (prior months)
  const currentMonthTx = allTransactions.filter(tx => tx.date >= startOfCurrentMonth);
  const historicalTx = allTransactions.filter(tx => tx.date < startOfCurrentMonth);

  // Group by category
  const categories = [...new Set(allTransactions.map(tx => tx.category))];
  const results: AnomalyResult[] = [];

  for (const category of categories) {
    const currentTotal = currentMonthTx
      .filter(tx => tx.category === category)
      .reduce((acc, tx) => acc + tx.amount, 0);

    const historicalTotal = historicalTx
      .filter(tx => tx.category === category)
      .reduce((acc, tx) => acc + tx.amount, 0);

    // Average over 2 months (historical window is up to 2 months before current month)
    const historicalMonths = 2;
    const historicalAvg = historicalTotal / historicalMonths;

    if (historicalAvg === 0) continue; // Not enough data to compare

    const spike = currentTotal / historicalAvg;

    results.push({
      category,
      currentMonthAmount: currentTotal,
      historicalAverage: historicalAvg,
      spikeMultiplier: parseFloat(spike.toFixed(2)),
      detected: spike >= ANOMALY_SPIKE_MULTIPLIER,
    });
  }

  return results.filter(r => r.detected);
}

export async function runProactiveAnalysis(userId: string): Promise<void> {
  const { notifyUser } = await import("./NotificationService.js");
  const { NotificationType } = await import("../lib/ws-manager.js");

  const anomalies = await detectAnomalies(userId);

  for (const anomaly of anomalies) {
    // Check cooldown: avoid re-alerting within 24h for the same category
    const recentAlert = await db.notification.findFirst({
      where: {
        userId,
        type: NotificationType.SPENDING_ANOMALY,
        createdAt: { gte: new Date(Date.now() - NOTIFICATION_COOLDOWN_HOURS * 60 * 60 * 1000) },
        body: { contains: anomaly.category },
      },
    });

    if (recentAlert) continue; // Cooldown active

    const pct = Math.round((anomaly.spikeMultiplier - 1) * 100);
    const currentFmt = (anomaly.currentMonthAmount / 100).toFixed(2);
    const avgFmt = (anomaly.historicalAverage / 100).toFixed(2);

    await notifyUser(userId, {
      type: NotificationType.SPENDING_ANOMALY,
      title: `⚡ Pico de Gastos: ${anomaly.category}`,
      message: `Você gastou R$\u00a0${currentFmt} em ${anomaly.category} este mês — ${pct}% acima da média (R$\u00a0${avgFmt}/mês).`,
      data: { category: anomaly.category, spike: anomaly.spikeMultiplier, current: anomaly.currentMonthAmount, avg: anomaly.historicalAverage },
    });
  }
}
