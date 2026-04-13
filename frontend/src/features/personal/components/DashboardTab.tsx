import { SummaryCards } from "@/components/contador/SummaryCards";
import { TransactionFilters } from "@/components/contador/TransactionFilters";
import { TransactionList } from "@/components/contador/TransactionList";
import { EmergencyFundCard } from "@/components/personal/EmergencyFundCard";
import { FinancialHealthCard } from "@/components/personal/FinancialHealthCard";
import { GlobalAlerts } from "@/components/personal/GlobalAlerts";
import { PredictionsCard } from "@/components/personal/PredictionsCard";
import { motion } from "framer-motion";
import type { Transaction } from "@/types";
import { FileText, Download } from "lucide-react";

interface DashboardTabProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  totals: { income: number; expense: number; balance: number };
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

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

export const DashboardTab = ({
  transactions, filteredTransactions, totals,
  searchTerm, setSearchTerm, filter, setFilter,
  dateFilter, setDateFilter, onEdit, onDelete, onExport,
}: DashboardTabProps) => {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Global alerts (overdue, budget warnings, etc.) */}
      <motion.div variants={item}>
        <GlobalAlerts />
      </motion.div>

      {/* KPI Summary cards */}
      <motion.div variants={item}>
        <SummaryCards
          income={totals.income}
          expense={totals.expense}
          balance={totals.balance}
          transactionCount={filteredTransactions.length}
        />
      </motion.div>

      {/* Main layout: transactions left, insights right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: transactions ───────────────────────────────────────── */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
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
        </motion.div>

        {/* ── RIGHT: insight sidebar ───────────────────────────────────── */}
        <motion.div variants={item} className="space-y-4">
          {/* PDF export link */}
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 hover:border-white/10 text-xs font-bold uppercase tracking-widest transition-all"
          >
            <FileText size={14} className="text-indigo-400" />
            Exportar Relatório PDF
            <Download size={12} className="ml-auto text-white/20" />
          </button>

          <FinancialHealthCard transactions={transactions} totals={totals} />
          <EmergencyFundCard transactions={transactions} />
          <PredictionsCard transactions={transactions} />
        </motion.div>
      </div>
    </motion.div>
  );
};
