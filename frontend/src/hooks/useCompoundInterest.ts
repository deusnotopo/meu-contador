import { useMemo } from "react";

export interface CompoundInterestConfig {
  monthlyDeposit: number;  // Aporte mensal
  annualRate: number;       // Taxa anual em %
  years: number;            // Número de anos
  initialAmount?: number;   // Valor inicial (patrimônio atual, opcional)
}

export interface CompoundInterestResult {
  total: number;            // Patrimônio final projetado
  invested: number;         // Total aportado
  yield: number;            // Rendimento total (total - invested)
  yieldRatio: number;       // % de rendimento sobre total
  chartPoints: number[];    // Array de valores por ano (para gráfico)
  yearlyBreakdown: { year: number; value: number; invested: number; yield: number }[];
}

export const useCompoundInterest = (config: CompoundInterestConfig): CompoundInterestResult => {
  const { monthlyDeposit, annualRate, years, initialAmount = 0 } = config;

  const result = useMemo(() => {
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const months = years * 12;

    // FV of initial amount + FV of monthly annuity
    const fvInitial = initialAmount * Math.pow(1 + monthlyRate, months);
    const fvAnnuity = monthlyRate > 0
      ? monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : monthlyDeposit * months;

    const total = fvInitial + fvAnnuity;
    const invested = initialAmount + monthlyDeposit * months;
    const yieldValue = total - invested;
    const yieldRatio = total > 0 ? (yieldValue / total) * 100 : 0;

    // Chart points: one value per year
    const chartPoints: number[] = [];
    for (let y = 1; y <= years; y++) {
      const m = y * 12;
      const fvI = initialAmount * Math.pow(1 + monthlyRate, m);
      const fvA = monthlyRate > 0
        ? monthlyDeposit * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate)
        : monthlyDeposit * m;
      chartPoints.push(Math.round(fvI + fvA));
    }

    // Yearly breakdown for table (at years 5, 10, 15, 20, 25, 30 up to max)
    const milestoneYears = [5, 10, 15, 20, 25, 30].filter(y => y <= years);
    const yearlyBreakdown = milestoneYears.map(y => {
      const m = y * 12;
      const fvI = initialAmount * Math.pow(1 + monthlyRate, m);
      const fvA = monthlyRate > 0
        ? monthlyDeposit * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate)
        : monthlyDeposit * m;
      const value = Math.round(fvI + fvA);
      const inv = Math.round(initialAmount + monthlyDeposit * m);
      return {
        year: y,
        value,
        invested: inv,
        yield: value - inv,
      };
    });

    return { total, invested, yield: yieldValue, yieldRatio, chartPoints, yearlyBreakdown };
  }, [monthlyDeposit, annualRate, years, initialAmount]);

  return result;
};
