import { FinancialHealthCard } from "@/components/personal/FinancialHealthCard";
import { PredictionsCard } from "@/components/personal/PredictionsCard";
import { SmartInsights } from "@/components/personal/SmartInsights";
import type { SavingsGoal, Transaction } from "@/types";

interface InsightsTabProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
}

export const InsightsTab = ({ transactions, goals, totals }: InsightsTabProps) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialHealthCard
          transactions={transactions}
          totals={totals}
          showDetails
        />
        <PredictionsCard transactions={transactions} showDetails />
      </div>
      <SmartInsights transactions={transactions} goals={goals} />
    </div>
  );
};
