import { useMemo } from "react";
import { FinanceService, type FireConfig } from "@/services/FinanceService";

export { type FireConfig };

export const useFireCalculation = (config: FireConfig) => {
  const results = useMemo(() => {
    return FinanceService.calculateFire(config);
  }, [
    config,
    config.currentNetWorth,
    config.monthlyExpenses,
    config.monthlyDeposit,
    config.yearlyReturn,
    config.withdrawalRate,
  ]);

  return results;
};
