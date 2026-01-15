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
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Premium Header */}
      <div className="premium-card p-6 md:p-10">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/5 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <Building2 size={12} />
              Gestão Empresarial
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">
              Contabilidade <br />
              <span className="premium-gradient-text text-glow-amber">
                PRO Business
              </span>
            </h2>
            <p className="text-slate-400 font-medium max-w-md">
              Gestão contábil e financeira avançada com inteligência de dados
              para o seu negócio.
            </p>
          </div>

          <Button
            onClick={handleNewTransaction}
            className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8 shadow-xl shadow-white/5 transition-all text-xs uppercase tracking-widest"
          >
            <PlusCircle size={18} className="mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit mb-10 overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="dashboard"
            className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2"
          >
            <LayoutDashboard size={14} />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="dre"
            className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2"
          >
            <FileText size={14} />
            DRE
          </TabsTrigger>
          <TabsTrigger
            value="cashflow"
            className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2"
          >
            <TrendingUp size={14} />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-black flex items-center gap-2"
          >
            <Receipt size={14} />
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
