import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionFormData } from "@/types";
import {
  Building2,
  FileText,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { CashFlowSection } from "@/components/business/CashFlowSection";
import { DRESection } from "@/components/business/DRESection";
import { InvoicesSection } from "@/components/business/InvoicesSection";
import { AnalyticsTab } from "@/components/contador/AnalyticsTab";
import { SummaryCards } from "@/components/contador/SummaryCards";
import { TransactionFilters } from "@/components/contador/TransactionFilters";
import { TransactionForm } from "@/components/contador/TransactionForm";
import { TransactionList } from "@/components/contador/TransactionList";
import { BudgetsSection } from "@/components/personal/BudgetsSection";

export const BusinessFinance = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const {
    transactions,
    filteredTransactions,
    filter,
    setFilter,
    dateFilter,
    setDateFilter,
    searchTerm,
    setSearchTerm,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totals,
    categoryData,
    getPieChartData,
    monthlyTrend,
  } = useTransactions("business");

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleSubmit = (formData: TransactionFormData, isEditing: boolean) => {
    if (isEditing && editingTransaction) {
      updateTransaction(editingTransaction.id, formData);
    } else {
      addTransaction(formData);
    }
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const incomeCount = filteredTransactions.filter(
    (t) => t.type === "income"
  ).length;
  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense"
  ).length;

  return (
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-none">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
                <Building2 className="text-amber-400 glow-text" size={32} />
                Contabilidade <span className="text-amber-400">PRO</span>
              </h2>
              <p className="text-lg text-slate-400 font-bold max-w-md">
                Gestão contábil e financeira avançada para o seu negócio.
              </p>
            </div>

            <Button
              onClick={handleNewTransaction}
              size="lg"
              className="btn-premium bg-white text-indigo-950 hover:bg-indigo-50 h-14 px-8 rounded-2xl shadow-premium border-0"
            >
              <PlusCircle size={20} className="mr-2" />
              NOVA TRANSAÇÃO
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-card gap-2"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="dre"
              className="data-[state=active]:bg-card gap-2"
            >
              <FileText size={16} />
              DRE
            </TabsTrigger>
            <TabsTrigger
              value="cashflow"
              className="data-[state=active]:bg-card gap-2"
            >
              <TrendingUp size={16} />
              Fluxo de Caixa
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-card gap-2"
            >
              <Receipt size={16} />
              Notas Fiscais
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transaction Form */}
        {showForm && (
          <TransactionForm
            editingTransaction={editingTransaction}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            scope="business"
          />
        )}

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <SummaryCards
              income={totals.income}
              expense={totals.expense}
              balance={totals.balance}
              transactionCount={filteredTransactions.length}
            />

            <TransactionFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filter={filter}
              setFilter={setFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionList
                transactions={filteredTransactions.slice(0, 5)}
                onEdit={handleEdit}
                onDelete={deleteTransaction}
              />
              <AnalyticsTab
                monthlyTrend={monthlyTrend}
                categoryData={categoryData}
                incomeChartData={getPieChartData("income")}
                expenseChartData={getPieChartData("expense")}
                totals={totals}
                incomeCount={incomeCount}
                expenseCount={expenseCount}
              />
            </div>
          </div>
        )}

        {activeTab === "dre" && <DRESection transactions={transactions} />}

        {activeTab === "cashflow" && (
          <CashFlowSection transactions={transactions} />
        )}

        {activeTab === "invoices" && <InvoicesSection />}
      </div>
  );
};
