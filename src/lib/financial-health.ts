import type { Transaction } from "@/types";

export type FinancialClassification =
  | "necessity"
  | "want"
  | "investment"
  | "debt";

export interface FinancialHealthScore {
  score: number;
  savingsRate: number;
  expenseCoverage: number; // Liquidity (Months of coverage)
  rule503020: {
    necessity: { value: number; percentage: number };
    want: { value: number; percentage: number };
    investment: { value: number; percentage: number };
    debt: { value: number; percentage: number };
  };
  dti: number; // Debt-to-Income ratio
  details: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export const CLASSIFICATION_MAP: Record<string, FinancialClassification> = {
  // Necessities
  Alimentação: "necessity",
  Saúde: "necessity",
  Educação: "necessity",
  Moradia: "necessity",
  Transporte: "necessity",
  Contas: "necessity",

  // Wants
  Lazer: "want",
  Compras: "want",
  Restaurantes: "want",
  Viagem: "want",
  Assinaturas: "want",

  // Investments
  Investimento: "investment",
  Poupança: "investment",

  // Debt
  Dívidas: "debt",
  Empréstimo: "debt",
};

export const getDefaultClassification = (
  category: string
): FinancialClassification => {
  return CLASSIFICATION_MAP[category] || "want";
};

export const getClassification = (t: Transaction): FinancialClassification => {
  if (t.classification) return t.classification;
  return CLASSIFICATION_MAP[t.category] || "want"; // Default to 'want' if unknown, conservative aproach
};

export const calculateFinancialHealth = (
  transactions: Transaction[],
  totals: { income: number; expense: number; balance: number }
): FinancialHealthScore => {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  const rule503020 = {
    necessity: { value: 0, percentage: 0 },
    want: { value: 0, percentage: 0 },
    investment: { value: 0, percentage: 0 },
    debt: { value: 0, percentage: 0 },
  };

  expenses.forEach((t) => {
    const cls = getClassification(t);
    rule503020[cls].value += t.amount;
  });

  if (totalExpense > 0) {
    rule503020.necessity.percentage =
      (rule503020.necessity.value / totalExpense) * 100;
    rule503020.want.percentage = (rule503020.want.value / totalExpense) * 100;
    rule503020.investment.percentage =
      (rule503020.investment.value / totalExpense) * 100;
    rule503020.debt.percentage = (rule503020.debt.value / totalExpense) * 100;
  }

  // 1. Savings Rate (Target: 20%+)
  // We use max(0, balance) because negative balance doesn't mean negative savings rate in this context, it means 0.
  const effectiveSavings = Math.max(0, totals.balance);
  const savingsRate =
    totals.income > 0 ? (effectiveSavings / totals.income) * 100 : 0;
  const savingsScore = Math.min(100, Math.max(0, (savingsRate / 20) * 100));

  // 2. Liquidity / Solvency Check (Target: Income > Expenses * 1.1 buffer)
  const expenseCoverage =
    totals.expense > 0 ? totals.income / totals.expense : 2;
  // If coverage < 0.8 (spending 125% of income), score is 0.
  // If coverage >= 1.2 (spending 83% of income), score maxes out.
  const liquidityScore = Math.min(
    100,
    Math.max(0, ((expenseCoverage - 0.8) / (1.2 - 0.8)) * 100)
  );

  // 3. Weighted Score
  // 40% Savings Rate, 60% Liquidity/Control
  const score = savingsScore * 0.4 + liquidityScore * 0.6;

  // 4. DTI (Debt-to-Income) Ratio
  const debtService = rule503020.debt.value;
  const dti = totals.income > 0 ? (debtService / totals.income) * 100 : 0;

  return {
    score,
    savingsRate,
    expenseCoverage,
    dti,
    rule503020,
    details: totals,
  };
};
