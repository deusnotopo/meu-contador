/**
 * IntelligenceService
 * ───────────────────
 * Orquestrador central de inteligência financeira.
 * Integra: Monte Carlo, Rules Engine, Regime Detection, Isolation Forest.
 *
 * Princípio de design:
 * - Zero LLM no motor de decisão
 * - Toda decisão tem trace auditável (LGPD-proof)
 * - Regimes financeiros alimentam regras contextuais
 */

import { db } from "../lib/db.js";
import * as TransactionRepository from "../repositories/TransactionRepository.js";
import * as InvestmentRepository from "../repositories/InvestmentRepository.js";
import * as DebtRepository from "../repositories/DebtRepository.js";
import { MonteCarloService } from "./MonteCarloService.js";
import { evaluate as evaluateRules, buildFactsFromIntelligence, RuleDecision } from "./RulesEngineService.js";
import { detectRegime, MonthlyObservation, RegimeResult } from "./RegimeDetectionService.js";
import { IsolationForestService, TransactionFeature, AnomalyScore } from "./IsolationForestService.js";

export interface DashboardIntelligence {
  wealthSurvivalDays: number;
  fireProgress: number;            // 0–100
  yearsToFire: number;
  monthlyAvgExpenses: number;      // R$
  monthlyAvgSurplus: number;       // R$
  opportunityCost10yr: number;     // R$
  // Financial State (Orquestrado)
  netWorth: number;                // R$
  assets: number;                 // R$
  liabilities: number;           // R$
  // Legacy (mantido para compatibilidade)
  optimizationTips: string[];
  // Camada Cognitiva
  decisions: RuleDecision[];       // decisões auditáveis com trace
  regime: RegimeResult | null;     // regime financeiro atual
}

const FIRE_WITHDRAWAL_RATE = 0.04; // 4% Rule

export async function getDashboardSummary(userId: string): Promise<DashboardIntelligence> {
  // 1. Gather raw data via standardized Repositories
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [user, recentTx, investments, debts, incomeSum, expenseSum] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: ninetyDaysAgo } },
      select: { type: true, amount: true, classification: true, date: true },
    }),
    db.investment.findMany({ where: { userId, deletedAt: null }, select: { amount: true, currentPrice: true } }),
    db.debt.findMany({ where: { userId, deletedAt: null }, select: { balance: true } }),
    // Cash balance: income vs expense aggregates (all-time)
    db.transaction.aggregate({ where: { userId, deletedAt: null, type: 'income' }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { userId, deletedAt: null, type: 'expense' }, _sum: { amount: true } }),
  ]);

  if (!user) throw new Error("User not found");

  // Real cash balance based on full transaction history
  const cashBalanceCents = (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);

  // 2. Metricas Mensais (Last 90 days)
  const expenses = recentTx.filter(tx => tx.type === 'expense');
  const totalExpensesCents = expenses.reduce((acc, tx) => acc + tx.amount, 0);
  
  // Real moving average (handles less than 90 days of data, min 30 days to avoid spikes)
  const oldestExpenseDate = expenses.length > 0 
    ? expenses.reduce((min, tx) => tx.date < min ? tx.date : min, new Date()) 
    : new Date();
  const daysActive = Math.max(30, Math.min(90, (Date.now() - oldestExpenseDate.getTime()) / (1000 * 60 * 60 * 24)));
  const monthlyAvgExpensesCents = (totalExpensesCents / daysActive) * 30;

  const income = recentTx.filter(tx => tx.type === 'income');
  const totalIncomeCents = income.reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyAvgIncomeCents = (totalIncomeCents / daysActive) * 30;
  const monthlyAvgSurplusCents = Math.max(0, monthlyAvgIncomeCents - monthlyAvgExpensesCents);

  // 3. Liquidez e Patrimônio
  const bankAssetsCents = cashBalanceCents > 0 ? cashBalanceCents : 0;
  const bankLiabilitiesCents = cashBalanceCents < 0 ? Math.abs(cashBalanceCents) : 0;

  const totalInvestedCents = investments.reduce((acc, inv) => acc + (inv.amount * inv.currentPrice), 0);
  const totalDebtCents = debts.reduce((acc, d) => acc + d.balance, 0);

  const assetsCents = bankAssetsCents + totalInvestedCents;
  const liabilitiesCents = totalDebtCents + bankLiabilitiesCents;
  const netWorthCents = assetsCents - liabilitiesCents;

  // 4. Survivability (Days of survival using liquid assets vs daily burn rate)
  const dailyBurnRateCents = monthlyAvgExpensesCents / 30;
  const wealthSurvivalDays = dailyBurnRateCents > 0 ? Math.floor(netWorthCents / dailyBurnRateCents) : 0;

  // 5. FIRE Calculation (4% Rule)
  const annualExpensesCents = monthlyAvgExpensesCents * 12;
  const fireTargetCents = annualExpensesCents > 0 ? annualExpensesCents / FIRE_WITHDRAWAL_RATE : 1;
  const fireProgress = Math.min(100, Math.max(0, (netWorthCents / fireTargetCents) * 100));

  const annualSavingsCents = monthlyAvgSurplusCents * 12;
  const yearsToFire = annualSavingsCents > 0 ? Math.max(0, (fireTargetCents - netWorthCents) / annualSavingsCents) : Infinity;

  // 6. Opportunity Cost (Want classification spending)
  const wantSpendingCents = expenses
    .filter(tx => tx.classification === 'want')
    .reduce((acc, tx) => acc + tx.amount, 0) / 3;
  const opportunityCost10yrCents = wantSpendingCents * 12 * 10 * 1.5;

  // 7. Regime Detection
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const historicalTx = await db.transaction.findMany({
    where: { userId, deletedAt: null, date: { gte: twelveMonthsAgo } },
    select: { type: true, amount: true, date: true },
  });

  const monthlyMap: Record<string, MonthlyObservation> = {};
  for (const tx of historicalTx) {
    const monthKey = tx.date.toISOString().slice(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, totalIncomeCents: 0, totalExpenseCents: 0 };
    }
    if (tx.type === 'income') monthlyMap[monthKey].totalIncomeCents += tx.amount;
    if (tx.type === 'expense') monthlyMap[monthKey].totalExpenseCents += tx.amount;
  }
  const monthlyObs = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  const regime = monthlyObs.length >= 3 ? detectRegime(monthlyObs) : null;

  // 8. Rules Engine
  const facts = buildFactsFromIntelligence({
    totalDebtCents: liabilitiesCents,
    totalInvestedCents: assetsCents,
    wealthSurvivalDays,
    fireProgress,
    monthlyAvgExpensesCents,
    monthlyAvgIncomeCents,
    monthlyAvgSurplusCents,
    wantSpendingCents,
    regime: regime ? { current: regime.currentRegime, daysInRegime: regime.daysInRegime } : undefined,
  });
  const decisions = await evaluateRules(facts);

  return {
    wealthSurvivalDays,
    fireProgress: parseFloat(fireProgress.toFixed(2)),
    yearsToFire: yearsToFire === Infinity ? 999 : parseFloat(yearsToFire.toFixed(1)),
    monthlyAvgExpenses: monthlyAvgExpensesCents / 100,
    monthlyAvgSurplus: monthlyAvgSurplusCents / 100,
    opportunityCost10yr: opportunityCost10yrCents / 100,
    netWorth: netWorthCents / 100,
    assets: assetsCents / 100,
    liabilities: liabilitiesCents / 100,
    optimizationTips: decisions.filter(d => d.priority === 'critical' || d.priority === 'high').map(d => d.message),
    decisions,
    regime,
  };
}


export interface SimulationParams {
  additionalMonthlyDeposit: number;
  expectedAnnualYield: number;
  horizonYears: number;
}

export interface SimulationResult {
  timeline: { month: number; balance: number; fireProgress: number }[];
  monteCarlo: { month: number; p5: number; p50: number; p95: number }[];
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

  // 1. Projeção Linear (Base)
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

  // 2. Projeção Probabilística (Monte Carlo)
  const mcService = new MonteCarloService();
  const mcResultsCents = mcService.simulate({
    initialCapital: currentPrincipal,
    monthlyContribution: monthlyDeposit,
    years: params.horizonYears,
    expectedAnnualReturn: params.expectedAnnualYield / 100,
    annualVolatility: 0.12, // Exemplo: 12% de volatilidade padrão
    iterations: 1000
  });

  // Converter centavos para R$ para o frontend
  const monteCarlo = mcResultsCents.map(r => ({
    month: r.month,
    p5: Math.round(r.p5 / 100),
    p50: Math.round(r.p50 / 100),
    p95: Math.round(r.p95 / 100)
  }));

  return {
    timeline,
    monteCarlo,
    finalBalance: Math.round(currentBalance / 100),
    yearsToFireDelta: 0,
  };
}

// ── Anomaly Detection Engine (Isolation Forest) ────────────────────────────────

const NOTIFICATION_COOLDOWN_HOURS = 24; // Prevent duplicate alerts

export async function detectAnomalies(
  userId: string
): Promise<AnomalyScore[]> {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Fetch current month + historical transactions in one query
  const allTx = await db.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      deletedAt: null,
      date: { gte: ninetyDaysAgo },
    },
    select: { id: true, category: true, amount: true, date: true, recurring: true },
  });

  const features: TransactionFeature[] = allTx.map(tx => {
    const d = new Date(tx.date);
    return {
      id: tx.id,
      category: tx.category || 'Outros',
      amountCents: tx.amount,
      dayOfMonth: d.getDate(),
      dayOfWeek: d.getDay(),
      monthOfYear: d.getMonth() + 1,
      isRecurring: tx.recurring ?? false,
    };
  });

  const historical = features.filter(f => {
    const tx = allTx.find(t => t.id === f.id);
    return tx!.date < startOfCurrentMonth;
  });

  const current = features.filter(f => {
    const tx = allTx.find(t => t.id === f.id);
    return tx!.date >= startOfCurrentMonth;
  });

  const forest = new IsolationForestService();
  return forest.detectAnomalies(historical, current);
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

    const currentFmt = (anomaly.amountCents / 100).toFixed(2);

    await notifyUser(userId, {
      type: NotificationType.SPENDING_ANOMALY,
      title: `⚡ Anomalia Detectada: ${anomaly.category}`,
      message: `${anomaly.reason} (Transação de R$\u00a0${currentFmt})`,
      data: { category: anomaly.category, score: anomaly.anomalyScore, current: anomaly.amountCents },
    });
  }
}

export async function queueProactiveAnalysis(userId: string): Promise<{ jobId: string }> {
  const jobId = `analysis:${userId}:${Date.now()}`;

  void runProactiveAnalysis(userId).catch((err) => {
    console.error('[Intelligence] Proactive analysis failed', { jobId, userId, error: err });
  });

  return { jobId };
}
