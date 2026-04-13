import { useMemo } from "react";

export interface FireConfig {
  currentNetWorth: number;
  monthlyExpenses: number;
  monthlyDeposit: number;
  yearlyReturn: number;
  withdrawalRate: number;
}

export const useFireCalculation = (config: FireConfig) => {
  const { currentNetWorth, monthlyExpenses, monthlyDeposit, yearlyReturn, withdrawalRate } = config;

  const results = useMemo(() => {
    const monthlyRate = Math.pow(1 + yearlyReturn / 100, 1 / 12) - 1;
    
    // Withdrawal multiplier (ex: 3.2% = 31.25 years of expenses)
    const withdrawalMultiplier = 1 / withdrawalRate;
    
    const leanFireMonthly = monthlyExpenses * 0.6; // 60%
    const baseFireMonthly = monthlyExpenses;       // 100%
    const fatFireMonthly = monthlyExpenses * 1.8;  // 180%
    
    const leanTarget = leanFireMonthly * 12 * withdrawalMultiplier;
    const baseTarget = baseFireMonthly * 12 * withdrawalMultiplier;
    const fatTarget = fatFireMonthly * 12 * withdrawalMultiplier;
  
    const calculateMonths = (target: number) => {
      if (target === 0) return Infinity;
      if (currentNetWorth >= target) return 0;
      if (monthlyRate === 0) {
        return monthlyDeposit > 0 ? (target - currentNetWorth) / monthlyDeposit : Infinity;
      }
      
      let balance = currentNetWorth;
      let months = 0;
      while (balance < target && months < 1200) { // cap at 100 years
        balance = balance * (1 + monthlyRate) + monthlyDeposit;
        months++;
      }
      return months;
    };
  
    return {
      targets: {
        lean: leanTarget,
        base: baseTarget,
        fat: fatTarget
      },
      months: {
        lean: calculateMonths(leanTarget),
        base: calculateMonths(baseTarget),
        fat: calculateMonths(fatTarget)
      },
      safeWithdrawals: {
        lean: leanFireMonthly,
        base: baseFireMonthly,
        fat: fatFireMonthly
      }
    };
  }, [currentNetWorth, monthlyExpenses, monthlyDeposit, yearlyReturn, withdrawalRate]);

  return results;
};
