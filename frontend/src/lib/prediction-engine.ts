import type { SpendingPrediction, Transaction } from "@/types";

/**
 * Calculates the simple linear regression of a dataset.
 * Returns the slope (m) and y-intercept (b) for y = mx + b.
 * x: Day of month (1-31)
 * y: Cumulative Balance / Spending
 */
export const linearRegression = (
  data: { x: number; y: number }[]
): { slope: number; intercept: number; r2: number } => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
    sumYY += point.y * point.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Correlation Coefficient (R) calculation for R²
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
  );
  const r2 = denominator === 0 ? 0 : Math.pow(numerator / denominator, 2);

  return { slope, intercept, r2 };
};

/**
 * Predicts the end-of-month balance based on current month's daily balance trend.
 */
export const predictEndOfMonthBalance = (
  transactions: Transaction[],
  currentBalance: number
): { predictedBalance: number; confidence: number } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysPassed = now.getDate();

  // If we are very early in the month (e.g., < 5 days), prediction is unreliable.
  // We just return current + (avg daily * remaining).
  // But let's stick to regression for consistency.

  // 1. Build cumulative daily balance map for the current month
  const dailyBalances: { x: number; y: number }[] = [];
  // const runningBalance = currentBalance; // Unused
  // Ideally, we need to reconstruct the balance history.
  // For simplicity, let's assume 'transactions' are ALL transactions.
  // We need to filter for current month transactions to see the FLOW.

  // Helper: Get transactions for this month ONLY
  const thisMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calculate starting balance of the month
  // Start = Current - (Income - Expense) of this month
  const monthIncome = thisMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = thisMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const startOfMonthBalance = currentBalance - (monthIncome - monthExpense);

  // 2. Simulate day-by-day cumulative balance
  let simBalance = startOfMonthBalance;
  // Initialize day 0 (start of month)
  dailyBalances.push({ x: 0, y: startOfMonthBalance });

  // Map transactions to days
  const transactionsByDay: Record<number, number> = {};
  thisMonthTransactions.forEach((t) => {
    const day = new Date(t.date).getDate();
    const amount = t.type === "income" ? t.amount : -t.amount;
    transactionsByDay[day] = (transactionsByDay[day] || 0) + amount;
  });

  // Fill data points up to today
  for (let day = 1; day <= daysPassed; day++) {
    simBalance += transactionsByDay[day] || 0;
    dailyBalances.push({ x: day, y: simBalance });
  }

  // 3. Perform Regression
  const { slope, intercept, r2 } = linearRegression(dailyBalances);

  // 4. Forecast for the last day of the month
  const predictedBalance = slope * totalDaysInMonth + intercept;

  return {
    predictedBalance,
    confidence: r2 * 100, // 0-100 score
  };
};

/**
 * Analyzes spending categories to find anomalies or trends.
 */
export const getCategoryPredictions = (
  transactions: Transaction[]
): SpendingPrediction[] => {
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

  // Group by Category
  const currentMonthTotals: Record<string, number> = {};
  const lastMonthTotals: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.type !== "expense") return;

    const tMonth = t.date.slice(0, 7);
    if (tMonth === currentMonthStr) {
      currentMonthTotals[t.category] =
        (currentMonthTotals[t.category] || 0) + t.amount;
    } else if (tMonth === lastMonthStr) {
      lastMonthTotals[t.category] =
        (lastMonthTotals[t.category] || 0) + t.amount;
    }
  });

  const predictions: SpendingPrediction[] = [];

  // Analyze each category active this month
  Object.keys(currentMonthTotals).forEach((category) => {
    const current = currentMonthTotals[category];
    const last = lastMonthTotals[category] || 0;

    // Simple Linear Projection for end of month
    // Projected = (Current / DaysPassed) * TotalDays
    const daysPassed = now.getDate();
    const totalDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const projected = Math.max(0, (current / daysPassed) * totalDays); // Simple heuristic

    // Determine Trend
    let trend: "up" | "down" | "stable" = "stable";
    let percentChange = 0;

    if (last > 0) {
      percentChange = ((projected - last) / last) * 100;
      if (percentChange > 10) trend = "up";
      else if (percentChange < -10) trend = "down";
    } else if (projected > 0) {
      trend = "up";
      percentChange = 100; // New spending
    }

    predictions.push({
      category,
      predictedAmount: projected,
      lastMonthAmount: last,
      trend,
      percentChange,
    });
  });

  return predictions.sort((a, b) => b.predictedAmount - a.predictedAmount);
};
