import { BudgetsSection } from "@/components/personal/BudgetsSection";
import type { Transaction } from "@/types";

interface BudgetsTabProps {
  transactions: Transaction[];
}

export const BudgetsTab = ({ transactions }: BudgetsTabProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <BudgetsSection transactions={transactions} />
    </div>
  );
};
