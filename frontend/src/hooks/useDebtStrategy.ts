import { useMemo } from "react";
import { useDebts } from "./useDebts";
import { useTransactions } from "./useTransactions";

export interface DebtWithMetrics {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  category: string;
  monthlyInterest: number;
  annualInterest: number;
  monthsToPayoff: number;
  totalInterestPaid: number;
  priority: number;
}

export interface DebtStrategy {
  method: "avalanche" | "snowball";
  debts: DebtWithMetrics[];
  totalDebt: number;
  totalMonthlyPayment: number;
  monthsToFreedom: number;
  totalInterestPaid: number;
  interestSaved: number;
  payoffOrder: { month: number; debtName: string; amount: number }[];
}

export interface DebtInsight {
  type: "warning" | "tip" | "achievement";
  title: string;
  description: string;
  impact?: string;
}

export function useDebtStrategy(extrasMensais: number = 0) {
  const { debts } = useDebts();
  const personal = useTransactions("personal");

  // Calculate metrics for each debt
  const debtsWithMetrics = useMemo((): DebtWithMetrics[] => {
    return debts.map((debt) => {
      const monthlyInterest = debt.balance * (debt.interestRate / 100);
      const annualInterest = debt.interestRate * 12;

      // Calculate months to payoff with minimum payment
      let balance = debt.balance;
      let months = 0;
      let totalInterest = 0;
      const minPay = debt.minPayment ?? 0;

      while (balance > 0 && months < 600) {
        // Max 50 years
        const interest = balance * (debt.interestRate / 100);
        totalInterest += interest;
        balance = balance + interest - minPay;
        months++;

        if (balance > debt.balance * 2) break; // Safety check
      }

      return {
        id: debt.id,
        name: debt.name,
        balance: debt.balance,
        interestRate: debt.interestRate,
        minPayment: debt.minPayment ?? 0,
        category: debt.category,
        monthlyInterest,
        annualInterest,
        monthsToPayoff: months,
        totalInterestPaid: totalInterest,
        priority: 0, // Will be set by strategy
      };
    });
  }, [debts]);

  // Avalanche Method (highest interest first)
  const avalancheStrategy = useMemo((): DebtStrategy => {
    const sorted = [...debtsWithMetrics].sort(
      (a, b) => b.interestRate - a.interestRate,
    );

    let totalInterest = 0;
    let months = 0;
    const payoffOrder: DebtStrategy["payoffOrder"] = [];

    // Simulate payoff
    const simulatedDebts = sorted.map((d) => ({ ...d, remaining: d.balance }));
    let freedUpMinPayments = 0;

    while (simulatedDebts.some((d) => d.remaining > 0) && months < 600) {
      months++;

      let availableExtras = extrasMensais + freedUpMinPayments;

      simulatedDebts.forEach((debt) => {
        if (debt.remaining <= 0) return;

        const interest = debt.remaining * (debt.interestRate / 100);
        totalInterest += interest;

        let payment = debt.minPayment;
        if (availableExtras > 0) {
          payment += availableExtras;
          availableExtras = 0; // The first active debt in the sorted list absorbs all available extras
        }

        if (debt.remaining + interest <= payment) {
          // Debt is paid off this month
          const paymentNeeded = debt.remaining + interest;
          payoffOrder.push({
            month: months,
            debtName: debt.name,
            amount: paymentNeeded,
          });

          // Overflow any remaining payment (modulo minPayment) and permanently add its minPayment to freedUp
          availableExtras += payment - paymentNeeded;
          freedUpMinPayments += debt.minPayment;
          debt.remaining = 0;
        } else {
          debt.remaining = debt.remaining + interest - payment;
        }
      });
    }

    const totalDebt = debtsWithMetrics.reduce((sum, d) => sum + d.balance, 0);
    const totalMonthlyPayment = debtsWithMetrics.reduce(
      (sum, d) => sum + d.minPayment,
      0,
    );

    return {
      method: "avalanche",
      debts: sorted.map((d, i) => ({ ...d, priority: i + 1 })),
      totalDebt,
      totalMonthlyPayment,
      monthsToFreedom: months,
      totalInterestPaid: totalInterest,
      interestSaved: 0, // Calculated below
      payoffOrder,
    };
  }, [debtsWithMetrics, extrasMensais]);

  // Snowball Method (smallest balance first)
  const snowballStrategy = useMemo((): DebtStrategy => {
    const sorted = [...debtsWithMetrics].sort((a, b) => a.balance - b.balance);

    let totalInterest = 0;
    let months = 0;
    const payoffOrder: DebtStrategy["payoffOrder"] = [];

    const simulatedDebts = sorted.map((d) => ({ ...d, remaining: d.balance }));
    let freedUpMinPayments = 0;

    while (simulatedDebts.some((d) => d.remaining > 0) && months < 600) {
      months++;

      let availableExtras = extrasMensais + freedUpMinPayments;

      simulatedDebts.forEach((debt) => {
        if (debt.remaining <= 0) return;

        const interest = debt.remaining * (debt.interestRate / 100);
        totalInterest += interest;

        let payment = debt.minPayment;
        if (availableExtras > 0) {
          payment += availableExtras;
          availableExtras = 0;
        }

        if (debt.remaining + interest <= payment) {
          const paymentNeeded = debt.remaining + interest;
          payoffOrder.push({
            month: months,
            debtName: debt.name,
            amount: paymentNeeded,
          });

          availableExtras += payment - paymentNeeded;
          freedUpMinPayments += debt.minPayment;
          debt.remaining = 0;
        } else {
          debt.remaining = debt.remaining + interest - payment;
        }
      });
    }

    const totalDebt = debtsWithMetrics.reduce((sum, d) => sum + d.balance, 0);
    const totalMonthlyPayment = debtsWithMetrics.reduce(
      (sum, d) => sum + d.minPayment,
      0,
    );

    return {
      method: "snowball",
      debts: sorted.map((d, i) => ({ ...d, priority: i + 1 })),
      totalDebt,
      totalMonthlyPayment,
      monthsToFreedom: months,
      totalInterestPaid: totalInterest,
      interestSaved: 0,
      payoffOrder,
    };
  }, [debtsWithMetrics, extrasMensais]);

  // Calculate interest saved by using best strategy
  const bestStrategy = useMemo(() => {
    if (
      avalancheStrategy.totalInterestPaid < snowballStrategy.totalInterestPaid
    ) {
      return {
        ...avalancheStrategy,
        interestSaved:
          snowballStrategy.totalInterestPaid -
          avalancheStrategy.totalInterestPaid,
      };
    } else {
      return {
        ...snowballStrategy,
        interestSaved:
          avalancheStrategy.totalInterestPaid -
          snowballStrategy.totalInterestPaid,
      };
    }
  }, [avalancheStrategy, snowballStrategy]);

  // Generate insights
  const insights = useMemo((): DebtInsight[] => {
    const result: DebtInsight[] = [];

    if (debtsWithMetrics.length === 0) {
      result.push({
        type: "achievement",
        title: "Parabéns! 🎉",
        description: "Você não tem dívidas registradas. Continue assim!",
      });
      return result;
    }

    // High interest warning
    const highInterestDebts = debtsWithMetrics.filter(
      (d) => d.interestRate > 10,
    );
    if (highInterestDebts.length > 0) {
      const highest = highInterestDebts.reduce((a, b) =>
        a.interestRate > b.interestRate ? a : b,
      );
      result.push({
        type: "warning",
        title: "Juros Altos Detectados",
        description: `"${highest.name}" tem juros de ${highest.interestRate.toFixed(1)}% ao mês. Priorize quitar!`,
        impact: `Você pagará R$ ${highest.totalInterestPaid.toFixed(2)} em juros se pagar apenas o mínimo.`,
      });
    }

    // Total debt warning
    const totalDebt = debtsWithMetrics.reduce((sum, d) => sum + d.balance, 0);
    const monthlyIncome = personal.totals.income;

    if (monthlyIncome > 0) {
      const debtToIncomeRatio = (totalDebt / monthlyIncome) * 100;

      if (debtToIncomeRatio > 200) {
        result.push({
          type: "warning",
          title: "Endividamento Crítico",
          description: `Suas dívidas equivalem a ${debtToIncomeRatio.toFixed(0)}% da sua renda mensal.`,
          impact: "Considere renegociar ou buscar orientação financeira.",
        });
      }
    }

    // Strategy recommendation
    if (bestStrategy.method === "avalanche") {
      result.push({
        type: "tip",
        title: "Método Avalanche Recomendado",
        description: `Quitando primeiro "${bestStrategy.debts[0]?.name}", você economiza R$ ${bestStrategy.interestSaved.toFixed(2)} em juros.`,
      });
    } else {
      result.push({
        type: "tip",
        title: "Método Bola de Neve Recomendado",
        description: `Quitando primeiro "${bestStrategy.debts[0]?.name}", você ganha motivação rápida!`,
      });
    }

    // Credit card warning
    const creditCardDebts = debtsWithMetrics.filter(
      (d) =>
        d.category === "credit_card" || d.name.toLowerCase().includes("cartão"),
    );

    if (creditCardDebts.length > 0) {
      result.push({
        type: "warning",
        title: "Cartão de Crédito Detectado",
        description:
          "O rotativo do cartão tem os maiores juros do Brasil (até 400% a.a.).",
        impact: "Considere empréstimo pessoal para quitar o cartão.",
      });
    }

    return result;
  }, [debtsWithMetrics, bestStrategy, personal.totals.income]);

  // Calculate debt-free date
  const debtFreeDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + bestStrategy.monthsToFreedom);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [bestStrategy.monthsToFreedom]);

  return {
    debtsWithMetrics,
    avalancheStrategy,
    snowballStrategy,
    bestStrategy,
    insights,
    debtFreeDate,
    totalDebt: debtsWithMetrics.reduce((sum, d) => sum + d.balance, 0),
    totalMonthlyInterest: debtsWithMetrics.reduce(
      (sum, d) => sum + d.monthlyInterest,
      0,
    ),
  };
}
