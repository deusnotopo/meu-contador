import { useMemo } from "react";
import { formatCurrency } from "@/lib/formatters";

export interface RetirementConfig {
  currentAge: number;
  retireAge: number;
  monthlyContribution: number;
  expectedReturnPct: number;
  targetMonthlyIncome: number;
  currentNetWorth: number;
}

export function projectWealth(initial: number, monthly: number, annualRate: number, years: number): number[] {
  const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const points: number[] = [];
  let p = initial;
  for (let y = 0; y <= years; y++) {
    points.push(Math.round(p));
    for (let m = 0; m < 12; m++) p = p * (1 + r) + monthly;
  }
  return points;
}

export const useRetirement = (config: RetirementConfig) => {
  const { currentAge, retireAge, monthlyContribution, expectedReturnPct, targetMonthlyIncome, currentNetWorth } = config;

  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const fireTarget = targetMonthlyIncome * 12 * 25; // 4% Rule
  const monthlyRate = Math.pow(1 + expectedReturnPct / 100, 1 / 12) - 1;
  const monthsToRetire = yearsToRetire * 12;

  const futureValue = useMemo(() => {
    if (monthlyRate === 0) return currentNetWorth + monthlyContribution * monthsToRetire;
    const compoundInitial = currentNetWorth * Math.pow(1 + monthlyRate, monthsToRetire);
    const compoundContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate);
    return compoundInitial + compoundContributions;
  }, [currentNetWorth, monthlyRate, monthsToRetire, monthlyContribution]);

  const isOnTrack = futureValue >= fireTarget;
  const progressToTarget = fireTarget > 0 ? Math.min(100, (futureValue / fireTarget) * 100) : 0;
  const progressColor = isOnTrack ? "var(--green)" : progressToTarget > 60 ? "var(--blue)" : "var(--amber)";

  // Projection chart data — 3 scenarios
  const chartSeries = useMemo(() => [
    {
      label: "Conservador (5%)",
      color: "#FFAB40",
      data: projectWealth(currentNetWorth, monthlyContribution, 5, yearsToRetire),
    },
    {
      label: `Base (${expectedReturnPct}%)`,
      color: "#4A8BFF",
      data: projectWealth(currentNetWorth, monthlyContribution, expectedReturnPct, yearsToRetire),
    },
    {
      label: "Otimista (12%)",
      color: "#22D397",
      data: projectWealth(currentNetWorth, monthlyContribution, 12, yearsToRetire),
    },
  ], [currentNetWorth, monthlyContribution, expectedReturnPct, yearsToRetire]);

  // Dynamic milestones
  const milestones = useMemo(() => {
    const ms: { year: number; label: string; sub: string; color: string }[] = [];
    const r = Math.pow(1 + expectedReturnPct / 100, 1 / 12) - 1;
    let p = currentNetWorth;
    const thresholds = [100000, 500000, 1000000, fireTarget * 0.5, fireTarget];
    const hit = new Set<number>();
    let m = 0;
    
    while (m < yearsToRetire * 12 && hit.size < thresholds.length) {
      p = p * (1 + r) + monthlyContribution;
      m++;
      thresholds.forEach(t => {
        if (!hit.has(t) && p >= t) {
          hit.add(t);
          const yr = new Date().getFullYear() + Math.round(m / 12);
          const fmtT = t >= 1e6 ? `R$ ${(t / 1e6).toFixed(1)}M` : `R$ ${(t / 1000).toFixed(0)}k`;
          ms.push({
            year: yr,
            label: t === fireTarget ? "🔥 Independência Financeira" : `📍 Patrimônio ${fmtT}`,
            sub: t === fireTarget ? `Renda passiva de ${formatCurrency(targetMonthlyIncome)}/mês` : `${Math.round(m / 12)} anos de aporte`,
            color: t === fireTarget ? "var(--green)" : t > 500000 ? "var(--blue)" : "var(--t2)",
          });
        }
      });
    }
    if (ms.length === 0) {
      ms.push({ year: new Date().getFullYear() + yearsToRetire, label: "🎯 Aposentadoria planejada", sub: `Patrimônio: ${formatCurrency(futureValue)}`, color: "var(--blue)" });
    }
    return ms;
  }, [currentNetWorth, monthlyContribution, expectedReturnPct, yearsToRetire, fireTarget, targetMonthlyIncome, futureValue]);

  // Sensitivity table
  const sensitivity = useMemo(() => {
    return [0, 500, 1000, 2000].map(extra => {
      const r = Math.pow(1 + expectedReturnPct / 100, 1 / 12) - 1;
      const ci = currentNetWorth * Math.pow(1 + r, monthsToRetire);
      const cc = (monthlyContribution + extra) * ((Math.pow(1 + r, monthsToRetire) - 1) / (r || 0.001));
      return { extra, total: ci + cc };
    });
  }, [currentNetWorth, monthlyContribution, expectedReturnPct, monthsToRetire]);

  return {
    yearsToRetire,
    fireTarget,
    futureValue,
    isOnTrack,
    progressToTarget,
    progressColor,
    chartSeries,
    milestones,
    sensitivity,
    projectWealth
  };
};
