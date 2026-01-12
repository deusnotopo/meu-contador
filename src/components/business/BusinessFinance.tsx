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
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="text-primary" size={24} />
            Contabilidade Empresarial
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestão financeira e contábil do seu negócio
          </p>
        </div>

        <Button
          onClick={handleNewTransaction}
          className="gradient-primary border-0 font-semibold"
        >
          <PlusCircle size={18} className="mr-2" />
          Nova Transação
        </Button>
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
