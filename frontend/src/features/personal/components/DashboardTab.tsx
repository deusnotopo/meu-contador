import { SummaryCards } from "@/components/contador/SummaryCards";
import { TransactionFilters } from "@/components/contador/TransactionFilters";
import { TransactionList } from "@/components/contador/TransactionList";
import { EmergencyFundCard } from "@/components/personal/EmergencyFundCard";
import { FinancialHealthCard } from "@/components/personal/FinancialHealthCard";
import { GlobalAlerts } from "@/components/personal/GlobalAlerts";
import { PredictionsCard } from "@/components/personal/PredictionsCard";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types";
import { FileText } from "lucide-react";

interface DashboardTabProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: "income" | "expense" | "all";
  setFilter: (filter: "income" | "expense" | "all") => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}

export const DashboardTab = ({
  transactions,
  filteredTransactions,
  totals,
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  dateFilter,
  setDateFilter,
  onEdit,
  onDelete,
  onExport,
}: DashboardTabProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlobalAlerts />

      <SummaryCards
        income={totals.income}
        expense={totals.expense}
        balance={totals.balance}
        transactionCount={filteredTransactions.length}
      />

      <div className="flex justify-end px-2">
        <Button
          className="group relative overflow-hidden bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest transition-all"
          onClick={onExport}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <FileText size={18} className="mr-3 text-indigo-400" />
          Relatório PDF Pro
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TransactionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filter={filter}
            setFilter={setFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
          <TransactionList
            transactions={filteredTransactions}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
        <div className="space-y-6">
          <FinancialHealthCard transactions={transactions} totals={totals} />
          <EmergencyFundCard transactions={transactions} />
          <PredictionsCard transactions={transactions} />
        </div>
      </div>
    </div>
  );
};
