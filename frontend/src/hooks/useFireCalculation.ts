import { useMemo } from "react";
import { FinanceService, type FireConfig } from "@/services/FinanceService";

export { type FireConfig };

export const useFireCalculation = (config: FireConfig) => {
  const results = useMemo(() => {
    return FinanceService.calculateFire(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Depend on individual primitive fields to avoid re-running on unrelated object reference changes
    config.currentNetWorth,
    config.monthlyExpenses,
    config.monthlyDeposit,
    config.yearlyReturn,
    config.withdrawalRate,
  ]);

  return results;
};
